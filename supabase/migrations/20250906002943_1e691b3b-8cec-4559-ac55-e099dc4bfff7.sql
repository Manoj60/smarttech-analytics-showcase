-- Drop the restrictive SELECT policy and create a more appropriate one
DROP POLICY IF EXISTS "Prevent public reading of contact submissions" ON public.DIM_USER;

-- Only allow admin users to read submissions (you can modify this later)
-- For now, we'll create a policy that requires authentication
CREATE POLICY "Only authenticated users can read contact submissions" 
ON public.DIM_USER 
FOR SELECT 
USING (auth.role() = 'authenticated');