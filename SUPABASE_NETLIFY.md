# Supabase + Netlify: Quick Reference

## Yes, Supabase WILL Work on Netlify! ✅

Your Supabase is **cloud-hosted** and accessible from anywhere. Netlify deployment won't affect it.

## Required: Set These in Netlify Dashboard

Go to: **Site settings → Environment variables**

```
VITE_SUPABASE_PROJECT_ID = grttsxdylpdpfzficqlk
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydHRzeGR5bHBkcGZ6ZmljcWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzU4MjgsImV4cCI6MjA3OTcxMTgyOH0.zr5dO00iDmDcU5mmh82tbMv6FY9ujyvNvn_vmeWv7v0
VITE_SUPABASE_URL = https://grttsxdylpdpfzficqlk.supabase.co
```

## That's It!

Once you set these variables in Netlify:
- ✅ All database queries work
- ✅ Authentication works
- ✅ Real-time subscriptions work
- ✅ Storage/uploads work

**Nothing else needed for Supabase integration.**
