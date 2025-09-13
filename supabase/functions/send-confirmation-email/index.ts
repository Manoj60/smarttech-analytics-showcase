import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  confirmationUrl: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Confirmation email function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { email, confirmationUrl, fullName }: ConfirmationEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Smart Tech Analytics <noreply@smarttechanalytics.com>",
      to: [email],
      subject: "Confirm Your Account - Smart Tech Analytics",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Confirm Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Smart Tech Analytics!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hi ${fullName || 'there'}!</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for signing up with Smart Tech Analytics. To complete your account setup and gain access to our platform, please confirm your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block; 
                        font-size: 16px;">
                Confirm Your Account
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; font-size: 14px; color: #667eea; background: #f1f3f4; padding: 10px; border-radius: 5px;">
              ${confirmationUrl}
            </p>
            
            <hr style="border: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              If you didn't create an account with Smart Tech Analytics, you can safely ignore this email.
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
              © 2024 Smart Tech Analytics. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);