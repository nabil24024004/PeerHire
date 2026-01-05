-- Fix RLS performance issues flagged by Supabase linter
-- 1. Fix auth_rls_initplan: wrap auth functions with (select ...)
-- 2. Fix multiple_permissive_policies: consolidate into single policies

-- =====================================================
-- FIX: public.jobs - Multiple permissive policies & auth_rls_initplan
-- =====================================================

-- Drop all existing SELECT policies on jobs
DROP POLICY IF EXISTS "Users can view relevant jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;

-- Create single consolidated policy with optimized auth calls
CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR hirer_id = (SELECT auth.uid())
    OR public.user_has_application_for_job(id)
  );

-- =====================================================
-- FIX: public.applications - Multiple permissive policies
-- =====================================================

-- Drop all existing SELECT policies on applications
DROP POLICY IF EXISTS "applications_select_hirer" ON public.applications;
DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
DROP POLICY IF EXISTS "Freelancers can view own applications" ON public.applications;

-- Create single consolidated policy
CREATE POLICY "applications_select_policy" ON public.applications
  FOR SELECT TO authenticated
  USING (
    freelancer_id = (SELECT auth.uid())
    OR job_id IN (
      SELECT id FROM public.jobs WHERE hirer_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- FIX: public.payments - Multiple permissive policies
-- =====================================================

-- Drop all existing SELECT policies on payments
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_view_paid_public" ON public.payments;

-- Create single consolidated policy (payments uses user_id column)
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );
