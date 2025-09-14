-- Lock down job_applications RLS: admin-only access, remove permissive policies

-- Ensure RLS is enabled
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive or duplicate policies that may allow public/anon access
DROP POLICY IF EXISTS "Service role applications access" ON public.job_applications;
DROP POLICY IF EXISTS "Service role can manage applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.job_applications;
DROP POLICY IF EXISTS "Only admins can view applications" ON public.job_applications;
DROP POLICY IF EXISTS "Only admins can update applications" ON public.job_applications;
DROP POLICY IF EXISTS "Only admins can delete applications" ON public.job_applications;

-- Re-create least-privilege, explicit admin-only policies
CREATE POLICY "Admins can select job applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert job applications"
ON public.job_applications
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update job applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete job applications"
ON public.job_applications
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));