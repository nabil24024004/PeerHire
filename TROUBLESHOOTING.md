# 🔧 Troubleshooting Netlify Black Screen

## Quick Diagnostic Steps

### Step 1: Check Browser Console (MOST IMPORTANT!)

1. **Open your deployed Netlify site**
2. **Press F12** (or Right-click → Inspect)
3. **Go to Console tab**
4. **Look for errors** (usually in red)

**Take a screenshot of any errors and send them to me!**

---

## Common Causes & Fixes

### Cause 1: Missing Environment Variables ⚠️ (90% of cases)

**Symptoms**: Errors mentioning "undefined", "Supabase", or environment variables

**Fix**:
1. Go to Netlify Dashboard → Your Site
2. Click **Site settings** → **Environment variables**
3. **Verify these 3 variables are set**:
   ```
   VITE_SUPABASE_PROJECT_ID
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_URL
   ```
4. If missing, add them (values from your `.env` file)
5. **Important**: After adding variables, go to **Deploys** tab
6. Click **Trigger deploy** → **Deploy site**

---

### Cause 2: Asset Loading Issues

**Symptoms**: Console shows "Failed to load resource" or 404 errors for JS/CSS files

**Check Network Tab**:
1. Press F12 → **Network** tab
2. Refresh the page (F5)
3. Look for any red/failed requests
4. Check if `index.js` or CSS files failed to load

**Fix**: This is usually an environment variable issue, but check console first.

---

### Cause 3: JavaScript Errors

**Symptoms**: Console shows JavaScript errors before anything renders

**Common errors**:
- `Cannot read property of undefined`
- `X is not defined`
- Import errors

**What to do**: Take a screenshot of the exact error message.

---

## Immediate Actions

### Action 1: Verify Environment Variables

Run this command locally to see what variables your app needs:
```bash
grep -r "import.meta.env" src/
```

These are the variables that **MUST** be set in Netlify.

### Action 2: Check Build Logs

1. Go to Netlify Dashboard → **Deploys**
2. Click on the latest deploy
3. Scroll through build log
4. Look for any **warnings** or **errors** in red

### Action 3: Test Local Production Build

```bash
npm run build
npm run preview
```

Does it work locally? If yes, it's likely environment variables. If no, there's a build issue.

---

## What to Send Me

Please provide:
1. ✅ **Screenshot of browser console** (F12 → Console tab)
2. ✅ **Screenshot of Network tab** (showing failed requests)
3. ✅ **Confirmation**: Did you set all 3 environment variables in Netlify?
4. ✅ **Your Netlify site URL** (for debugging)

---

## Quick Test: Are Environment Variables Set?

In Netlify:
1. Site settings → Environment variables
2. You should see **3 variables** listed
3. If you see 0 or 1 or 2, that's the problem!

**After setting variables**: You MUST trigger a new deploy for them to take effect.

---

## Most Likely Fix (Try This First!)

```
🎯 99% of black screens are caused by missing environment variables.

Steps:
1. Netlify Dashboard → Site settings → Environment variables
2. Add all 3 VITE_SUPABASE_* variables
3. Deploys tab → Trigger deploy
4. Wait ~1 minute
5. Refresh your site
```

Let me know what you find in the console! That will tell us exactly what to fix.
