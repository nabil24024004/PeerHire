-- Migration: Drop and recreate payments RLS for proper visibility
-- Date: December 31, 2024

-- Drop the old restricting policy
drop policy if exists "payments_select_job_linked" on payments;

-- Allow all authenticated users to view paid payments
-- This is needed so freelancers can see payment status badges on jobs
create policy "payments_view_paid_public" on payments
  for select to authenticated
  using (status = 'paid');
