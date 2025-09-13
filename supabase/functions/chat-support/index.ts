import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

// Tighter CORS - replace '*' with your actual domain in production  
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Replace with your domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random conversation secret
function generateConversationSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`Chat request from IP: ${clientIP.substring(0, 10)}...`);
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(clientIP, 'chat-support');
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP.substring(0, 10)}...`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please wait before sending another message.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      conversationId, 
      conversationSecret, 
      userName, 
      userEmail, 
      userRole = 'guest',
      threadId,
      threadName,
      action = 'send' 
    } = await req.json();
    console.log('Received request:', { action, userName, userEmail, messageLength: message?.length || 0 });
    
    // Input validation for send action
    if (action !== 'history' && (!message || typeof message !== 'string' || message.trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (userName && (typeof userName !== 'string' || userName.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid user name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (userEmail && (typeof userEmail !== 'string' || userEmail.length > 254 || !isValidEmail(userEmail))) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not set in environment variables');
      throw new Error('DEEPSEEK_API_KEY is not set');
    }
    console.log('DeepSeek API key is configured');

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle message history fetch
    if (action === 'history') {
      if (!conversationId || !conversationSecret) {
        throw new Error('Missing conversation ID or secret for history request');
      }

      // Verify conversation access
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('conversation_secret', conversationSecret)
        .maybeSingle();

      if (!conversation) {
        throw new Error('Invalid conversation access');
      }

      // Get messages for this conversation with thread info
      let messagesQuery = supabase
        .from('messages')
        .select('id, content, role, created_at, thread_id')
        .eq('conversation_id', conversationId);

      // Filter by thread if specified
      if (threadId) {
        messagesQuery = messagesQuery.eq('thread_id', threadId);
      } else {
        messagesQuery = messagesQuery.is('thread_id', null);
      }

      const { data: messages, error: messagesError } = await messagesQuery
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw new Error('Failed to fetch messages');
      }

      // Get available threads for this conversation
      const { data: threads } = await supabase
        .from('conversation_threads')
        .select('id, thread_name, created_by, created_at, is_active')
        .eq('conversation_id', conversationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      return new Response(JSON.stringify({ 
        messages: messages || [], 
        threads: threads || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle thread management actions
    if (action === 'create_thread') {
      if (!conversationId || !conversationSecret || !threadName) {
        throw new Error('Missing required parameters for thread creation');
      }

      // Verify conversation access
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('conversation_secret', conversationSecret)
        .maybeSingle();

      if (!conversation) {
        throw new Error('Invalid conversation access');
      }

      // Create new thread
      const { data: newThread, error: threadError } = await supabase
        .from('conversation_threads')
        .insert({
          conversation_id: conversationId,
          thread_name: threadName,
          created_by: userName || 'Anonymous'
        })
        .select()
        .single();

      if (threadError) {
        console.error('Error creating thread:', threadError);
        throw new Error('Failed to create thread');
      }

      return new Response(JSON.stringify({ thread: newThread }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'close_thread') {
      if (!conversationId || !conversationSecret || !threadId) {
        throw new Error('Missing required parameters for thread closure');
      }

      // Verify conversation access
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('conversation_secret', conversationSecret)
        .maybeSingle();

      if (!conversation) {
        throw new Error('Invalid conversation access');
      }

      // Close thread
      const { error: closeError } = await supabase
        .from('conversation_threads')
        .update({ is_active: false })
        .eq('id', threadId)
        .eq('conversation_id', conversationId);

      if (closeError) {
        console.error('Error closing thread:', closeError);
        throw new Error('Failed to close thread');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate message length for send action
    if (message && message.length > 2000) {
      throw new Error('Message too long. Maximum 2000 characters allowed.');
    }

    // Get conversation context or create new conversation
    let currentConversationId = conversationId;
    let currentConversationSecret = conversationSecret;
    
    if (!currentConversationId) {
      // Create new conversation with secret
      const newSecret = generateConversationSecret();
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_name: userName,
          user_email: userEmail,
          status: 'active',
          conversation_secret: newSecret,
          user_role: userRole,
          last_activity_at: new Date().toISOString(),
          timeout_at: new Date(Date.now() + getTimeoutMinutes(userRole) * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      currentConversationId = newConversation.id;
      currentConversationSecret = newSecret;
    } else {
      // Verify conversation access for existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('conversation_secret', conversationSecret)
        .maybeSingle();

      if (!existingConversation) {
        throw new Error('Invalid conversation access');
      }
    }

    // Store user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: message,
        role: 'user',
        thread_id: threadId || null
      });

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      throw new Error('Failed to store user message');
    }

    // Send notification email for new chat message
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      await resend.emails.send({
        from: 'Smart Tech Analytics <info@smarttechanalytics.com>',
        to: ['info@smarttechanalytics.com'],
        subject: `New Chat Message from ${userName}`,
        html: `
          <h2>New Chat Support Message</h2>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Conversation ID:</strong> ${currentConversationId}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p><small>Received at: ${new Date().toISOString()}</small></p>
        `,
      });
      console.log('Chat notification email sent successfully');
    } catch (emailError: any) {
      console.error('Failed to send chat notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Get conversation history
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      throw new Error('Failed to fetch message history');
    }

    // Search relevant context from website and database
    const contextInfo = await searchRelevantContext(supabase, message, userName, userEmail);
    
    // Create enhanced system prompt with context integration
    const systemPrompt = `You are a helpful customer support assistant for Smart Tech Analytics, a company that provides advanced technology solutions and analytics services. 

