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
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role jobs access" 
ON public.jobs 
FOR ALL 
USING (true);

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
USING (true);

CREATE POLICY "Allow application submissions" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();