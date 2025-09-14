import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationRequest {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  visaStatus: string;
  preferredLocation: string;
  linkedinProfile?: string;
  portfolioWebsite?: string;
  coverLetter?: string;
  resumeFile: File;
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Parse form data
    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const visaStatus = formData.get("visaStatus") as string;
    const preferredLocation = formData.get("preferredLocation") as string;
    const linkedinProfile = formData.get("linkedinProfile") as string;
    const portfolioWebsite = formData.get("portfolioWebsite") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const resumeFile = formData.get("resumeFile") as File;

    // Validate required fields
    if (!jobId || !fullName || !email || !phone || !visaStatus || !preferredLocation || !resumeFile) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (!allowedTypes.includes(resumeFile.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate unique file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileExtension = resumeFile.name.split(".").pop();
    const fileName = `${fullName.replace(/\s+/g, "_")}_${timestamp}.${fileExtension}`;
    const filePath = `${jobId}/${fileName}`;

    // Upload resume to storage
    const resumeBuffer = await resumeFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, resumeBuffer, {
        contentType: resumeFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload resume" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save application to database
    const { data: application, error: applicationError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        full_name: fullName,
        email: email,
        phone: phone,
        visa_status: visaStatus,
        preferred_location: preferredLocation,
        linkedin_profile: linkedinProfile || null,
        portfolio_website: portfolioWebsite || null,
        cover_letter: coverLetter || null,
        resume_file_name: resumeFile.name,
        resume_file_path: filePath,
      })
      .select()
      .single();

    if (applicationError) {
      console.error("Application save error:", applicationError);
      
      // Clean up uploaded file if database save failed
      await supabase.storage.from("resumes").remove([filePath]);
      
      return new Response(
        JSON.stringify({ error: "Failed to save application" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send confirmation email to applicant
    console.log('Sending confirmation email to:', email);
    const confirmationEmailResponse = await resend.emails.send({
      from: 'Smart Tech Analytics <info@smarttechanalytics.com>',
      to: [email],
      subject: 'Application Received - Smart Tech Analytics',
      html: `
        <h1>Thank you for your application, ${fullName}!</h1>
        <p>We have received your application for the <strong>${job.title}</strong> position.</p>
        <p><strong>Application Details:</strong></p>
        <ul>
          <li>Position: ${job.title}</li>
          <li>Department: ${job.department}</li>
          <li>Location: ${job.location}</li>
          <li>Submitted: ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>We will review your application and get back to you within 5-7 business days.</p>
        <p>Best regards,<br>Smart Tech Analytics HR Team</p>
      `,
    });

    // Send notification email to HR team
    console.log('Sending notification email to: info@smarttechanalytics.com');
    const hrEmailResponse = await resend.emails.send({
      from: email,
      to: ['info@smarttechanalytics.com'],
      subject: `New Job Application: ${job.title} - ${fullName}`,
      html: `
        <h1>New Job Application Received</h1>
        <p><strong>Position:</strong> ${job.title}</p>
        <p><strong>Applicant:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Visa Status:</strong> ${visaStatus}</p>
        <p><strong>Preferred Location:</strong> ${preferredLocation}</p>
        ${linkedinProfile ? `<p><strong>LinkedIn:</strong> <a href="${linkedinProfile}">${linkedinProfile}</a></p>` : ''}
        ${portfolioWebsite ? `<p><strong>Portfolio:</strong> <a href="${portfolioWebsite}">${portfolioWebsite}</a></p>` : ''}
        <p><strong>Department:</strong> ${job.department}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Experience Level:</strong> ${job.experience_level}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        ${coverLetter ? `
        <div>
          <h3>Cover Letter:</h3>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${coverLetter}</p>
        </div>
        ` : ''}
        <p><strong>Resume:</strong> ${resumeFile.name} (stored as: ${filePath})</p>
        <p>Please log into the admin panel to view the full application and resume.</p>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);
    console.log("HR notification sent:", hrEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-application function:", error);
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