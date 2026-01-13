-- Fix existing profile that doesn't have roles
-- This will update any profile missing roles to have both roles enabled

UPDATE public.profiles 
SET 
  is_hirer = true, 
  is_freelancer = true
WHERE 
  (is_hirer = false OR is_hirer IS NULL) 
  AND (is_freelancer = false OR is_freelancer IS NULL);

-- Verify the update
SELECT id, email, full_name, is_hirer, is_freelancer 
FROM public.profiles;
