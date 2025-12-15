# PeerHire Database Schema

> **Last Updated:** December 2024 - After Supabase migration cleanup

## Overview

PeerHire uses a simplified database schema with the following core tables:
- `profiles` - User accounts (dual-role: both hirer and freelancer)
- `jobs` - Job postings from hirers
- `applications` - Freelancer applications to jobs
- `messages` - Direct messaging between users
- `reviews` - Job completion reviews
- `notifications` - User notifications
- `disputes` - Job disputes

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│     profiles     │       │       jobs       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ hirer_id (FK)    │
│ email            │       │ title            │
│ full_name        │       │ description      │
│ bio              │       │ category         │
│ skills[]         │       │ budget           │
│ hourly_rate      │       │ deadline         │
│ availability     │       │ status           │
│ is_hirer         │       │ created_at       │
│ is_freelancer    │       └──────────────────┘
│ student_id       │              │
└──────────────────┘              │
       ▲    ▲                     │
       │    │         ┌───────────┴────────────┐
       │    │         │                        │
       │    │         ▼                        ▼
       │    │  ┌──────────────────┐    ┌──────────────┐
       │    │  │   applications   │    │   reviews    │
       │    │  ├──────────────────┤    ├──────────────┤
       │    └──│ freelancer_id    │    │ reviewer_id  │
       │       │ job_id (FK)      │    │ reviewee_id  │
       │       │ cover_letter     │    │ job_id       │
       │       │ status           │    │ rating       │
       │       └──────────────────┘    └──────────────┘
       │
       │    ┌──────────────────┐     ┌──────────────────┐
       │    │     messages     │     │   notifications  │
       │    ├──────────────────┤     ├──────────────────┤
       └────│ sender_id        │     │ user_id          │
            │ receiver_id      │     │ title            │
            │ content          │     │ message          │
            │ is_read          │     │ type             │
            └──────────────────┘     │ is_read          │
                                     └──────────────────┘
