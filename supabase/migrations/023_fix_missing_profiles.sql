-- Fix missing profiles: Create profiles for any auth users that don't have a profile
-- This handles cases where the handle_new_user trigger may have failed

INSERT INTO public.profiles (id, email, full_name, is_hirer, is_freelancer)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
  true,
  true
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Also update any profiles that have NULL full_name to use email username
UPDATE public.profiles
SET full_name = SPLIT_PART(email, '@', 1)
WHERE full_name IS NULL OR full_name = '';
