-- Final security cleanup - remove all remaining public access policies

-- Clean up dim_user table completely  
DROP POLICY IF EXISTS "Contact form submissions allowed" ON public.dim_user;
DROP POLICY IF EXISTS "No public deletes" ON public.dim_user;
DROP POLICY IF EXISTS "No public updates" ON public.dim_user;
DROP POLICY IF EXISTS "Prevent all data access" ON public.dim_user;
DROP POLICY IF EXISTS "Prevent data deletion" ON public.dim_user;
DROP POLICY IF EXISTS "Prevent data modifications" ON public.dim_user;

-- Block all public access to dim_user
CREATE POLICY "Block all dim_user access"
ON public.dim_user
FOR ALL
TO public, anon, authenticated
USING (false)
WITH CHECK (false);

-- Service role access for dim_user
CREATE POLICY "Service role dim_user access"
ON public.dim_user
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Clean up any remaining INSERT policies on conversations and messages
DROP POLICY IF EXISTS "Service role only conversation creation" ON public.conversations;
DROP POLICY IF EXISTS "Service role only message creation" ON public.messages;

-- Lock down function_rate_limits table
CREATE POLICY "Block all rate limit access"
ON public.function_rate_limits
FOR ALL
TO public, anon, authenticated
USING (false)
WITH CHECK (false);

-- Verify RLS is enabled on all sensitive tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DIM_USER" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;