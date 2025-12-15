# PeerHire Changelog

## December 15, 2024 - Schema Migration Fixes

### Overview
Major cleanup after Supabase schema migration. Fixed all components to use the simplified schema where:
- All users are dual-roled (both hirer and freelancer)
- Roles controlled by `is_hirer`/`is_freelancer` booleans in `profiles`
- Active role stored in localStorage (not database)

---

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
