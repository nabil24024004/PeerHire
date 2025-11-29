# 🚀 Deploying PeerHire to Netlify

This guide will walk you through deploying the PeerHire application to Netlify.

## Prerequisites

- A [Netlify account](https://app.netlify.com/signup) (free tier works great!)
- Your PeerHire repository pushed to GitHub/GitLab/Bitbucket
- Supabase project credentials

## Quick Deploy

### Option 1: Deploy via Netlify UI (Recommended for First Time)

1. **Connect Your Repository**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider and select the `peer03-main` repository

2. **Configure Build Settings**
   
   Netlify should auto-detect your settings from `netlify.toml`, but verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

3. **Set Environment Variables**
   
   Before deploying, add these environment variables in:
   **Site settings → Environment variables → Add a variable**

   ```
   VITE_SUPABASE_PROJECT_ID = your-project-id
   VITE_SUPABASE_PUBLISHABLE_KEY = your-publishable-anon-key
   VITE_SUPABASE_URL = https://your-project.supabase.co
   ```

   > ⚠️ **Important**: Get these values from your Supabase project settings

4. **Deploy!**
   - Click "Deploy site"
   - Netlify will build and deploy your site (takes ~1-2 minutes)
   - You'll get a random subdomain like `random-name-123456.netlify.app`

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Follow the prompts to link your site
```

## Custom Domain (Optional)

1. Go to **Site settings → Domain management**
2. Click "Add custom domain"
3. Follow instructions to configure DNS

## Automatic Deployments

Once connected, Netlify automatically deploys when you push to your main branch:
- **Push to main** → Automatic production deploy
- **Pull requests** → Deploy previews (great for testing!)

## Configuration Files

Your project now includes:

### `netlify.toml`
- Build command and publish directory
- SPA redirect rules for React Router
- Security headers
- Asset caching configuration

### `public/_redirects`
- Backup redirect rules for single-page application routing
- Ensures all routes work correctly (e.g., `/freelancer/dashboard`)

### `.env.example`
- Template showing required environment variables
- Reference when setting up Netlify environment

## Build Output

Your production build includes:
- **Main bundle**: ~872 KB (247 KB gzipped)
- **CSS**: ~75 KB (13 KB gzipped)
- **Assets**: Images and static files

> 💡 **Note**: The bundle size warning is normal for React apps with many dependencies. Consider code splitting if it becomes an issue.

## Troubleshooting

### Routes return 404
- **Solution**: Ensure `_redirects` file is in the `public` folder
- The `netlify.toml` redirect rules should handle this automatically

### Environment variables not working
- **Check**: Variable names must start with `VITE_` for Vite to expose them
- **Verify**: Variables are set in Netlify dashboard, not in `.env` file
- **Redeploy**: After adding variables, trigger a new deploy

### Build fails
- **Check build logs** in Netlify dashboard
- **Verify** all dependencies are in `package.json` (not just `devDependencies`)
- **Test locally**: Run `npm run build` to catch errors early

### Supabase connection issues
- **Verify** environment variables are correct
- **Check** Supabase project is active and accessible
- **Review** CORS settings in Supabase if needed

## Monitoring Your Site

- **Analytics**: Available in Netlify dashboard
- **Build logs**: Click on any deploy to see detailed logs
- **Forms**: Built-in form handling (if you add forms later)
- **Functions**: Serverless functions support (for future features)

## Next Steps

After deployment:
1. ✅ Test all routes and functionality
2. ✅ Verify Supabase integration works
3. ✅ Check authentication flow
4. ✅ Test on mobile devices
5. 🎉 Share your live site!

## Security Checklist

- [x] `.env` file is in `.gitignore`
- [x] Environment variables set in Netlify (not in code)
- [x] Security headers configured in `netlify.toml`
- [ ] Consider enabling Netlify Identity for additional features
- [ ] Set up deploy notifications in team chat

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
- [Supabase Documentation](https://supabase.com/docs)

---

**Your site is now ready for deployment!** 🎊

Questions? Check the [Netlify Community Forums](https://answers.netlify.com/) or [Supabase Discord](https://discord.supabase.com/).
