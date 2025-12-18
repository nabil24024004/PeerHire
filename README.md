# PeerHire 🎓

A university-exclusive peer-to-peer handwriting service marketplace connecting students who need handwritten academic work with skilled freelance writers.

## 🌟 Overview

PeerHire is a React-based web application built for AAUB (Aviation and Aerospace University Bangladesh) students. It enables:
- **Hirers**: Students who need handwritten assignments, lab reports, or other academic materials
- **Freelancers**: Students with good handwriting skills who can complete these tasks for payment

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom dark theme
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Real-time**: Supabase Realtime for messaging
- **Storage**: Supabase Storage for file uploads
- **State Management**: TanStack Query + React Context

## ✨ Features

### Authentication
- Email/password signup with @aaub.edu.bd domain restriction
- Google OAuth integration
- Auto-confirm email signups enabled
- Dual-role system (all users get both hirer and freelancer roles)

### For Hirers
- Dashboard with job statistics
- Multi-step job posting with dynamic pricing
- View and manage applications/offers
- Direct messaging with freelancers
- Payment tracking
- Task completion with freelancer ratings

### For Freelancers
- Browse and apply to open jobs
- Save jobs for later
- Job details with AI assistant support
- Handwriting samples showcase
- Earnings tracking
- Portfolio/completed jobs display

### Messaging
- WhatsApp-style real-time messaging
- Typing indicators
- File attachments (images, PDFs)
- Conversation history

### Additional Features
- Real-time notifications
- Role switching between hirer/freelancer
- Profile management with avatar upload
- Mobile-responsive design
- Dark theme UI with purple accents

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── hooks/              # Custom React hooks
├── integrations/       # Supabase client & types
├── lib/                # Utility functions
├── pages/              # Route components
│   ├── Auth.tsx        # Authentication page
│   ├── Landing.tsx     # Public landing page
│   ├── HirerDashboard.tsx
│   ├── FreelancerDashboard.tsx
│   └── ...
└── assets/             # Static assets

supabase/
├── functions/          # Edge functions
│   ├── delete-account/
│   ├── job-helper/
│   └── recommend-jobs/
├── migrations/         # Database migrations
└── config.toml         # Supabase configuration

docs/                   # Project documentation
```

## 🔐 Security

- Row Level Security (RLS) on all tables
- Owner-based storage bucket policies
- JWT verification on edge functions
- Rate limiting on sensitive endpoints
- Input validation with database constraints
- Authentication required for data access

## 🛠️ Development

This project is built and deployed through [Lovable](https://lovable.dev/projects/143d0107-bbbc-45de-9eb8-fa95045fa6e0).

### Local Development (via GitHub)
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## 📖 Documentation

See the [docs](./docs) folder for detailed documentation:
- [MVP Roadmap](./docs/idea-inbox-mvp-roadmap.md)
- [Architecture](./docs/architecture.md)
- [Database Schema](./docs/database-schema.md)
- [Security](./docs/security.md)
- [Features](./docs/features.md)

## 🚀 Deployment

Simply open [Lovable](https://lovable.dev/projects/143d0107-bbbc-45de-9eb8-fa95045fa6e0) and click on Share → Publish.

### Custom Domain
To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

## 📄 License

Private - AAUB Students Only
