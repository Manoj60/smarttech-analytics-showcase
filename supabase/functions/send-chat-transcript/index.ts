import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptRequest {
  userName: string;
  userEmail: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
  }>;
  reason: 'manual_close' | 'timeout' | 'user_close';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { userName, userEmail, messages, reason }: TranscriptRequest = await req.json();

    // Validate required fields
    if (!userName || !userEmail || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Format messages for email
    const formatMessages = () => {
      if (messages.length === 0) {
        return '<p style="color: #666; font-style: italic;">No messages were exchanged in this conversation.</p>';
      }

      return messages.map(msg => {
        const time = new Date(msg.created_at).toLocaleString();
        const isUser = msg.role === 'user';
        const bgColor = isUser ? '#e3f2fd' : '#f5f5f5';
        const sender = isUser ? userName : 'Support Assistant';
        
        return `
          <div style="margin: 10px 0; padding: 12px; background-color: ${bgColor}; border-radius: 8px; border-left: 4px solid ${isUser ? '#1976d2' : '#666'};">
            <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
              ${sender} <span style="font-weight: normal; color: #666; font-size: 12px;">${time}</span>
            </div>
            <div style="color: #333; white-space: pre-wrap;">${msg.content}</div>
          </div>
        `;
      }).join('');
    };

    const reasonText = {
      'manual_close': 'manually closed',
      'timeout': 'automatically closed due to inactivity',
      'user_close': 'ended by user'
    }[reason] || 'ended';

    // Send transcript email to user
    const emailResponse = await resend.emails.send({
      from: 'Smart Tech Analytics <no-reply@smarttechanalytics.com>',
      to: [userEmail],
      subject: 'Your Chat Transcript - Smart Tech Analytics Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">Chat Transcript</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Smart Tech Analytics Support</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <h3 style="color: #333; margin-top: 0;">Hi ${userName},</h3>
            <p style="color: #666; line-height: 1.6;">
              Thank you for contacting Smart Tech Analytics support. Your chat session was ${reasonText} on ${new Date().toLocaleString()}.
              Below is the complete transcript of your conversation:
            </p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
              <h4 style="color: #333; margin: 0 0 15px 0;">Conversation History:</h4>
              ${formatMessages()}
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4caf50;">
              <p style="margin: 0; color: #333; font-weight: 500;">Need further assistance?</p>
              <p style="margin: 10px 0 0 0; color: #666;">
                Feel free to start a new chat session or contact us directly at info@smarttechanalytics.com
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; line-height: 1.5;">
              This is an automated message from Smart Tech Analytics support system.<br>
              If you have any questions about this transcript, please contact us at info@smarttechanalytics.com
            </p>
          </div>
        </div>
      `,
    });

    console.log('Chat transcript sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Transcript sent successfully",
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error sending chat transcript:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send transcript",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);