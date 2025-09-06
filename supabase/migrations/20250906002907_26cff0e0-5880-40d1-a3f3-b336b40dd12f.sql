-- Create the DIM_USER table for contact form submissions
CREATE TABLE IF NOT EXISTS public.DIM_USER (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_name VARCHAR(256) NOT NULL,
  email_address VARCHAR(256) NOT NULL,
  message_description TEXT NOT NULL DEFAULT ''
);

-- Enable Row Level Security
ALTER TABLE public.DIM_USER ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert contact form submissions
CREATE POLICY "Allow public contact form submissions" 
ON public.DIM_USER 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent public reading of contact submissions
CREATE POLICY "Prevent public reading of contact submissions" 
ON public.DIM_USER 
FOR SELECT 
USING (false);