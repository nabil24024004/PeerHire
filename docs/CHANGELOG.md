# PeerHire Changelog

## December 31, 2024 - Payment System Integration & Bug Fixes

### Overview
RupantorPay payment gateway integration, payment status visibility for freelancers, and code cleanup.

---

### Payment System (RupantorPay Integration)

| Feature | Details |
|---------|---------|
| **Pay Now** | Full payment upfront (budget + 20% site fee). Freelancer payment is secured. |
| **Pay Later** | Site fee only (20%). Pay freelancer offline after job completion. |
| **Payment Gateway** | RupantorPay integration via Supabase Edge Functions |
| **Status Tracking** | Pending → Processing → Paid/Failed |

---

### Payment Status Badges on Job Cards

Freelancers can now see payment status on job cards:

| Badge | Meaning |
|-------|---------|
| 🟢 **Payment Secured** | Hirer paid full amount (Pay Now) |
| 🔵 **Payment Verified** | Hirer paid site fee (Pay Later) |
| ⚪ **Payment Pending** | No payment confirmed yet |

---

### Database Changes

**New Table: `payments`**
- Stores all payment records
- Links to `profiles` (user_id) and `jobs` (job_id)
- Tracks amount, site_fee, freelancer_amount, status

**New RLS Policy (Migration 022):**
- `payments_view_paid_public` - Allows authenticated users to view paid payments

---

### Code Cleanup

| File | Change |
|------|--------|
| `FreelancerBrowseJobs.tsx` | Removed unused `FileText` import |
| `PaymentMethod.tsx` | Removed unused `CheckCircle` import |
| `021_update_payments_rls.sql` | **Deleted** (superseded by 022) |

---

## December 26-30, 2024 - Payment System, RLS Fixes & Features

### Payment & Pricing System Updates

| Change | Before | After |
|--------|--------|-------|
| **Base Price** | ৳5/page | **৳10/page** |
| **Rate Label** | "Hourly Rate" | **"Rate Per Work"** |
| **Rate Display** | `৳X/hr` | **`৳X/work`** |
| **Proposal Cap** | No limit | **Budget + ৳75 max** |

---

### Deadline-Based Dynamic Pricing

New pricing tiers based on deadline proximity:

| Deadline | Multiplier |
|----------|------------|
| 7+ days | 1.0x (no extra) |
| 3-7 days | +5% |
| 2-3 days | +15% |
| 1-2 days | +25% |
| <24 hours | +50% |

---

### Handwriting Samples Feature

| Component | Details |
|-----------|---------|
| **Location** | Hirer Profile page |
| **Functionality** | Upload, delete, preview samples |
| **Storage** | Supabase Storage bucket |
| **Permissions** | Hirers can manage own samples; freelancers view only |

---

### Database & RLS Fixes

**Performance Optimizations (Migration 016):**
- Wrapped `auth.uid()` in `(select auth.uid())` for 25 policies
- Removed 5 duplicate permissive policies

**Infinite Recursion Fix (Migration 018):**
- Fixed circular RLS policy reference between `jobs` and `applications` tables
- Simplified `jobs_select_policy` to avoid subqueries causing recursion

**Function Security (Migration 017):**
- Added `SET search_path = ''` to `handle_new_user` function

---

### UI Fixes

| Fix | Details |
|-----|---------|
| **Calendar Icon** | Made visible on dark background with `color-scheme: dark` |
| **Freelancer Profile** | Fixed black screen caused by orphaned Dialog component |

---

## December 23-24, 2024 - Auth Redesign, Branding & Cleanup

### Overview
Major UI overhaul for authentication pages, new 3D branding, and codebase optimization.

---

### Authentication Redesign

| Change | Details |
|--------|---------|
| **New Layout** | Split-screen design with dark form panel + purple illustration panel |
| **Login Flow** | Changed from OTP to email/password authentication |
| **Signup Flow** | Manual approval - redirects to "Contact Developer" page |
| **Input Styling** | Minimalist underlined inputs with focus animation |
| **Removed** | OTP verification, auto-confirm signup |

---

### Branding Updates

| Asset | Change |
|-------|--------|
| **App Logo** | New 3D box effect with "PR" monogram |
| **Favicon** | Updated to match new logo |
| **Splash Screen** | Removed background box, increased logo size |
| **Homepage Hero** | New flat vector illustration matching Auth style |

---

### Codebase Cleanup

**Removed 11 unused UI components (~41KB, 1100 lines):**

| Component | Size |
|-----------|------|
| `input-otp.tsx` | 2.2KB |
| `chart.tsx` | 10KB |
| `context-menu.tsx` | 7.2KB |
| `menubar.tsx` | 7.9KB |
| `hover-card.tsx` | 1.2KB |
| `resizable.tsx` | 1.7KB |
| `toggle-group.tsx` | 1.7KB |
| `breadcrumb.tsx` | 2.7KB |
| `navigation-menu.tsx` | 5KB |
| `aspect-ratio.tsx` | 0.15KB |
| `slider.tsx` | 1KB |

---

### Currency Localization

**Changed from USD ($) to Bangladeshi Taka (৳):**

| Change | Details |
|--------|---------|
| **Currency Symbol** | Replaced all `$` with `৳` across the app |
| **Custom Icon** | Created `TakaIcon.tsx` to replace `DollarSign` from lucide-react |
| **Files Updated** | HirerDashboard, FreelancerDashboard, HirerPayments, FreelancerPayments, HirerProfile, FreelancerProfile, JobApplicationModal, FreelancerJobDetails, HirerViewOffers |

---

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
