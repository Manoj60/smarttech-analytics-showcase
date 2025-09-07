-- CRITICAL SECURITY FIX: Enable Row Level Security on DIM_USER table
-- This table contains sensitive PII and was publicly readable

-- Enable RLS on the DIM_USER table (if not already enabled)
ALTER TABLE public."DIM_USER" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Allow contact form submissions" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent public data access" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent data modifications" ON public."DIM_USER";
DROP POLICY IF EXISTS "Prevent data deletion" ON public."DIM_USER";

-- Create restrictive policies to prevent unauthorized access
-- Allow INSERT only for contact form submissions (no authentication required)
CREATE POLICY "Allow contact form submissions" 
ON public."DIM_USER" 
FOR INSERT 
WITH CHECK (true);

-- Deny all SELECT access (no one should be able to read this data publicly)
CREATE POLICY "Prevent public data access" 
ON public."DIM_USER" 
FOR SELECT 
USING (false);

-- Deny all UPDATE access
CREATE POLICY "Prevent data modifications" 
ON public."DIM_USER" 
FOR UPDATE 
USING (false);

-- Deny all DELETE access  
CREATE POLICY "Prevent data deletion" 
ON public."DIM_USER" 
FOR DELETE 
USING (false);