# Supabase Database Setup Instructions

## Step 1: Access SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/afzkptfiynkthwqujrcw
2. Click on **SQL Editor** in the left sidebar (icon looks like `</>`)

## Step 2: Run Migrations in Order

Copy and paste each migration file content into the SQL Editor and click **Run**.

Run them in this exact order:

### Migration 1: Create Profiles Table
- File: `supabase/migrations/001_create_profiles.sql`
- Creates user profiles with RLS policies

### Migration 2: Create Jobs Table
- File: `supabase/migrations/002_create_jobs.sql`
- Creates job listings

### Migration 3: Create Applications Table
- File: `supabase/migrations/003_create_applications.sql`
- Creates job applications

### Migration 4: Create Reviews Table
- File: `supabase/migrations/004_create_reviews.sql`
- Creates review system

### Migration 5: Create Messages Table
- File: `supabase/migrations/005_create_messages.sql`
- Creates messaging system

### Migration 6: Create Notifications Table
- File: `supabase/migrations/006_create_notifications.sql`
- Creates notification system

### Migration 7: Create Disputes Table
- File: `supabase/migrations/007_create_disputes.sql`
- Creates dispute resolution system

### Migration 8: Create Storage Buckets
- File: `supabase/migrations/008_create_storage.sql`
- Creates file storage buckets and policies

### Migration 9: Create Auth Functions
- File: `supabase/migrations/009_create_auth_functions.sql`
- Creates email domain verification and auto-profile creation

### Migration 10: Update Jobs RLS Policy
- File: `supabase/migrations/010_update_jobs_rls.sql`
- Updates jobs table policy to include applications check (run AFTER applications table)

## Step 3: Verify Everything

After running all migrations, verify in your Supabase Dashboard:

1. **Database** → **Tables**: You should see 7 tables
2. **Storage**: You should see 4 buckets
3. **Authentication** → **Policies**: Enabled for all tables

## Step 4: Enable Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials (you can get them from Google Cloud Console)
4. Add authorized redirect URL: `https://afzkptfiynkthwqujrcw.supabase.co/auth/v1/callback`

## Troubleshooting

- If a migration fails, check the error message
- Make sure to run migrations in the correct order
- If you need to reset, you can drop tables in reverse order

---

**When done, let me know so I can proceed with updating the React components!**
