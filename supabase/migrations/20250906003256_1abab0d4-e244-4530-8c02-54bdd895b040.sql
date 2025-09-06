-- Check current policies and fix any remaining security issues
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'DIM_USER';

-- Ensure RLS is enabled
ALTER TABLE public.DIM_USER ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Only service role can read contact submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Only authenticated users can read contact submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Prevent public reading of contact submissions" ON public.DIM_USER;

-- Create secure policies
-- 1. Allow public to insert contact form submissions
CREATE POLICY "Public can submit contact forms" 
ON public.DIM_USER 
FOR INSERT 
WITH CHECK (true);

-- 2. Completely restrict SELECT access - only database admin can read
CREATE POLICY "Admin only can read contact data" 
ON public.DIM_USER 
FOR SELECT 
USING (false);

-- 3. Prevent any updates or deletes by public users
CREATE POLICY "No public updates" 
ON public.DIM_USER 
FOR UPDATE 
USING (false);

CREATE POLICY "No public deletes" 
ON public.DIM_USER 
FOR DELETE 
USING (false);