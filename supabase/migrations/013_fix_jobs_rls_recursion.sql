-- Fix jobs RLS policy to prevent infinite recursion
-- The issue is that nested queries in RLS policies can cause recursion

-- Drop ALL existing policies on jobs to start fresh
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Hirers can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Hirers can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Hirers can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can view applied jobs" ON public.jobs;

-- Create simplified non-recursive policies

-- Everyone can view open jobs, hirers can view their own jobs (any status)
CREATE POLICY "jobs_select_policy"
  ON public.jobs FOR SELECT
  USING (
    status = 'open' 
    OR hirer_id = auth.uid()
  );

-- Hirers can create jobs
CREATE POLICY "jobs_insert_policy"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = hirer_id);

-- Hirers can update their own jobs
CREATE POLICY "jobs_update_policy"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = hirer_id);

-- Hirers can delete their own jobs
CREATE POLICY "jobs_delete_policy"
  ON public.jobs FOR DELETE
  USING (auth.uid() = hirer_id);
