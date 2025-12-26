-- Migration: Fix RLS Policy Performance Warnings
-- This migration addresses two types of issues:
-- 1. Replace auth.uid() with (select auth.uid()) for performance
-- 2. Remove duplicate permissive policies

-- =============================================
-- PROFILES TABLE
-- =============================================

-- Drop duplicate/old policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Recreate with optimized auth.uid() call
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =============================================
-- APPLICATIONS TABLE
-- =============================================

-- Drop old policies
DROP POLICY IF EXISTS "Freelancers can view own applications" ON applications;
DROP POLICY IF EXISTS "Freelancers can create applications" ON applications;
DROP POLICY IF EXISTS "Hirers can update application status" ON applications;

-- Recreate with optimized auth.uid() call
CREATE POLICY "applications_select_own" ON applications
  FOR SELECT TO authenticated
  USING (
    freelancer_id = (select auth.uid()) OR
    job_id IN (SELECT id FROM jobs WHERE hirer_id = (select auth.uid()))
  );

CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (freelancer_id = (select auth.uid()));

CREATE POLICY "applications_update_hirer" ON applications
  FOR UPDATE TO authenticated
  USING (
    job_id IN (SELECT id FROM jobs WHERE hirer_id = (select auth.uid()))
  );

-- =============================================
-- REVIEWS TABLE
-- =============================================

-- Drop duplicate/old policies
DROP POLICY IF EXISTS "Users can create reviews for completed jobs" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;

-- Recreate with optimized auth.uid() call
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = (select auth.uid()));

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = (select auth.uid()))
  WITH CHECK (reviewer_id = (select auth.uid()));

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = (select auth.uid()));

-- =============================================
-- MESSAGES TABLE
-- =============================================

-- Drop duplicate/old policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Receivers can update read status" ON messages;
DROP POLICY IF EXISTS "messages_select_own" ON messages;

-- Recreate with optimized auth.uid() call
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT TO authenticated
  USING (
    sender_id = (select auth.uid()) OR 
    receiver_id = (select auth.uid())
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE TO authenticated
  USING (receiver_id = (select auth.uid()));

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

-- Drop duplicate/old policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;

-- Recreate with optimized auth.uid() call
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- =============================================
-- DISPUTES TABLE
-- =============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own disputes" ON disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON disputes;

-- Recreate with optimized auth.uid() call
-- Note: Jobs are linked to freelancers via applications table
CREATE POLICY "disputes_select_own" ON disputes
  FOR SELECT TO authenticated
  USING (
    raised_by = (select auth.uid()) OR
    job_id IN (SELECT id FROM jobs WHERE hirer_id = (select auth.uid()))
  );

CREATE POLICY "disputes_insert_own" ON disputes
  FOR INSERT TO authenticated
  WITH CHECK (raised_by = (select auth.uid()));

-- =============================================
-- JOBS TABLE
-- =============================================

-- Drop old policies
DROP POLICY IF EXISTS "jobs_select_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_insert_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_update_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_delete_policy" ON jobs;

-- Recreate with optimized auth.uid() call
-- Note: Jobs only has hirer_id, freelancers access via applications table
CREATE POLICY "jobs_select_policy" ON jobs
  FOR SELECT TO authenticated
  USING (
    status = 'open' OR 
    hirer_id = (select auth.uid()) OR
    id IN (SELECT job_id FROM applications WHERE freelancer_id = (select auth.uid()))
  );

CREATE POLICY "jobs_insert_policy" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (hirer_id = (select auth.uid()));

CREATE POLICY "jobs_update_policy" ON jobs
  FOR UPDATE TO authenticated
  USING (hirer_id = (select auth.uid()));

CREATE POLICY "jobs_delete_policy" ON jobs
  FOR DELETE TO authenticated
  USING (hirer_id = (select auth.uid()));
