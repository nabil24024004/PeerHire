-- Migration: Update Payments RLS for Job Visibility
-- Date: December 31, 2024

-- Allow authenticated users to view payments that are linked to a job
-- This is required so freelancers can see the "Payment Verified" or "Payment Secured" status
create policy "payments_select_job_linked" on payments
  for select to authenticated
  using (job_id is not null);
