-- Phase 1: Lock down write operations to prevent unauthorized access
-- Drop public INSERT policies that allow anyone to create conversations/messages

DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Add explicit service-role-only INSERT policies for defense-in-depth
CREATE POLICY "Service role only message creation" 
ON public.messages 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role only conversation creation" 
ON public.conversations 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create rate limiting table for abuse prevention
CREATE TABLE IF NOT EXISTS public.function_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) should access rate limiting data
CREATE POLICY "Service role rate limit access" 
ON public.function_rate_limits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.function_rate_limits (ip_address, function_name, window_start);