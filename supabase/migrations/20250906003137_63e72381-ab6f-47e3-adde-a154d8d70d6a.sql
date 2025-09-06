-- Fix critical security vulnerability: Remove public access to contact form data
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Only authenticated users can read contact submissions" ON public.DIM_USER;

-- Create a restrictive policy that only allows service role access
-- This means only administrators via Supabase dashboard can view contact submissions
CREATE POLICY "Only service role can read contact submissions" 
ON public.DIM_USER 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Keep the INSERT policy for public contact form submissions
-- This policy already exists and is secure for public use