Our company specializes in:
- Data analytics and business intelligence
- Cloud computing solutions  
- AI and machine learning services
- Digital transformation consulting
- Custom software development

CONTEXT INTEGRATION INSTRUCTIONS:
Before answering user questions, you have access to:
1. Website content and documentation 
2. Database records (user data, product info, transaction history)
3. Previous conversation context

When responding:
- Synthesize information from all available sources
- Provide comprehensive answers combining website content and database insights
- Cite which sources informed your response when relevant
- Always prioritize accuracy and completeness

${contextInfo.length > 0 ? `\nRELEVANT CONTEXT FOR THIS QUERY:\n${contextInfo.join('\n')}\n` : ''}

You should be friendly, professional, and knowledgeable about our services. Help customers with:
- Product information and features
- Technical support questions
- Pricing and plan comparisons
- Account setup and troubleshooting
- General inquiries about our technology solutions

The customer's name is ${userName} and their email is ${userEmail}. Always maintain a helpful and solution-oriented tone.`;

    // Format conversation history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...messageHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // Call DeepSeek API
    console.log('Calling DeepSeek API with model: deepseek-chat');
    console.log('API endpoint: https://api.deepseek.com/chat/completions');
    console.log('Message count:', messages.length);
    
    const requestBody = {
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const aiData = await response.json();
    console.log('DeepSeek API response status:', response.status);
    console.log('DeepSeek API response data:', aiData);
    
    if (!response.ok) {
      console.error('DeepSeek API error:', aiData);
      let errorMessage = 'Failed to get AI response';
      
      // Handle specific DeepSeek error codes
      if (response.status === 401) {
        errorMessage = 'DeepSeek API authentication failed. Please check your API key.';
      } else if (response.status === 402) {
        errorMessage = 'DeepSeek API: Insufficient balance. Please add funds to your account.';
      } else if (response.status === 429) {
        errorMessage = 'DeepSeek API: Rate limit reached. Please try again later.';
      } else if (response.status >= 500) {
        errorMessage = 'DeepSeek API server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    const aiMessage = aiData.choices[0].message.content;
    console.log('AI response generated successfully, length:', aiMessage.length);

    // Store AI response
    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiMessage,
        role: 'assistant',
        thread_id: threadId || null
      });

    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
      throw new Error('Failed to store AI message');
    }

    // Get updated message history to return
    const { data: updatedMessages } = await supabase
      .from('messages')
      .select('id, content, role, created_at')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    return new Response(JSON.stringify({ 
      message: aiMessage,
      conversationId: currentConversationId,
      conversationSecret: currentConversationSecret,
      messages: updatedMessages || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-support function:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Rate limiting function
async function checkRateLimit(ip: string, functionName: string): Promise<{ allowed: boolean }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() - 60000); // 1 minute window
  
  try {
    // Clean up old rate limit records
    await supabase
      .from('function_rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

    // Check current rate
    const { data: existing } = await supabase
      .from('function_rate_limits')
      .select('request_count')
      .eq('ip_address', ip)
      .eq('function_name', functionName)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (existing && existing.request_count >= 20) { // 20 requests per minute limit
      return { allowed: false };
    }

    // Update or insert rate limit record
    if (existing) {
      await supabase
        .from('function_rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('ip_address', ip)
        .eq('function_name', functionName);
    } else {
      await supabase
        .from('function_rate_limits')
        .insert({
          ip_address: ip,
          function_name: functionName,
          request_count: 1,
          window_start: now.toISOString()
        });
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
    return { allowed: true }; // Allow on error to avoid blocking legitimate users
  }
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Search for relevant context from website content and database
async function searchRelevantContext(supabase: any, userMessage: string, userName: string, userEmail: string): Promise<string[]> {
  const contextSources: string[] = [];
  
  try {
    // 1. Search for user-specific data in profiles
    if (userEmail) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (userProfile) {
        contextSources.push(`User Profile: ${userName} (${userEmail}) - Role: ${userProfile.role || 'Standard'}, Account Status: ${userProfile.status || 'Active'}`);
      }
    }
    
    // 2. Search job applications if query relates to careers/jobs
    const careerKeywords = ['job', 'career', 'application', 'position', 'hiring', 'employment', 'work'];
    if (careerKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      const { data: applications } = await supabase
        .from('job_applications')
        .select('*, jobs(title, department)')
        .eq('email', userEmail)
        .limit(3);
      
      if (applications && applications.length > 0) {
        contextSources.push(`Job Applications: User has ${applications.length} application(s) - Latest: ${applications[0].jobs?.title} in ${applications[0].jobs?.department}`);
      }
      
      // Get available job listings
      const { data: activeJobs } = await supabase
        .from('jobs')
        .select('title, department, employment_type')
        .eq('is_active', true)
        .limit(5);
      
      if (activeJobs && activeJobs.length > 0) {
        contextSources.push(`Available Positions: ${activeJobs.map(job => `${job.title} (${job.department})`).join(', ')}`);
      }
    }
    
    // 3. Contact information queries
    const contactKeywords = ['contact', 'phone', 'email', 'address', 'office', 'reach', 'call', 'hours', 'location'];
    if (contactKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      contextSources.push(`Website Contact Information: 
        - Email: info@smarttechanalytics.com
        - Phone: 657 216 0194
        - Office Location: Boulder, Colorado, United States
        - Business Hours: Monday-Friday 9:00 AM - 6:00 PM EST, Saturday 10:00 AM - 2:00 PM EST, Sunday Closed
        - LinkedIn: https://www.linkedin.com/company/smarttechanalytics/?viewAsMember=true`);
    }
    
    // 4. Leadership information queries
    const leadershipKeywords = ['ceo', 'leader', 'leadership', 'founder', 'president', 'executive', 'who is', 'head'];
    if (leadershipKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      contextSources.push(`Company Leadership: 
        - CEO: Manoj Regmi, Chief Executive Officer
        - Background: Over 16 years of overall experience in IT and non-IT, leading high-caliber data domain & digital transformation initiatives at S&P 500 companies, author of two books, and published 15+ articles about business and technical aspects`);
    }
    
    // 4. Website content context based on keywords
    const serviceKeywords = ['analytics', 'cloud', 'ai', 'machine learning', 'consulting', 'software development'];
    const mentionedServices = serviceKeywords.filter(service => 
      userMessage.toLowerCase().includes(service)
    );
    
    if (mentionedServices.length > 0) {
      contextSources.push(`Relevant Services: User asking about ${mentionedServices.join(', ')} - These are core Smart Tech Analytics offerings`);
    }
    
    // 5. Technical support context
    const techKeywords = ['error', 'bug', 'issue', 'problem', 'not working', 'help', 'support'];
    if (techKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      contextSources.push(`Technical Support: User reporting technical issue - Prioritize troubleshooting and solution-oriented responses`);
    }
    
  } catch (error) {
    console.error('Error searching context:', error);
    contextSources.push('Context Search: Limited context available due to search error');
  }
  
  return contextSources;
}

// Get timeout duration based on user role
function getTimeoutMinutes(userRole: string): number {
  switch (userRole) {
    case 'admin':
    case 'premium':
      return 60; // 60 minutes
    case 'user':
      return 30; // 30 minutes
    default:
      return 15; // 15 minutes for guests
  }
}