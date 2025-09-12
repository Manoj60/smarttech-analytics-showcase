-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Executive')),
  salary_range TEXT,
  description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  linkedin_profile TEXT,
  portfolio_website TEXT,
  cover_letter TEXT,
  resume_file_name TEXT NOT NULL,
  resume_file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs (public read, service role full access)
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role jobs access" 
ON public.jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for job_applications (service role only)
CREATE POLICY "Service role applications access" 
ON public.job_applications 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Block public applications access" 
ON public.job_applications 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create storage policies for resumes
CREATE POLICY "Service role resume access" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Block public resume access" 
ON storage.objects 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create trigger for updating timestamps
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample job data
INSERT INTO public.jobs (title, location, department, employment_type, experience_level, salary_range, description, responsibilities, qualifications) VALUES
('Senior Data Scientist', 'Remote', 'Data Science', 'Full-time', 'Senior', '$120,000 - $150,000', 'Join our data science team to build advanced analytics solutions and machine learning models that drive business insights.', 
 ARRAY['Develop and deploy machine learning models', 'Analyze large datasets to extract insights', 'Collaborate with cross-functional teams', 'Present findings to stakeholders'],
 ARRAY['5+ years of data science experience', 'Proficiency in Python and R', 'Experience with ML frameworks (TensorFlow, PyTorch)', 'Strong statistical analysis skills', 'PhD or Masters in related field preferred']),

('Frontend Developer', 'New York, NY', 'Engineering', 'Full-time', 'Mid', '$90,000 - $120,000', 'Build responsive web applications using modern frontend technologies and contribute to our design system.', 
 ARRAY['Develop user-facing features', 'Optimize applications for performance', 'Collaborate with designers and backend developers', 'Write clean, maintainable code'],
 ARRAY['3+ years of frontend development', 'Expert in React, TypeScript, and CSS', 'Experience with modern build tools', 'Knowledge of responsive design principles', 'Bachelor''s degree in Computer Science or equivalent']),

('Product Marketing Manager', 'San Francisco, CA', 'Marketing', 'Full-time', 'Mid', '$100,000 - $130,000', 'Drive product positioning, messaging, and go-to-market strategies for our SaaS platform.', 
 ARRAY['Develop product messaging and positioning', 'Create marketing collateral and campaigns', 'Conduct market research and competitive analysis', 'Work with sales team on enablement'],
 ARRAY['4+ years product marketing experience', 'Experience in B2B SaaS', 'Strong analytical and communication skills', 'MBA preferred', 'Experience with marketing automation tools']),

('Data Analyst Intern', 'Remote', 'Data Science', 'Internship', 'Entry', '$25/hour', 'Summer internship opportunity to gain hands-on experience in data analysis and business intelligence.', 
 ARRAY['Assist with data collection and cleaning', 'Create dashboards and reports', 'Support data science team projects', 'Learn advanced analytics techniques'],
 ARRAY['Currently pursuing degree in relevant field', 'Basic knowledge of SQL and Excel', 'Familiarity with Python or R preferred', 'Strong attention to detail', 'Excellent problem-solving skills']);