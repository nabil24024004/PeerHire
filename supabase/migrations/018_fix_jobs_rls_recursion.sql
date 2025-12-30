-- Migration: Fix Jobs RLS Infinite Recursion
-- The previous policy caused infinite recursion because jobs_select_policy
-- referenced applications table, which has policies that reference jobs table.
-- Solution: Simplify the jobs select policy to avoid the circular reference.

-- Drop the problematic policies
DROP POLICY IF EXISTS "jobs_select_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_delete_policy" ON jobs;

-- Recreate jobs policies without circular references
-- For SELECT: Anyone authenticated can view open jobs OR their own jobs
CREATE POLICY "jobs_select_policy" ON jobs
  FOR SELECT TO authenticated
  USING (
    status = 'open' OR 
    hirer_id = (select auth.uid())
  );

-- For INSERT: Only the hirer can create jobs
CREATE POLICY "jobs_insert_policy" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (hirer_id = (select auth.uid()));

-- For UPDATE: Only the hirer can update their jobs
CREATE POLICY "jobs_update_policy" ON jobs
  FOR UPDATE TO authenticated
  USING (hirer_id = (select auth.uid()));

-- For DELETE: Only the hirer can delete their jobs
CREATE POLICY "jobs_delete_policy" ON jobs
  FOR DELETE TO authenticated
  USING (hirer_id = (select auth.uid()));

-- Also fix applications policies to avoid recursion
DROP POLICY IF EXISTS "applications_select_own" ON applications;
DROP POLICY IF EXISTS "applications_insert_own" ON applications;
DROP POLICY IF EXISTS "applications_update_hirer" ON applications;

-- Recreate without circular reference to jobs
CREATE POLICY "applications_select_own" ON applications
  FOR SELECT TO authenticated
  USING (
    freelancer_id = (select auth.uid())
  );

-- Allow hirers to view applications for their jobs
CREATE POLICY "applications_select_hirer" ON applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.hirer_id = (select auth.uid())
    )
  );

CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (freelancer_id = (select auth.uid()));

CREATE POLICY "applications_update_hirer" ON applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = applications.job_id 
      AND jobs.hirer_id = (select auth.uid())
    )
  );
