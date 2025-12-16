# PeerHire Changelog

## December 16, 2024 - Application Flow & Schema Alignment Fixes

### Overview
Fixed critical issues preventing freelancers from submitting applications and hirers from accepting/managing them. All components now properly aligned with the database schema.

---

### Application Submission Fixes

| Component | Issue | Fix |
|-----------|-------|-----|
| `JobApplicationModal.tsx` | Using `job_applications` table | Changed to `applications` table |
| `JobApplicationModal.tsx` | Using `proposed_price` column | Changed to `proposed_rate` |

---

### Hirer Tasks Page Fixes

**File:** `HirerTasks.tsx`

| Issue | Fix |
|-------|-----|
| `Task` interface had `subject`, `work_type`, `page_count` | Changed to `category` only |
| `job.freelancer_id` doesn't exist | Query `applications` for accepted freelancer |
| Division by zero for completion rate | Added `total_tasks > 0` check |

---

### Hirer View Offers Page Fixes

**File:** `HirerViewOffers.tsx`

| Issue | Fix |
|-------|-----|
| Foreign key reference `profiles!applications_freelancer_id_fkey` | Fetch profiles separately |
| `JobData` interface had old fields | Changed to `category`, nullable `deadline` |
| `freelancer_profiles` references | Changed to `profiles` |
| Accept updating `jobs.freelancer_id` | Removed (column doesn't exist) |
| Job status on accept | Changed `assigned` → `in_progress` |

---

### Freelancer Jobs Page Fixes

**File:** `FreelancerJobs.tsx`

| Issue | Fix |
|-------|-----|
| "Accept" button for freelancers | Removed (only hirers accept) |
| "Decline" button | Renamed to "Withdraw" application |
| `handleAcceptJob` function | Removed entirely |
| `handleDeclineJob` function | Renamed to `handleWithdrawApplication` |
| Message Hirer button | Fixed to navigate with `?chat={hirer_id}` |

---

### Hirer Profile Page Fixes

**File:** `HirerProfile.tsx`

| Issue | Fix |
|-------|-----|
| `task.work_type` in recent tasks | Changed to `task.category` |
| Division by zero for completion % | Added `total_tasks > 0` check |

---

### Job Posting Modal Updates

**File:** `JobPostingModal.tsx`

| Issue | Fix |
|-------|-----|
| Updated subjects list | Math, Thermodynamics, Mechanics, Physics, Chemistry, Aerodynamics, AVE, Sociology, Others |
| Custom subject for "Others" | Added text input when "Others" is selected |
| Inserting non-existent columns | Changed to use `category` column |

---

## December 15, 2024 - Schema Migration Fixes

### Critical: RLS Policy Fix
**File:** `supabase/migrations/013_fix_jobs_rls_recursion.sql`

Fixed "infinite recursion detected in policy for relation 'jobs'" error by:
- Dropping all existing problematic RLS policies on `jobs` table
- Creating simple, non-recursive policies
- Removing nested subqueries that caused circular dependencies

**⚠️ MUST RUN in Supabase SQL Editor for app to work!**

---

### Authentication & Profile Fixes

| File | Fix |
|------|-----|
| `Auth.tsx` | Query `profiles` table instead of `user_roles` |
| `useAuth.tsx` | Initialize `activeRole` from localStorage, prevent redundant effects |
| `supabase/migrations/011_fix_profile_creation.sql` | Save `full_name` from auth metadata during signup |

---

### Dashboard Fixes

| Component | Issues Fixed |
|-----------|--------------|
| `HirerDashboard.tsx` | Changed `job_applications` → `applications` table |
| `FreelancerDashboard.tsx` | Get jobs via `applications` table instead of `jobs.freelancer_id` |

---

### Profile & Settings Fixes

| Component | Issues Fixed |
|-----------|--------------|
| `EditProfileModal.tsx` | Removed `department`, `year_of_study`, `handwriting_style` fields |
| `HirerProfile.tsx` | Aligned with `profiles` schema |
| `HirerSettings.tsx` | Removed `notification_preferences` table, changed to `bio`/`student_id` |
| `FreelancerSettings.tsx` | Same as HirerSettings + use `profiles.availability` instead of `freelancer_profiles.status` |

---

### Payments Fixes

| Component | Fix |
|-----------|-----|
| `HirerPayments.tsx` | Calculate stats from `jobs` table (no `payments` table) |
| `FreelancerPayments.tsx` | Calculate earnings from completed applications |

---

### Messaging Fixes

| Component | Issues Fixed |
|-----------|--------------|
| `MessagingSystem.tsx` | **Full rewrite** - Query `messages` table directly instead of `conversations` |
| `Messages.tsx` | Read `chat` param from URL for pre-selecting partner |
| `LiveBoard.tsx` | Navigate with `?chat=` param instead of creating conversation |
| `FreelancerBrowseJobs.tsx` | Navigate with `?chat=` param, removed conversation creation |

---

### Browse Jobs / Find Work Fixes

**File:** `FreelancerBrowseJobs.tsx`

| Issue | Fix |
|-------|-----|
| `profiles.department` doesn't exist | Removed from query |
| `profiles.active_role` doesn't exist | Use localStorage |
| `job_applications` table | Changed to `applications` |
| `saved_jobs` table | Use localStorage |
| `conversations` table | Navigate with `?chat=` param |
| `work_type`, `subject`, `page_count`, `quality_level` | Changed to `category` |

---

### Freelancer Jobs Page

**File:** `FreelancerJobs.tsx`

| Issue | Fix |
|-------|-----|
| `job_applications` table | Changed to `applications` |
| `profiles.active_role` | Use localStorage |
| Old Job interface fields | Simplified to match schema |

---

### Live Board Fixes

**File:** `LiveBoard.tsx`

| Issue | Fix |
|-------|-----|
| `freelancer_profiles` table | Query `profiles` with `is_freelancer = true` |
| Data structure | Updated interface to match `profiles` schema |

---

### Notification Panel Fix

**File:** `NotificationPanel.tsx`

| Issue | Fix |
|-------|-----|
| `notification.read` | Changed to `is_read` |
| `notification.related_id` | Changed to `action_url` |

---

### Tables That DO NOT EXIST (But Were Referenced)

These tables from old code **do not exist** in current schema:
- ❌ `user_roles`
- ❌ `freelancer_profiles`
- ❌ `hirer_profiles`
- ❌ `conversations`
- ❌ `saved_jobs`
- ❌ `payments`
- ❌ `notification_preferences`
- ❌ `job_applications` (correct name is `applications`)

---

### Columns That DO NOT EXIST

| Old Column | Location | Replacement |
|------------|----------|-------------|
| `active_role` | profiles | localStorage |
| `department` | profiles | removed |
| `year_of_study` | profiles | removed |
| `handwriting_style` | profiles | removed |
| `freelancer_id` | jobs | via applications |
| `work_type` | jobs | `category` |
| `subject` | jobs | removed |
| `page_count` | jobs | removed |
| `quality_level` | jobs | removed |
| `read` | notifications | `is_read` |
| `related_id` | notifications | `action_url` |

---

### How to Apply Fixes

1. **Run RLS Fix Migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/013_fix_jobs_rls_recursion.sql`
   - Execute

2. **Run Profile Fix (if needed):**
   - Execute `supabase/migrations/011_fix_profile_creation.sql`

3. **Refresh Browser:**
   - Clear localStorage if seeing old role data
   - Hard refresh (Ctrl+Shift+R)

---

### Testing Checklist

After applying fixes, verify:
- [ ] Login/Signup works
- [ ] Role switching (Hirer ↔ Freelancer)
- [ ] Dashboard loads without errors
- [ ] Profile editing saves correctly
- [ ] Find Work shows jobs
- [ ] Live Board shows freelancers
- [ ] Messaging opens from cards
- [ ] Settings page loads
- [ ] Payments page loads
