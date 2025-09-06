-- Fix the exact policy names and ensure maximum security
-- First check what policies actually exist
\d+ public.DIM_USER

-- Drop all existing policies with correct names
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Public can submit contact forms" ON public.DIM_USER;

-- Create the most secure setup possible
-- 1. Allow anonymous users to insert contact forms (for website functionality)
CREATE POLICY "Allow contact form submissions" 
ON public.DIM_USER 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 2. Completely block all SELECT access (no one can read the data via API)
CREATE POLICY "Block all data reading" 
ON public.DIM_USER 
FOR SELECT 
TO anon, authenticated
USING (false);

-- 3. Block all UPDATE operations
CREATE POLICY "Block all updates" 
ON public.DIM_USER 
FOR UPDATE 
TO anon, authenticated
USING (false);

-- 4. Block all DELETE operations  
CREATE POLICY "Block all deletes" 
ON public.DIM_USER 
FOR DELETE 
TO anon, authenticated
USING (false);