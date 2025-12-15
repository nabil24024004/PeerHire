# PeerHire Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    React Application                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│ │
│  │  │  Pages   │ │Components│ │  Hooks   │ │  TanStack Query  ││ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘│ │
│  │       └────────────┴────────────┴────────────────┘          │ │
│  │                           │                                  │ │
│  │                    Supabase Client                           │ │
│  └───────────────────────────┼──────────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐│
│  │   Auth       │  │   Storage    │  │    Edge Functions        ││
│  │  - Email     │  │  - Avatars   │  │  - delete-account        ││
│  │  - Google    │  │  - Jobs      │  │  - job-helper (AI)       ││
│  │  - Sessions  │  │  - Messages  │  │  - recommend-jobs        ││
│  └──────────────┘  │  - Samples   │  └──────────────────────────┘│
│                    └──────────────┘                              │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL Database                        ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ││
│  │  │profiles │ │  jobs   │ │messages │ │payments │ │ reviews │ ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ ││
│  │                    + Row Level Security                       ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    Realtime                                   ││
│  │  - Message subscriptions                                      ││
│  │  - Typing indicators (Presence)                               ││
│  │  - Notification updates                                       ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack
- **React 18**: UI library with hooks
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library (Radix UI based)

### State Management
```
┌─────────────────────────────────────────────┐
│              State Management               │
├─────────────────────────────────────────────┤
│  Server State     │  TanStack Query         │
│  (API data)       │  - Caching              │
│                   │  - Background refetch   │
│                   │  - Optimistic updates   │
├───────────────────┼─────────────────────────┤
│  Auth State       │  useAuth Hook           │
│  (user session)   │  - React Context        │
│                   │  - Supabase listener    │
├───────────────────┼─────────────────────────┤
│  UI State         │  React useState         │
│  (local)          │  - Component-level      │
└───────────────────┴─────────────────────────┘
```

### Routing Structure
```
/                     → Landing page (public)
/auth                 → Authentication (login/signup)

/app/hirer/
  ├── dashboard       → Hirer dashboard
  ├── tasks           → My Tasks
  ├── view-offers     → View applications
  ├── payments        → Payment history
  ├── profile         → Hirer profile
  └── settings        → Account settings

/app/freelancer/
  ├── dashboard       → Freelancer dashboard
  ├── browse-jobs     → Find work
  ├── jobs            → My Jobs
  ├── job/:id         → Job details
  ├── payments        → Earnings
  ├── profile         → Freelancer profile
  └── settings        → Account settings

/app/
  ├── messages        → Messaging (shared)
  └── live-board      → Freelancer availability
```

### Component Organization
```
src/components/
├── ui/                    # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── DashboardLayout.tsx    # Shared layout with sidebar
├── JobPostingModal.tsx    # Multi-step job creation
├── JobApplicationModal.tsx
├── MessagingSystem.tsx    # Chat interface
├── NotificationPanel.tsx
├── RoleSwitcher.tsx
└── ...
```

---

## Backend Architecture

### Database Tables
See [database-schema.md](./database-schema.md) for complete schema.

### Edge Functions
Located in `supabase/functions/`:

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `delete-account` | Permanently delete user account | Yes (JWT) |
| `job-helper` | AI assistant for freelancers | Yes (JWT) |
| `recommend-jobs` | Job recommendations | Yes (JWT) |

### Storage Buckets
| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | User profile pictures |
| `handwriting-samples` | Yes | Freelancer work samples |
| `job-attachments` | No | Job requirements/files |
| `message-attachments` | No | Chat file sharing |

---

## Security Architecture

### Authentication Flow
```
1. User signs up with @aaub.edu.bd email or Google OAuth
2. Supabase creates auth.users entry
3. Database trigger creates:
   - profiles row
   - user_roles (both hirer + freelancer)
   - hirer_profiles row
   - freelancer_profiles row
4. User is redirected to appropriate dashboard
```

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- **Profiles**: Auth required to view any profile
- **Jobs**: Auth required to view; only hirers can modify their jobs
- **Messages**: Only conversation participants can read/write
- **Payments**: Only payer/payee can view their payments

### Data Flow Security
```
Client Request
     │
     ▼
┌─────────────┐
│  Supabase   │
│  Auth Check │ ─── No token? → 401 Unauthorized
└──────┬──────┘
       │ Valid token
       ▼
┌─────────────┐
│    RLS      │
│   Policies  │ ─── Policy fail? → Empty result / Error
└──────┬──────┘
       │ Allowed
       ▼
┌─────────────┐
│  Database   │
│  Operation  │
└─────────────┘
```

---

## Real-time Architecture

### Message Subscriptions
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe()
```

### Typing Indicators (Presence)
```typescript
supabase.channel(`typing-${conversationId}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .track({ typing: true, user_id: userId })
```

---

## Design Decisions

### Why Dual Roles?
Every user gets both hirer and freelancer roles because:
1. Students may need to hire help AND earn money
2. Reduces friction in onboarding
3. Increases platform liquidity
4. Simplifies role management

### Why Dark Theme?
1. Modern aesthetic matching target demographic
2. Easier on eyes for extended use
3. Consistent with popular apps (Discord, GitHub)
4. Purple accents for brand identity

### Why Messenger for Payments?
1. Quick MVP launch without payment provider integration
2. bKash requires business registration
3. Students already familiar with FB Messenger
4. Allows trust-building between peers first

### Why Supabase/Lovable Cloud?
1. Rapid development with auto-generated types
2. Built-in auth, storage, and realtime
3. PostgreSQL with RLS for security
4. Edge functions for serverless compute
5. No separate backend deployment needed
