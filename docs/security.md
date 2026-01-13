# PeerHire Security Documentation

## Overview

PeerHire implements multiple layers of security to protect user data and ensure platform integrity. This document outlines the security measures in place.

---

## Authentication

### Supported Methods
1. **Email/Password**
   - Domain restriction: Only @aaub.edu.bd emails allowed
   - Minimum password length enforced
   - Auto-confirm enabled (no email verification required)

2. **Google OAuth**
   - Integrated via Supabase Auth
   - Post-auth role selection for new users

### Session Management
- JWT-based authentication
- Tokens stored in localStorage
- Auto-refresh enabled
- Sessions persist across browser restarts

---

## Row Level Security (RLS)

All database tables have RLS enabled with appropriate policies.

### profiles
```sql
-- Only authenticated users can view profiles (no anonymous access)
-- Migration 014 fixed the security vulnerability
USING (auth.uid() IS NOT NULL)

-- Users can only insert their own profile
WITH CHECK (auth.uid() = id)

-- Users can only update their own profile
USING (auth.uid() = id)
```

> **Security Note (Dec 2024):** While RLS ensures authentication is required,
> email privacy should be handled at the application level by not selecting
> the email column when fetching other users' profiles.

### jobs
```sql
-- Only authenticated users can view jobs
USING (auth.uid() IS NOT NULL)

-- Only hirers can create/update/delete their own jobs
USING (auth.uid() = hirer_id)
WITH CHECK (auth.uid() = hirer_id)
```

### messages
```sql
-- Users can only view messages in their conversations
USING (conversation_id IN (
  SELECT id FROM conversations
  WHERE hirer_id = auth.uid() OR freelancer_id = auth.uid()
))

-- Users can only send messages in their conversations
WITH CHECK (
  auth.uid() = sender_id 
  AND conversation_id IN (SELECT id FROM conversations WHERE ...)
)
```

### payments
```sql
-- Users can view payments where they are payer or payee
USING ((auth.uid() = payer_id) OR (auth.uid() = payee_id))

-- Users can create payments where they are the payer
WITH CHECK (auth.uid() = payer_id)

-- Users can update their own payments
USING ((auth.uid() = payer_id) OR (auth.uid() = payee_id))
```

---

## Storage Security

### Bucket Policies

All storage buckets use owner-based policies. Files are organized by user ID in folder structure.

```sql
-- Users can only upload to their own folder
WITH CHECK (
  bucket_id = 'bucket-name'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)

-- Users can only access their own files
USING (
  bucket_id = 'bucket-name'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
```

### File Limits
| Bucket | Size Limit |
|--------|------------|
| job-attachments | 10 MB |
| handwriting-samples | 5 MB |

---

## Edge Function Security

### JWT Verification
All edge functions require valid JWT tokens:

```toml
# supabase/config.toml
[functions.delete-account]
verify_jwt = true

[functions.job-helper]
verify_jwt = true

[functions.recommend-jobs]
verify_jwt = true
```

### Rate Limiting
The `delete-account` function implements rate limiting:
- Maximum 3 attempts per 24-hour window
- Returns 429 Too Many Requests when limit exceeded

```typescript
const RATE_LIMIT_WINDOW_MS = 86400000; // 24 hours
const MAX_ATTEMPTS_PER_WINDOW = 3;
```

---

## Input Validation

### Database Constraints
```sql
-- Jobs table
ALTER TABLE jobs ADD CONSTRAINT page_count_limit 
  CHECK (page_count > 0 AND page_count <= 500);

ALTER TABLE jobs ADD CONSTRAINT budget_positive 
  CHECK (budget > 0);
```

### Client-Side Validation
- Form validation using react-hook-form + zod
- File type restrictions on upload inputs
- Email domain validation for @aaub.edu.bd

---

## Data Protection

### Sensitive Data Handling
1. **Passwords**: Never stored in plain text; handled by Supabase Auth
2. **Financial Data**: Only accessible to relevant parties (payer/payee)
3. **Messages**: End-to-end protected by RLS policies
4. **Job Attachments**: Private bucket with owner-only access

### What's NOT Stored
- Payment card numbers (Messenger-based payments)
- Raw passwords (bcrypt hashed by Supabase)
- Third-party API keys in frontend code

---

## Security Checklist

### Implemented ✅
- [x] RLS enabled on all tables
- [x] Authentication required for data access
- [x] Owner-based storage policies
- [x] JWT verification on edge functions
- [x] Rate limiting on account deletion
- [x] Input validation constraints
- [x] File size limits
- [x] Email domain restriction

### Recommended Future Improvements
- [ ] Email verification for signups
- [ ] Two-factor authentication
- [ ] Audit logging for sensitive actions
- [ ] CAPTCHA on signup/login
- [ ] IP-based rate limiting
- [ ] Content Security Policy headers

---

## Incident Response

### If You Suspect a Security Issue
1. Do not share details publicly
2. Contact the development team immediately
3. Document what you observed
4. Do not attempt to exploit the vulnerability

### Regular Security Reviews
- RLS policies reviewed on schema changes
- Edge functions audited for vulnerabilities
- Storage policies checked after bucket modifications
- Dependency updates for security patches
