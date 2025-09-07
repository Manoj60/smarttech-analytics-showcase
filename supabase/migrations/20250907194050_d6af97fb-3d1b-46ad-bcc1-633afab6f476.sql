-- Fix critical security vulnerability: Remove public access to messages and conversations
-- Drop the overly permissive policies that allow public read access

-- Remove public SELECT access to messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

-- Remove public SELECT and UPDATE access to conversations  
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Add conversation_secret column for secure access control
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_secret text;

-- Create a secure function to verify conversation access
CREATE OR REPLACE FUNCTION public.verify_conversation_access(
  conversation_id_param uuid,
  conversation_secret_param text
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversations 
    WHERE id = conversation_id_param 
    AND conversation_secret = conversation_secret_param
  );
$$;

-- Keep only INSERT policies for public access (handled by edge function)
-- Messages can only be inserted via edge function, no direct client access
-- Conversations can only be created via edge function, no direct client access

-- Add policy for service role to access all data (for edge functions)
CREATE POLICY "Service role full access to messages" 
ON public.messages 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access to conversations" 
ON public.conversations 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);