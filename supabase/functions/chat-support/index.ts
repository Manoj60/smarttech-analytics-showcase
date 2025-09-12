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
    console.log(`Chat request from IP: ${clientIP.substring(0, 10)}...`); // Log partial IP for privacy
    
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

    const { message, conversationId, conversationSecret, userName, userEmail, action = 'send' } = await req.json();
    
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
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

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

      // Get messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, role, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw new Error('Failed to fetch messages');
      }

      return new Response(JSON.stringify({ messages: messages || [] }), {
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
          conversation_secret: newSecret
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
        role: 'user'
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

    // Create system prompt with website context
    const systemPrompt = `You are a helpful customer support assistant for Smart Tech Analytics, a company that provides advanced technology solutions and analytics services. 

Our company specializes in:
- Data analytics and business intelligence
- Cloud computing solutions  
- AI and machine learning services
- Digital transformation consulting
- Custom software development

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

    // Call OpenAI API with latest GPT-5 model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: messages,
        max_completion_tokens: 500,
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error('Failed to get AI response');
    }

    const aiMessage = aiData.choices[0].message.content;

    // Store AI response
    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiMessage,
        role: 'assistant'
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