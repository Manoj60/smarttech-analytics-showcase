import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  userEmail: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, fullName }: AdminNotificationRequest = await req.json();

    console.log(`New user signup notification: ${fullName} (${userEmail})`);

    const emailResponse = await resend.emails.send({
      from: "Smart Tech Analytics <noreply@smarttechanalytics.com>",
      to: ["info@smarttechanalytics.com"],
      subject: "New User Registration",
      html: `
        <h1>New User Registration</h1>
        <p>A new user has registered on Smart Tech Analytics:</p>
        <ul>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Registration Time:</strong> ${new Date().toISOString()}</li>
        </ul>
        <p>Please review the new user registration in your admin dashboard.</p>
        <br>
        <p>Best regards,<br>Smart Tech Analytics System</p>
      `,
    });

    console.log("Admin notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-admin-signup function:", error);
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