import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryRequest {
  query: string;
  files?: Array<{
    name: string;
    type: string;
    hasText: boolean;
    extractedText?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, files = [] }: QueryRequest = await req.json();
    
    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing query:', query);

    // Only gather context if no files are provided
    // When files are shared, focus only on file content
    let fullContext;
    
    if (files.length > 0) {
      // File-only mode: only process file content
      fullContext = {
        files: files,
        file_mode: true
      };
      console.log('File-only mode: Processing uploaded files without additional context');
    } else {
      // Normal mode: gather website and database context
      const websiteContext = await gatherWebsiteContext(query);
      const databaseContext = await gatherDatabaseContext(supabase, query);
      
      fullContext = {
        website: websiteContext,
        database: databaseContext,
        files: files,
        file_mode: false
      };
    }

    console.log('Context gathered:', fullContext);

    // Generate AI response
    const aiResponse = await generateAIResponse(deepseekApiKey, query, fullContext);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context_used: fullContext.file_mode ? {
          files_provided: files.length,
          mode: 'file_only'
        } : {
          website_sections: fullContext.website.sections.length,
          database_records: fullContext.database.records_found,
          files_provided: files.length,
          mode: 'full_context'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-query-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback_response: "I apologize, but I'm experiencing technical difficulties. Please try again later or contact our support team for assistance."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherWebsiteContext(query: string) {
  const lowerQuery = query.toLowerCase();
  const sections = [];

  // Company information
  const companyInfo = {
    name: "Smart Tech Analytics",
    description: "Leading AI and analytics solutions company",
    services: [
      "AI-powered demand forecasting",
      "Predictive patient analytics", 
      "Smart factory optimization",
      "Data analytics and insights",
      "Machine learning solutions",
      "Business intelligence"
    ],
    industries: [
      "Financial Services", "Healthcare", "Retail & E-commerce", 
      "Manufacturing", "Energy & Utilities", "Technology", 
      "Government", "Education"
    ]
  };

  // Case studies data
  const caseStudies = [
    {
      title: "Global Retail Chain: AI-Powered Demand Forecasting",
      industry: "Retail & E-commerce",
      challenge: "Inventory management across 2,000+ stores, frequent stockouts and overstock situations",
      solution: "AI-powered demand forecasting platform with real-time data integration",
      results: ["40% reduction in stockouts", "25% decrease in excess inventory", "$35M annual cost savings", "15% improvement in customer satisfaction"],
      roi: "350%"
    },
    {
      title: "Healthcare Network: Predictive Patient Analytics", 
      industry: "Healthcare",
      challenge: "Emergency department overcrowding, inefficient bed management, high readmission rates",
      solution: "Predictive analytics platform for patient risk scoring and resource optimization",
      results: ["22% reduction in patient readmissions", "30% improvement in bed utilization", "45 minutes average reduction in ED wait times", "$12M annual savings"],
      roi: "420%"
    },
    {
      title: "Manufacturing Giant: Smart Factory Optimization",
      industry: "Manufacturing", 
      challenge: "Unpredictable equipment failures, suboptimal production scheduling, quality control issues",
      solution: "Industrial IoT and AI-driven smart factory solution with predictive maintenance",
      results: ["35% increase in overall equipment effectiveness", "60% reduction in unplanned downtime", "20% improvement in production throughput", "$25M annual operational savings"],
      roi: "280%"
    }
  ];

  // Add relevant sections based on query content
  if (lowerQuery.includes('company') || lowerQuery.includes('about') || lowerQuery.includes('who')) {
    sections.push({
      type: 'company_info',
      content: companyInfo
    });
  }

  if (lowerQuery.includes('case') || lowerQuery.includes('study') || lowerQuery.includes('success') || lowerQuery.includes('client')) {
    sections.push({
      type: 'case_studies',
      content: caseStudies
    });
  }

  if (lowerQuery.includes('service') || lowerQuery.includes('solution') || lowerQuery.includes('ai') || lowerQuery.includes('analytics')) {
    sections.push({
      type: 'services',
      content: companyInfo.services
    });
  }

  if (lowerQuery.includes('industry') || lowerQuery.includes('sector')) {
    sections.push({
      type: 'industries',
      content: companyInfo.industries
    });
  }

  // For healthcare queries
  if (lowerQuery.includes('health') || lowerQuery.includes('hospital') || lowerQuery.includes('patient')) {
    sections.push({
      type: 'healthcare_expertise',
      content: {
        leader: "Samikshya Adhikari, Head of Health Services, with over a decade of experience in various Hospitals, including burn and critical care services",
        case_study: caseStudies.find(cs => cs.industry === 'Healthcare')
      }
    });
  }

  // For retail queries  
  if (lowerQuery.includes('retail') || lowerQuery.includes('inventory') || lowerQuery.includes('demand')) {
    sections.push({
      type: 'retail_expertise',
      content: caseStudies.find(cs => cs.industry === 'Retail & E-commerce')
    });
  }

  // For manufacturing queries
  if (lowerQuery.includes('manufacturing') || lowerQuery.includes('factory') || lowerQuery.includes('production')) {
    sections.push({
      type: 'manufacturing_expertise', 
      content: caseStudies.find(cs => cs.industry === 'Manufacturing')
    });
  }

  return { sections, total_sections: sections.length };
}

async function gatherDatabaseContext(supabase: any, query: string) {
  const lowerQuery = query.toLowerCase();
  let records_found = 0;
  const context = {
    jobs: [],
    applications: [],
    conversations: []
  };

  try {
    // Search jobs if query is about careers, jobs, positions
    if (lowerQuery.includes('job') || lowerQuery.includes('career') || lowerQuery.includes('position') || lowerQuery.includes('hiring')) {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      if (!error && jobs) {
        context.jobs = jobs;
        records_found += jobs.length;
      }
    }

    // Search for conversation patterns if query is about support or common questions
    if (lowerQuery.includes('support') || lowerQuery.includes('help') || lowerQuery.includes('question')) {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(3);
      
      if (!error && conversations) {
        context.conversations = conversations;
        records_found += conversations.length;
      }
    }

  } catch (error) {
    console.error('Database context error:', error);
  }

  return { ...context, records_found };
}

async function generateAIResponse(apiKey: string, query: string, context: any) {
  let systemPrompt;
  let enhancedQuery;
  
  if (context.file_mode) {
    // File-only mode: Focus only on analyzing file content
    systemPrompt = `You are an expert document and image analyst. Your role is to:

- Analyze the content of uploaded files (documents, images, data) thoroughly
- Extract key information, insights, and patterns from the content
- Provide clear, actionable analysis of what you find
- Focus solely on the file content without referencing external company information
- Be comprehensive in your analysis of charts, graphs, text, or visual elements
- Identify important data points, trends, or business insights from the content

When analyzing files:
- Describe what you see or read in detail
- Extract all relevant text, numbers, and data points
- Identify any patterns, trends, or insights
- Summarize key findings and their potential implications
- Be objective and focus on the actual content provided

Respond with detailed analysis of the uploaded content only.`;

    enhancedQuery = `User Query: ${query}\n\nAnalyze the following file content:`;
    
    if (context.files && context.files.length > 0) {
      context.files.forEach((file: any, index: number) => {
        if (file.extractedText) {
          enhancedQuery += `\n\nFile ${index + 1}: ${file.name} (${file.type})\nContent: ${file.extractedText}`;
        }
      });
    }
  } else {
    // Normal mode: Company context and services
    systemPrompt = `You are an AI assistant for Smart Tech Analytics, a leading AI and analytics solutions company. 

Your role is to:
- Answer questions about the company's services, case studies, and expertise
- Provide helpful information about AI and analytics solutions
- Guide users toward relevant services based on their needs
- Be professional, knowledgeable, and helpful

Company Overview:
Smart Tech Analytics specializes in AI-powered solutions including demand forecasting, predictive analytics, smart factory optimization, and business intelligence across industries like healthcare, retail, manufacturing, finance, and more.

Key Leadership:
- Samikshya Adhikari: Head of Health Services with over a decade of hospital experience including burn and critical care services

Use the provided context to give accurate, specific answers. If you don't have specific information, provide general guidance about how the company can help and suggest contacting the team for detailed consultation.

Always maintain a professional but approachable tone, and focus on how Smart Tech Analytics can solve the user's business challenges.`;

    const contextString = JSON.stringify(context, null, 2);
    enhancedQuery = `Context from website and database: ${contextString}\n\nUser Query: ${query}`;
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedQuery }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}