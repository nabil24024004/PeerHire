-- Migration: Fix Function Search Path Mutable Warnings
-- Date: December 17, 2024
-- Issue: Functions without search_path set can be exploited by malicious users

-- ============================================
-- FIX 1: public.trigger_set_timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 2: public.verify_aaub_email
-- ============================================
CREATE OR REPLACE FUNCTION public.verify_aaub_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email ends with @aaub.edu.bd
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@aaub.edu.bd' THEN
    RAISE EXCEPTION 'Only @aaub.edu.bd email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 3: public.handle_new_user
-- ============================================
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    true,
    true
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- NOTE: Leaked Password Protection
-- ============================================
-- The "Leaked Password Protection Disabled" warning is a Supabase Auth setting.
-- To enable it:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Enable "Leaked Password Protection"
-- This checks passwords against known data breaches (HaveIBeenPwned).
-- This cannot be enabled via SQL - it's a dashboard setting.

-- ============================================
-- Verify functions have search_path set
-- ============================================
-- After running this migration, the warnings should disappear.
-- You can verify by running:
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('trigger_set_timestamp', 'verify_aaub_email', 'handle_new_user');
