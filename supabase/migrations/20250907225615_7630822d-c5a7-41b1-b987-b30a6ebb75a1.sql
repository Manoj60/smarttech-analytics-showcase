-- Fix conversations table security - ensure complete lockdown
-- Drop any policies that might allow unintended access

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "No direct conversation access" ON public.conversations;
DROP POLICY IF EXISTS "Service role full access to conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create ultra-restrictive policies that completely block public access
-- Only service role can access conversations
CREATE POLICY "Block all conversation access"
ON public.conversations
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Service role needs access for edge function
CREATE POLICY "Service role only access"
ON public.conversations  
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also strengthen messages table policies
DROP POLICY IF EXISTS "No direct message access" ON public.messages;
DROP POLICY IF EXISTS "Service role full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;

-- Block all public access to messages
CREATE POLICY "Block all message access"
ON public.messages
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Service role only access for messages
CREATE POLICY "Service role only message access"
ON public.messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;