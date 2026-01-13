-- Migration: Remove Email Domain Restriction
-- Date: December 18, 2024
-- Reason: Allow any email domain for Google OAuth and OTP sign-in

-- ============================================
-- Drop the verify_aaub_email trigger
-- ============================================
-- This trigger was blocking non-@aaub.edu.bd emails from being inserted

DROP TRIGGER IF EXISTS verify_email_on_signup ON auth.users;

-- Optionally drop the function too (or keep it for future use)
-- DROP FUNCTION IF EXISTS public.verify_aaub_email() CASCADE;

-- ============================================
-- Update handle_new_user to use ON CONFLICT
-- ============================================
-- This prevents errors if the user already exists

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_hirer, is_freelancer)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- NOTE: Frontend Validation
-- ============================================
-- The @aaub.edu.bd restriction should also be removed from Auth.tsx
-- to allow users to enter any email address.
