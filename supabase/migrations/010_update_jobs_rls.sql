-- Update jobs RLS policy to include applications check
-- This must run AFTER the applications table is created

-- Drop the old policy
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;

-- Create the updated policy with applications table reference
CREATE POLICY "Anyone can view open jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'open' 
    OR hirer_id = auth.uid() 
    OR id IN (
      SELECT job_id FROM public.applications WHERE freelancer_id = auth.uid()
    )
  );
