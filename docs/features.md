# PeerHire Features Documentation

## User Roles

### Dual-Role System
Every user on PeerHire has access to both roles:
- **Hirer**: Post jobs, hire freelancers, make payments
- **Freelancer**: Browse jobs, submit applications, receive payments

Users can switch between roles using the Role Switcher in the sidebar.

---

## Authentication

### Sign Up
- Email/password with @aaub.edu.bd domain restriction
- Google OAuth (university email recommended)
- Auto-confirm enabled (no email verification)

### Sign In
- Email/password
- Google OAuth
- Remember me (persistent sessions)

### Account Management
- Profile editing (name, department, year, bio)
- Avatar upload
- Password change
- Account deletion (with rate limiting)

---

## Hirer Features

### Dashboard (`/app/hirer/dashboard`)
- Statistics cards: Jobs Posted, Active Jobs, Completed, Total Spent
- Quick action buttons
- Recent activity feed

### Job Posting
Multi-step modal flow:
1. **Step 1**: Title, category (work type), subject
2. **Step 2**: Page count, quality level, deadline with dynamic pricing
3. **Step 3**: File uploads for requirements, description
4. **Step 4**: Review summary and confirm

**Dynamic Pricing Formula:**
```
Price = BASE_PRICE × page_count × quality_multiplier
```

### My Tasks (`/app/hirer/tasks`)
- View all posted jobs
- Filter by status (Open, Assigned, In Progress, Completed)
- See application count per job
- Access job details and manage

### View Offers (`/app/hirer/view-offers`)
- See all applications for a specific job
- View freelancer profiles, cover letters, proposed prices
- Accept or reject applications
- Message applicants directly

### Task Completion
- Mark completed jobs as done
- Rate freelancer (1-5 stars)
- Leave optional review comment
- Rating auto-updates freelancer's profile

### Payments (`/app/hirer/payments`)
- Total spent overview
- Payment history list
- Transaction status tracking
- Messenger payment instructions

---

## Freelancer Features

### Dashboard (`/app/freelancer/dashboard`)
- Statistics cards: Active Jobs, Pending Applications, Completed, Earnings
- Quick access to find work
- Recent activity

### Browse Jobs (`/app/freelancer/browse-jobs`)
- View all open jobs
- Search by keyword
- Filter by subject, work type, budget range
- Save jobs for later (bookmark)
- Apply to jobs

### Job Application
Modal with:
- Cover letter text area
- Proposed price (pre-filled with job budget)
- Submit application

### My Jobs (`/app/freelancer/jobs`)
Tabs:
- **Active**: Currently assigned jobs
- **Pending**: Awaiting application response
- **Completed**: Finished jobs

Each job card shows:
- Title, hirer name
- Category, subject
- Page count, price
- Deadline, status
- Actions (Open Job, Message)

### Job Details (`/app/freelancer/job/:id`)
For accepted jobs:
- Full job requirements
- Attached files from hirer
- AI Helper chatbot for assistance
- Status timeline
- Deliverables section

### Saved Jobs
- Bookmarked jobs appear in "Saved" tab
- Quick access to apply later
- Remove from saved list

### Earnings (`/app/freelancer/payments`)
- Total earned overview
- Completed jobs count
- Outstanding payments
- Earnings history list

### Profile (`/app/freelancer/profile`)
- Personal information
- Skills tags
- Handwriting samples gallery
- Performance statistics
- Reviews received
- Portfolio of completed work

---

## Messaging System

### WhatsApp-Style Interface
- Dark theme with green accents (#00a884)
- Conversation list sidebar
- Message bubbles with timestamps
- Unread message indicators

### Features
- Real-time message delivery
- Typing indicators
- File attachments (images, PDFs up to 10MB)
- Message read status
- Conversation search

### Access Points
- Sidebar "Messages" link
- "Message" button on job cards
- "Message" button on applications
- Direct from Live Board profiles

---

## Live Board

### Purpose
Real-time view of available freelancers for quick hiring.

### Features
- Freelancer cards with:
  - Avatar and name
  - Skills tags
  - Rating and reviews
  - Availability status (Available/Busy/Offline)
  - Hourly rate
- Filter by skills, availability
- Direct message button
- View profile button

---

## Notifications

### Notification Panel
- Bell icon in header
- Dropdown with recent notifications
- Unread count badge
- Mark as read functionality

### Notification Types
- New messages received
- Application status changes (accepted/rejected)
- New applications to your jobs (hirers)
- Job assignments (freelancers)

---

## Profile Management

### Common Fields
- Full name
- Email (read-only)
- Department
- Year of study
- Bio/About
- Avatar

### Hirer-Specific
- Default budget preference
- Preferred subjects
- Hiring history stats

### Freelancer-Specific
- Skills tags
- Hourly rate
- Availability status
- Handwriting style description
- Handwriting samples (upload gallery)
- Portfolio
- Reviews received

---

## Settings

### Account Settings
- Update profile information
- Change password

### Preferences
- Notification settings (messages, offers, proposals)
- Default budget (hirers)
- Availability status (freelancers)

### Danger Zone
- Delete account (irreversible)
- Confirmation required

---

## Mobile Responsiveness

### Adaptive Layouts
- Single-column on mobile (< 640px)
- Multi-column on tablet/desktop
- Touch-friendly tap targets (44px minimum)

### Navigation
- Collapsible sidebar
- Bottom navigation on mobile
- Hamburger menu

### Messaging
- Stacked navigation (list → chat)
- Full-screen chat on mobile
- Optimized touch interactions
