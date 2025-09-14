-- Fix job_applications table RLS policies to prevent public access to sensitive data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow authenticated application submissions" ON public.job_applications;
DROP POLICY IF EXISTS "Allow anonymous application submissions" ON public.job_applications;
DROP POLICY IF EXISTS "Deny public application access" ON public.job_applications;

-- Create secure policies that only allow:
-- 1. Service role to insert applications (for edge function)
-- 2. Admins to view and manage all applications
-- 3. No public access to sensitive personal data

-- Service role can insert applications (used by submit-application edge function)
CREATE POLICY "Service role can manage applications" ON public.job_applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Only admins can view applications" ON public.job_applications
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Only admins can update applications
CREATE POLICY "Only admins can update applications" ON public.job_applications
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete applications
CREATE POLICY "Only admins can delete applications" ON public.job_applications
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Block all anonymous/public access to applications table
CREATE POLICY "Block all anonymous access to applications" ON public.job_applications
FOR ALL
TO anon
USING (false)
WITH CHECK (false);