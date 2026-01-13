# PeerHire MVP Roadmap

> **Last Updated:** December 16, 2024

## 🎯 Vision

PeerHire is a peer-to-peer marketplace exclusively for AAUB students, connecting those who need academic work done with skilled freelancers. A "Fiverr for university students" ecosystem.

---

## ✅ What's Working (Completed Features)

### Core Platform
- [x] Landing page with role-based CTAs
- [x] Authentication (email/password + Google OAuth)
- [x] @aaub.edu.bd email domain restriction
- [x] Dual-role system (users have both hirer/freelancer roles)
- [x] Role switching via localStorage
- [x] Dark theme UI with purple accents
- [x] Mobile-responsive design

### Hirer Features
- [x] Dashboard with statistics (jobs posted, active, completed)
- [x] Job posting system with custom subjects
- [x] My Tasks page with job management
- [x] View applications from freelancers
- [x] Accept/reject applications
- [x] Direct messaging with freelancers
- [x] Task completion with rating system
- [x] Payments page (stats from completed jobs)
- [x] Profile page
- [x] Settings page (bio, student_id)

### Freelancer Features
- [x] Dashboard with earnings statistics
- [x] Find Work / Browse Jobs page with search/filters
- [x] Job application with cover letter and proposed rate
- [x] Save jobs for later (localStorage)
- [x] My Jobs page with tabs (Active, Pending, Completed)
- [x] Withdraw pending applications
- [x] Earnings/payments tracking (from applications)
- [x] Profile page with skills
- [x] Settings page with availability status

### Messaging System
- [x] WhatsApp-style UI
- [x] Real-time message delivery (Supabase Realtime)
- [x] Direct messages via sender_id/receiver_id
- [x] Conversation list derived from messages
- [x] Start chat from job cards and Live Board

### Live Board
- [x] Shows available freelancers in real-time
- [x] Filter by availability status
- [x] Message freelancers directly

### Notifications
- [x] Notification panel in header
- [x] Real-time subscription
- [x] Mark as read functionality

### Security
- [x] Row Level Security on all tables
- [x] Authentication required for data access
- [x] Simple, non-recursive RLS policies
- [x] Profile creation trigger on signup

---

## 🔧 Recent Fixes (December 2024)

### December 16, 2024 - Application Flow Fixes
| Component | Fix Applied |
|-----------|-------------|
| JobApplicationModal | Changed `job_applications` → `applications`, `proposed_price` → `proposed_rate` |
| HirerTasks | Updated Task interface to use `category`, query applications for freelancer |
| HirerViewOffers | Fetch profiles separately, removed `freelancer_id` from jobs update |
| FreelancerJobs | Removed Accept button (hirers accept), renamed Decline to Withdraw |
| HirerProfile | Use `category` instead of `work_type`, fix division by zero |
| JobPostingModal | Updated subjects list, added custom subject input for "Others" |

### December 15, 2024 - Schema Migration Cleanup
| Component | Fix Applied |
|-----------|-------------|
| Authentication | Query `profiles` table with `is_hirer`/`is_freelancer` |
| Role Switching | Use localStorage instead of `active_role` column |
| Dashboard Queries | Use `applications` table (not `job_applications`) |
| Messaging | Query `messages` directly (no `conversations` table) |
| Live Board | Query `profiles` with `is_freelancer = true` |
| Settings | Use `bio`/`student_id` instead of `department`/`year_of_study` |
| Payments | Calculate from completed jobs (no `payments` table) |
| Saved Jobs | Use localStorage (no `saved_jobs` table) |
| Notifications | Use `is_read` column (not `read`) |

### Critical Migration
**Run `supabase/migrations/013_fix_jobs_rls_recursion.sql`** to fix RLS infinite recursion!

---

## 🚧 Known Limitations / Current Gaps

### Payment Integration
- **Current State**: Stats calculated from job budgets
- **No bKash integration yet** - manual payment coordination via chat
- Banner displayed informing users

### Tables Not Implemented
These features would require new tables:
- ❌ Saved jobs (using localStorage as workaround)
- ❌ Payment records (calculating from jobs)
- ❌ Notification preferences (using localStorage)
- ❌ Freelancer verification system

### Mobile Experience
- Responsive design works but could be better
- Consider PWA in future

---

## 📊 Key Metrics to Track

1. **User Acquisition**
   - New signups
   - Google OAuth vs email
   - Conversion from landing page

2. **Marketplace Health**
   - Jobs posted per day/week
   - Applications per job
   - Job completion rate

3. **Engagement**
   - Messages sent
   - Return user rate
   - Role switch frequency

4. **Quality**
   - Average rating
   - Dispute rate

---

## 🗓️ Release Phases

### Phase 1: MVP ✅ (Current State)
- Core marketplace functionality
- Simplified schema (profiles + jobs + applications + messages)
- Manual payments via chat
- LocalStorage for preferences

### Phase 2: Enhanced UX (Planned)
- [ ] bKash payment integration
- [ ] Push notifications (web)
- [ ] Saved jobs table
- [ ] Advanced search and recommendations

### Phase 3: Growth (Future)
- [ ] Referral system
- [ ] Freelancer badges/levels
- [ ] Email notifications
- [ ] Analytics dashboard

### Phase 4: Scale (Vision)
- [ ] Multi-university support
- [ ] Mobile apps
- [ ] AI-powered matching

---

## 💡 Ideas Inbox

### High Priority
- [ ] bKash payment integration
- [ ] Email notifications for important events
- [ ] Deadline reminders
- [ ] Proper saved_jobs table

### Medium Priority
- [ ] Skill verification
- [ ] Job templates
- [ ] Favorite freelancers list
- [ ] Better file attachments

### Low Priority
- [ ] Light theme toggle
- [ ] Voice messages
- [ ] Video call integration

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 2024 | Simplified schema | Removed unused tables (user_roles, freelancer_profiles, conversations, etc.) |
| Dec 2024 | LocalStorage for activeRole | Simpler than database column, faster switching |
| Dec 2024 | Direct messages (no conversations table) | Derive conversations from message sender/receiver pairs |
| Dec 2024 | LocalStorage for saved jobs | Quick solution without new table migration |
| Dec 2024 | Calculate payments from jobs | No need for separate payments table yet |
| 2024 | Dual-role system | All users can be both hirers and freelancers |
| 2024 | @aaub.edu.bd restriction | Ensure university-exclusive community |
| 2024 | Dark theme default | Modern aesthetic |

---

## 🗂️ Current Database Schema

**Active Tables:**
- `profiles` - User accounts (dual-role)
- `jobs` - Job postings
- `applications` - Freelancer applications
- `messages` - Direct messages
- `reviews` - Job reviews
- `notifications` - User notifications
- `disputes` - Job disputes

**See `docs/database-schema.md` for full details.**
