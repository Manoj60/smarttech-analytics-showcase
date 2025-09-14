-- Fix profiles table RLS policies to prevent anonymous access to personal data

-- Block all anonymous/public access to profiles table
CREATE POLICY "Block all anonymous access to profiles" ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit policy to block public role access as well
CREATE POLICY "Block all public access to profiles" ON public.profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);