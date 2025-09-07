-- Ultra-secure lockdown - completely isolate public from sensitive data
-- Use explicit role targeting to eliminate any ambiguity

-- Drop all policies to start completely fresh
DROP POLICY IF EXISTS "Block all conversation access" ON public.conversations;
DROP POLICY IF EXISTS "Service role only access" ON public.conversations;
DROP POLICY IF EXISTS "Block all message access" ON public.messages;  
DROP POLICY IF EXISTS "Service role only message access" ON public.messages;

-- Create explicit denying policies for public role first
CREATE POLICY "Deny public conversation access"
ON public.conversations
FOR ALL
TO public, anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny public message access" 
ON public.messages
FOR ALL
TO public, anon, authenticated
USING (false)
WITH CHECK (false);

-- Then create service role access (this will be used by edge functions only)
CREATE POLICY "Service role conversation access"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role message access"
ON public.messages  
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also lock down the duplicate user tables mentioned in security scan
-- Clean up DIM_USER table policies
DROP POLICY IF EXISTS "Allow contact form submissions" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent data deletion" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent data modifications" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent public data access" ON public."DIM_USER";

-- Ensure completely blocked access to DIM_USER
CREATE POLICY "Block all DIM_USER access"
ON public."DIM_USER"
FOR ALL
TO public, anon, authenticated
USING (false)
WITH CHECK (false);

-- Allow service role access for potential admin operations
CREATE POLICY "Service role DIM_USER access"
ON public."DIM_USER"
FOR ALL  
TO service_role
USING (true)
WITH CHECK (true);