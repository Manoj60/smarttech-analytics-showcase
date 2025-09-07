import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userName, userEmail } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get conversation context or create new conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_name: userName,
          user_email: userEmail,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      currentConversationId = newConversation.id;
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
    const systemPrompt = `You are a helpful customer support assistant for this company's website. 
    
    Website Context:
    - This appears to be a business website with sections for Home, Products, Services, Case Studies, and Contact
    - You should help users with general inquiries about the company's services and products
    - For specific technical support or detailed product information, direct users to contact the support team directly
    - Be friendly, professional, and helpful
    - If you don't know something specific about the company, be honest and offer to connect them with a human agent
    
    Keep responses concise and helpful. Always maintain a professional but friendly tone.`;

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

    return new Response(JSON.stringify({ 
      message: aiMessage,
      conversationId: currentConversationId 
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