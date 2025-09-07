import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const { message, conversationId, conversationSecret, userName, userEmail, action = 'send' } = await req.json();
    
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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
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
    console.error('Error in chat-support function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});