```

---

## Tables

### profiles
Primary user table. **All users are dual-roled** (both `is_hirer` and `is_freelancer` = true).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | PK, matches auth.users.id |
| email | text | No | - | Email address |
| full_name | text | Yes | null | Display name |
| bio | text | Yes | null | User bio |
| skills | text[] | Yes | null | Skills array |
| hourly_rate | numeric | Yes | null | Hourly rate |
| availability | text | Yes | 'available' | 'available', 'busy', 'offline' |
| avatar_url | text | Yes | null | Profile picture URL |
| student_id | text | Yes | null | Student ID number |
| is_hirer | boolean | Yes | true | Can post jobs |
| is_freelancer | boolean | Yes | true | Can apply to jobs |
| created_at | timestamptz | Yes | now() | Creation time |
| updated_at | timestamptz | Yes | now() | Last update |

**RLS Policies:**
- Anyone can view profiles (authenticated)
- Users can only update their own profile

---

### jobs
Job postings created by hirers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| hirer_id | uuid | No | - | FK to profiles.id |
| title | text | No | - | Job title |
| description | text | No | - | Job description |
| category | text | Yes | null | Job category |
| budget | numeric | No | - | Payment amount |
| deadline | timestamptz | No | - | Due date |
| status | text | Yes | 'open' | 'open', 'in_progress', 'completed', 'cancelled' |
| created_at | timestamptz | Yes | now() | Creation time |
| updated_at | timestamptz | Yes | now() | Last update |

**RLS Policies:**
- Open jobs visible to everyone
- Hirers can see their own jobs (any status)
- Hirers can create/update/delete own jobs

---

### applications
Freelancer applications to jobs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| job_id | uuid | No | - | FK to jobs.id |
| freelancer_id | uuid | No | - | FK to profiles.id |
| cover_letter | text | Yes | null | Application message |
| proposed_rate | numeric | Yes | null | Proposed rate |
| status | text | Yes | 'pending' | 'pending', 'accepted', 'rejected' |
| created_at | timestamptz | Yes | now() | Application time |

**RLS Policies:**
- Hirers see applications on their jobs
- Freelancers see their own applications
- Freelancers can create applications

---

### messages
Direct messages between users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| sender_id | uuid | No | - | FK to profiles.id |
| receiver_id | uuid | No | - | FK to profiles.id |
| content | text | No | - | Message text |
| is_read | boolean | Yes | false | Read status |
| created_at | timestamptz | Yes | now() | Send time |

**RLS Policies:**
- Users can see messages where they're sender or receiver
- Users can send messages (insert)
- Users can mark received messages as read

---

### reviews
Job completion reviews.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| job_id | uuid | No | - | FK to jobs.id |
| reviewer_id | uuid | No | - | FK to profiles.id |
| reviewee_id | uuid | No | - | FK to profiles.id |
| rating | integer | No | - | 1-5 star rating |
| comment | text | Yes | null | Review text |
| created_at | timestamptz | Yes | now() | Review time |

---

### notifications
User notifications for system events.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | FK to profiles.id |
| title | text | No | - | Notification title |
| message | text | No | - | Notification body |
| type | text | No | - | 'message', 'application', 'job_update', 'payment' |
| is_read | boolean | Yes | false | Read status |
| action_url | text | Yes | null | Link to related page |
| created_at | timestamptz | Yes | now() | Creation time |

---

### disputes
Job dispute records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| job_id | uuid | No | - | FK to jobs.id |
| raised_by | uuid | No | - | FK to profiles.id |
| reason | text | No | - | Dispute reason |
| status | text | Yes | 'open' | 'open', 'resolved', 'closed' |
| resolution | text | Yes | null | Resolution notes |
| created_at | timestamptz | Yes | now() | Creation time |
| resolved_at | timestamptz | Yes | null | Resolution time |

---

## Database Triggers

### handle_new_user()
Trigger that runs after user signup:
1. Creates `profiles` entry with `is_hirer = true` and `is_freelancer = true`
2. Copies `full_name` from auth metadata if provided

---

## Important Notes

### Removed Tables (Not In Current Schema)
The following tables from old documentation **DO NOT EXIST** in the current schema:
- ❌ `user_roles` - Replaced by `is_hirer`/`is_freelancer` booleans
- ❌ `freelancer_profiles` - Merged into `profiles`
- ❌ `hirer_profiles` - Merged into `profiles`
- ❌ `conversations` - Messages use direct `sender_id`/`receiver_id`
- ❌ `saved_jobs` - Now stored in localStorage
- ❌ `payments` - Stats calculated from completed jobs
- ❌ `notification_preferences` - Stored in localStorage

### Removed Columns
- ❌ `profiles.active_role` - Uses localStorage
- ❌ `profiles.department` - Removed
- ❌ `profiles.year_of_study` - Removed
- ❌ `jobs.freelancer_id` - Use applications to find assigned freelancer
- ❌ `jobs.work_type` - Replaced by `category`
- ❌ `jobs.subject` - Removed
- ❌ `jobs.page_count` - Removed
- ❌ `jobs.quality_level` - Removed
- ❌ `notifications.read` - Renamed to `is_read`
- ❌ `notifications.related_id` - Replaced by `action_url`

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| avatars | Yes | Profile pictures |
| job-attachments | No | Job files |
| message-attachments | No | Chat files |

---

## Migration Files

Run these in order in Supabase SQL Editor:

1. `001_create_profiles.sql` - Profiles table
2. `002_create_jobs.sql` - Jobs table
3. `003_create_applications.sql` - Applications table
4. `004_create_reviews.sql` - Reviews table
5. `005_create_messages.sql` - Messages table
6. `006_create_notifications.sql` - Notifications table
7. `007_create_disputes.sql` - Disputes table
8. `008_create_storage.sql` - Storage buckets
9. `011_fix_profile_creation.sql` - Profile trigger fix
10. `013_fix_jobs_rls_recursion.sql` - **CRITICAL** - Fixes RLS infinite recursion
