-- Strengthen job_applications RLS by explicitly blocking PUBLIC access

-- Remove any prior conflicting policy if present
DROP POLICY IF EXISTS "Block all public access to applications" ON public.job_applications;

-- Explicitly deny access to PUBLIC (defense-in-depth)
CREATE POLICY "Block all public access to applications" ON public.job_applications
FOR ALL
TO public
USING (false)
WITH CHECK (false);