import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobRequest {
  title: string;
  company: string;
  location: string;
  department: string;
  employment_type: string;
  experience_level: string;
  work_status: string;
  salary_range: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  application_deadline: string;
  created_by: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const jobData: JobRequest = await req.json();

    // Validate required fields
    if (!jobData.title || !jobData.company || !jobData.location || !jobData.department || 
        !jobData.employment_type || !jobData.experience_level || !jobData.description ||
        !jobData.responsibilities || !jobData.qualifications) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create job in database
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        department: jobData.department,
        employment_type: jobData.employment_type,
        experience_level: jobData.experience_level,
        work_status: jobData.work_status,
        salary_range: jobData.salary_range,
        description: jobData.description,
        responsibilities: jobData.responsibilities,
        qualifications: jobData.qualifications,
        application_deadline: jobData.application_deadline,
        created_by: jobData.created_by,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return new Response(
        JSON.stringify({ error: "Failed to create job" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send emails using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      // Send notification email to admin
      console.log('Sending job creation notification to: info@smarttechanalytics.com');
      const adminEmailResponse = await resend.emails.send({
        from: 'Smart Tech Analytics <no-reply@smarttechanalytics.com>',
        to: ['info@smarttechanalytics.com'],
        subject: `New Job Posted: ${jobData.title}`,
        html: `
          <h2>New Job Posting Created</h2>
          <p>A new job posting has been created and is now live on the careers page.</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Job Details:</h3>
            <p><strong>Title:</strong> ${jobData.title}</p>
            <p><strong>Company:</strong> ${jobData.company}</p>
            <p><strong>Department:</strong> ${jobData.department}</p>
            <p><strong>Location:</strong> ${jobData.location}</p>
            <p><strong>Employment Type:</strong> ${jobData.employment_type}</p>
            <p><strong>Experience Level:</strong> ${jobData.experience_level}</p>
            <p><strong>Work Status:</strong> ${jobData.work_status}</p>
            ${jobData.salary_range ? `<p><strong>Salary Range:</strong> ${jobData.salary_range}</p>` : ''}
            ${jobData.application_deadline ? `<p><strong>Application Deadline:</strong> ${new Date(jobData.application_deadline).toLocaleDateString()}</p>` : ''}
          </div>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Description:</h3>
            <p>${jobData.description.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Responsibilities:</h3>
            <ul>
              ${jobData.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>
          </div>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Qualifications:</h3>
            <ul>
              ${jobData.qualifications.map(qual => `<li>${qual}</li>`).join('')}
            </ul>
          </div>
          <hr>
          <p><small>Job ID: ${job.id}</small></p>
          <p><small>Created at: ${new Date().toISOString()}</small></p>
          <p>You can manage this job posting from the admin dashboard.</p>
        `,
      });
      console.log('Admin notification email sent:', adminEmailResponse);

      console.log('Job creation email sent successfully');
    } catch (emailError: any) {
      console.error('Failed to send job creation email:', emailError);
      console.error('Email error details:', JSON.stringify(emailError, null, 2));
      // Don't fail the request if email fails, as job is already created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Job created successfully",
        jobId: job.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-job function:", error);
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