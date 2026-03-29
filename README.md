# NimbleCRM — AI-Powered by Nimbleworx

Relationship intelligence CRM that keeps itself up to date.

---

## Stack

- **Next.js 14** (App Router)
- **Supabase** — persistent storage (swap `user_id = "default"` for real auth later)
- **Vercel** — hosting + serverless functions
- **Anthropic Claude** — voice note processing via server-side API route

---

## Deploy in 5 steps

### 1. Push to GitHub

```bash
cd nimblecrm
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/nimblecrm/nimblecrm.git
git branch -M main
git push -u origin main
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **Database > SQL Editor** and run the contents of `supabase-migration.sql`
3. Go to **Settings > API** and copy:
   - Project URL
   - anon public key

### 3. Set up Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your `nimblecrm` GitHub repo
3. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `ANTHROPIC_API_KEY` | your Anthropic API key |

4. Click **Deploy**

### 4. Local development

```bash
cp .env.local.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
# Open http://localhost:3000
```

### 5. Add auth (next step)

When you're ready to support multiple users, replace `USER_ID = "default"` in `src/components/CRM.tsx` with `supabase.auth.getUser()` and add Supabase Auth to your login flow.

---

## Project structure

```
src/
  app/
    api/ai/route.ts      ← Anthropic proxy (key stays server-side)
    layout.tsx
    page.tsx
  components/
    CRM.tsx              ← Main app component
  lib/
    supabase.ts          ← Supabase client
supabase-migration.sql   ← Run once in Supabase SQL editor
.env.local.example       ← Copy to .env.local and fill in keys
vercel.json
```

## Pipeline test
