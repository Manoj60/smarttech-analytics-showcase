import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Job {
  id: string;
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
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, jobs } = await req.json();

    if (!query || !jobs) {
      throw new Error('Query and jobs data are required');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Create a comprehensive job data summary for the AI
    const jobsContext = jobs.map((job: Job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      department: job.department,
      employmentType: job.employment_type,
      experienceLevel: job.experience_level,
      workStatus: job.work_status,
      salaryRange: job.salary_range,
      description: job.description,
      responsibilities: job.responsibilities.join(', '),
      qualifications: job.qualifications.join(', '),
      postedDate: new Date(job.created_at).toLocaleDateString(),
    })).slice(0, 50); // Limit to 50 jobs to avoid token limits

    const systemPrompt = `You are an intelligent job filter assistant. Your task is to filter job listings based on user queries that can include:

- Alphabetical patterns (e.g., "jobs starting with A", "positions containing 'dev'")
- Date-based filters (e.g., "recent jobs", "jobs posted this month", "newest positions")
- Location-based filters (e.g., "remote jobs", "New York positions", "jobs in California")
- Position/title filters (e.g., "developer roles", "senior positions", "manager jobs")
- Experience level filters (e.g., "entry level", "senior roles", "executive positions")
- Employment type filters (e.g., "full-time", "part-time", "contract work")
- Department filters (e.g., "engineering jobs", "marketing positions")
- Salary-based filters (e.g., "high paying jobs", "jobs over 100k")
- Special character or number patterns in job titles or descriptions
- Fuzzy matching and semantic understanding

Analyze the user's query and return ONLY the job IDs that match their criteria as a JSON array of strings. Be intelligent about matching - understand context, synonyms, and intent.

User Query: "${query}"

Available Jobs Data:
${JSON.stringify(jobsContext, null, 2)}

Return only a JSON array of job IDs that match the query. Example: ["id1", "id2", "id3"]`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('AI Filter Response:', aiResponse);

    // Parse the AI response to extract job IDs
    let filteredJobIds: string[] = [];
    try {
      // Try to parse as JSON array
      filteredJobIds = JSON.parse(aiResponse);
      
      // Validate that it's an array of strings
      if (!Array.isArray(filteredJobIds) || !filteredJobIds.every(id => typeof id === 'string')) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: try to extract job IDs from the response text
      const matches = aiResponse.match(/["']([a-f0-9-]{36})["']/g);
      if (matches) {
        filteredJobIds = matches.map(match => match.replace(/["']/g, ''));
      } else {
        // If no valid IDs found, return all jobs (fallback)
        filteredJobIds = jobs.map((job: Job) => job.id);
      }
    }

    // Filter the original jobs based on AI response
    const filteredJobs = jobs.filter((job: Job) => filteredJobIds.includes(job.id));

    return new Response(JSON.stringify({ 
      filteredJobs,
      query,
      matchedCount: filteredJobs.length,
      totalCount: jobs.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-job-filter function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      filteredJobs: [],
      matchedCount: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});