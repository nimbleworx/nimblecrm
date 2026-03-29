\# NimbleCRM — Claude Code Brief



\## What this is

NimbleCRM is an AI-powered CRM intelligence layer. It sits on top of a user's 

existing CRM and automates the biggest pain in CRM adoption — keeping it up to date.



The core insight: CRMs fall out of date not because people are lazy, but because 

updating them requires a separate act from the actual work. NimbleCRM eliminates 

that act by scanning signals from email, voice notes, meeting notes, and other 

sources, then automatically capturing, prompting, and validating CRM data changes.



For users without a CRM, NimbleCRM includes a lightweight built-in CRM.



\## Target users

Companies and individuals who use a CRM but struggle to keep it current. 

Also early-stage startups who need a simple CRM with AI capture built in from day one.



\## Product status

Early stage. Confirm what exists before building anything new.

What has been built:

\- Supabase Auth (email/password sign-up and sign-in, per-user RLS on crm_store)
\- Lightweight built-in CRM (contacts, pipeline, activity log, AI Radar, reminders, voice notes)
\- AI voice note processing via Claude API (`/api/ai`)



\## The AI capture model

Signal sources (planned):

\- Email scanning — detect conversation signals that suggest CRM changes

\- Voice notes — transcribe and extract structured CRM updates

\- Meeting notes — parse and map to deal/contact fields

\- Calendar signals — infer relationship activity from meeting patterns

\- WhatsApp and messaging — capture deal signals from conversations

\- Manual input — fallback for anything not captured automatically



Confidence-based model:

\- Low-stakes changes (e.g. last contacted date) — auto-log silently

\- High-stakes changes (e.g. deal stage, close date) — prompt user to confirm



\## CRM integrations

Planned: any CRM via API. No specific CRM targeted yet.

Built-in lightweight CRM available for users without an existing CRM.



\## Stack

\- Next.js 14 (App Router)

\- TypeScript

\- Supabase (auth + database)

\- Vercel (deployment)

\- Anthropic Claude API (AI capture and signal processing)

\- Check package.json for UI library before assuming



\## Local development environment

Two separate file systems are in play:

\- Claude Code runs in Linux/WSL at `/home/user/nimblecrm`
\- The dev server runs from Windows PowerShell at `C:\Users\davie\Projects\nimblecrm`

These are not the same files. After making changes, the user must pull them into the Windows copy before testing:

```powershell
git pull origin <branch>
```

Then restart the dev server (`npm run dev`) to pick up the changes.

Do not tell the user to edit files directly or clear caches until after they have pulled the latest changes.

\## Backlog

Managed in GitHub Issues: https://github.com/nimbleworx/nimblecrm/issues

When asked to log something as a backlog item, create a GitHub Issue.



\## Conventions

\- App Router only — no Pages Router

\- Server components by default, client components only when needed

\- All DB access via Supabase client in /lib

\- Keep components small and single-purpose

\- TypeScript strict mode — no any types

\- Never assume a UI library — check package.json first



\## Deployment

\- Vercel auto-deploys on push to main

\- Do not push directly to main — always use a feature branch and PR

\- CI runs Playwright tests automatically on every PR — must pass before merging



\## Testing

\- Playwright for end to end tests in /tests

\- Run locally with: npx playwright test

\- Add a test for every new page or critical user flow



\## Do not

\- Add npm packages without checking first

\- Modify Supabase schema without showing the migration file first (migrations are NOT auto-applied — the user must paste them into Database → SQL Editor in the Supabase dashboard manually)

\- Push directly to main

\- Assume any feature exists — read the folder structure first



\## At the start of every session

1\. Read this file

2\. Read the folder structure

3\. Tell me what you see and confirm what we are working on today

