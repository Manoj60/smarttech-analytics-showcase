import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Parse request body
    const { name, email, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: name, email, and message are required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key for backend operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store contact form submission in database
    const { data, error } = await supabase
      .from('DIM_USER')
      .insert({
        user_name: name.trim(),
        email_address: email.trim(),
        message_description: message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save contact information' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Contact form submission saved:', data);

    // Send email notification via NameCheap SMTP
    try {
      const client = new SMTPClient({
        connection: {
          hostname: Deno.env.get('NAMECHEAP_SMTP_HOST') ?? 'mail.privateemail.com',
          port: parseInt(Deno.env.get('NAMECHEAP_SMTP_PORT') ?? '587'),
          tls: true,
          auth: {
            username: Deno.env.get('NAMECHEAP_SMTP_USERNAME') ?? '',
            password: Deno.env.get('NAMECHEAP_SMTP_PASSWORD') ?? '',
          },
        },
      });

      await client.send({
        from: "info@smarttechanalytics.com",
        to: "info@smarttechanalytics.com",
        subject: `New Contact Form Submission from ${name}`,
        content: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Submission ID: ${data.id}</small></p>
          <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        `,
        html: true,
      });

      await client.close();
      console.log('Email notification sent successfully');

    } catch (emailError: any) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails, as data is already saved
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully',
        id: data.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in contact-form function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);