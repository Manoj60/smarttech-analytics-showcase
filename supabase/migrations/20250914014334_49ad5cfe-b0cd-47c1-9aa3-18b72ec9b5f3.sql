-- Ensure info@smarttechanalytics.com is always an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'info@smarttechanalytics.com';

-- If the profile doesn't exist, create it as admin
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT 
  auth.users.id,
  'info@smarttechanalytics.com',
  'Smart Tech Analytics Admin',
  'admin'
FROM auth.users 
WHERE auth.users.email = 'info@smarttechanalytics.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'info@smarttechanalytics.com'
);