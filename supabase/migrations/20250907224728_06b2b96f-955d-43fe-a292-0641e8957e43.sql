-- Add restrictive SELECT policies that prevent direct client access
-- Messages can only be read through the edge function using conversation_secret

-- Drop any existing SELECT policies first
DROP POLICY IF EXISTS "No direct message access" ON public.messages;
DROP POLICY IF EXISTS "No direct conversation access" ON public.conversations;

-- Add restrictive SELECT policies that effectively block direct client access
-- while allowing the edge function (which uses service role) to access data
CREATE POLICY "No direct message access" 
ON public.messages 
FOR SELECT 
USING (false);

CREATE POLICY "No direct conversation access" 
ON public.conversations 
FOR SELECT 
USING (false);

-- Messages should only be accessed through the chat-support edge function
-- which validates conversation_secret for secure access