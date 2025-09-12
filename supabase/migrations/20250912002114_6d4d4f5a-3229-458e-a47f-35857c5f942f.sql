-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role profiles access" 
ON public.profiles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update jobs table with more admin fields
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(user_id);

-- Update job_applications table with status tracking
ALTER TABLE public.job_applications 
ALTER COLUMN status SET DEFAULT 'pending',
DROP CONSTRAINT IF EXISTS job_applications_status_check,
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('pending', 'in_review', 'interview_scheduled', 'offer_extended', 'rejected'));

-- Add notes field for admin use
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'admin'
  );
$$;

-- Update jobs RLS policies for admin management
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Service role jobs access" ON public.jobs;

CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage jobs" 
ON public.jobs 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Service role jobs access" 
ON public.jobs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update job_applications RLS for admin access
DROP POLICY IF EXISTS "Service role applications access" ON public.job_applications;
DROP POLICY IF EXISTS "Block public applications access" ON public.job_applications;

CREATE POLICY "Admins can view all applications" 
ON public.job_applications 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update applications" 
ON public.job_applications 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role applications access" 
ON public.job_applications 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Block public applications access" 
ON public.job_applications 
FOR INSERT 
USING (false)
WITH CHECK (false);

-- Create an admin user (you'll need to sign up first, then run this)
-- INSERT INTO public.profiles (user_id, email, full_name, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin@smarttechanalytics.com', 'Admin User', 'admin');