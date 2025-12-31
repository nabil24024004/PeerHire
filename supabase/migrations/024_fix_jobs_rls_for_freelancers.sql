-- Fix jobs RLS policy to allow freelancers with accepted applications to view their jobs
-- Current policy only allows: status = 'open' OR hirer_id = auth.uid()
-- This blocks freelancers from seeing jobs they've been assigned to

-- Drop the existing view policy
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;

-- Create a new policy that allows:
-- 1. Anyone can view open jobs
-- 2. Hirers can view their own jobs (any status)
-- 3. Freelancers can view jobs where they have an application
CREATE POLICY "Users can view relevant jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'open' 
    OR hirer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.applications 
      WHERE applications.job_id = jobs.id 
      AND applications.freelancer_id = auth.uid()
    )
  );
