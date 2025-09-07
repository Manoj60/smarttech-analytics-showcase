-- CRITICAL SECURITY FIX: Enable Row Level Security on DIM_USER table
-- This table contains sensitive PII and was publicly readable

-- Enable RLS on the DIM_USER table
ALTER TABLE public."DIM_USER" ENABLE ROW LEVEL SECURITY;

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

-- Add basic data validation constraints for security
ALTER TABLE public."DIM_USER" 
ALTER COLUMN user_name SET NOT NULL,
ALTER COLUMN email_address SET NOT NULL,
ALTER COLUMN message_description SET NOT NULL;

-- Add length constraints to prevent abuse
ALTER TABLE public."DIM_USER" 
ADD CONSTRAINT user_name_length CHECK (length(user_name) <= 255),
ADD CONSTRAINT email_length CHECK (length(email_address) <= 254),
ADD CONSTRAINT message_length CHECK (length(message_description) <= 5000),
ADD CONSTRAINT email_format CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');