-- Create maximum security policies for contact form data
-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Public can submit contact forms" ON public.DIM_USER;
DROP POLICY IF EXISTS "Only service role can read contact submissions" ON public.DIM_USER;
DROP POLICY IF EXISTS "Admin only can read contact data" ON public.DIM_USER;
DROP POLICY IF EXISTS "Block all data reading" ON public.DIM_USER;

-- 1. Allow contact form submissions (essential for website functionality)
CREATE POLICY "Contact form submissions allowed" 
ON public.DIM_USER 
FOR INSERT 
WITH CHECK (true);

-- 2. Completely prevent any reading of customer data
-- This ensures no hacker can access email addresses or personal information
CREATE POLICY "Prevent all data access" 
ON public.DIM_USER 
FOR SELECT 
USING (false);

-- 3. Prevent updates to protect data integrity
CREATE POLICY "Prevent data modifications" 
ON public.DIM_USER 
FOR UPDATE 
USING (false);

-- 4. Prevent deletions to maintain audit trail
CREATE POLICY "Prevent data deletion" 
ON public.DIM_USER 
FOR DELETE 
USING (false);