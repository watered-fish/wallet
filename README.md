# Wallet

A single-user personal budgeting PWA. Paycheck-in vs. expenses-out, one sheet
per month with a rolling balance carried between them, an available-to-spend
summary, category budgets, a spending calendar, and a roommate rent splitter.
React + Supabase, installable on a phone
home screen, works offline and auto-syncs when back online.

## Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Realtime), Row Level Security on every table
- **Offline:** service worker (vite-plugin-pwa) + a local write outbox that replays on reconnect
- **Hosting:** Vercel free tier

## 1. Supabase setup
1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **SQL editor → New query →** paste all of [`supabase/schema.sql`](supabase/schema.sql) and run it.
   This creates the tables, RLS policies, and realtime publication.
3. **Authentication → Providers → Email:** keep email/password enabled. Turn off
   "Confirm email" if you want instant login (single user).
4. **Authentication → Users → Add user:** create your one login (email + password).
5. **Project Settings → API:** copy the **Project URL** and the **anon public** key.

## 2. Local development
```bash
npm install
cp .env.example .env.local   # then edit .env.local with your values
npm run dev
```
`.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Open the printed localhost URL and sign in with the user you created.

## 3. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. [vercel.com](https://vercel.com) → **New Project** → import the repo (framework
   auto-detects as Vite).
3. **Settings → Environment Variables:** add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`).
4. Deploy. On your phone, open the URL and **Add to Home Screen** to install the PWA.

## How the money logic works
- **Rolling balance.** Paychecks land at the *end* of a month, so each month's
  closing balance (income − effective expenses, accumulated) carries into the
  next as **“Carried in”**. Income and expenses stay logged in the month they
  actually happened; the carryover is derived, never stored.
- **Available to spend** = carried in + this month's income − this month's
  effective expenses. This is the headline stat, with a ring showing the % of
  funds remaining and a per-day pace estimate until payday.
- **Savings rate** = (total income − effective expenses) ÷ total income, shown
  per month as a secondary stat.
- **Savings goal** (Settings ⚙, synced via the `settings` table): a % of the
  funding paycheck (last month's, since pay lands at month-end) is set aside as
  a gold slice on the dashboard ring and excluded from "Free to spend". Set 0
  to disable.
- **Caleb's rent share** (total rent ÷ 3) is automatically deducted from the month's
  budget. Rich's and Bella's shares never affect it.
- **Budget caps are global** (per category, persist across months); progress bars
  show the current month's spend against each cap.
- **Months auto-roll** at midnight on the 1st — no manual button. Navigate freely
  between months; data is never overwritten.

## Animations
- Falling money plays once on the **first paycheck** of a month (not on edits).
- Falling money also plays when **all three roommates** are fully paid.

## Notes
- The PWA manifest ships an SVG icon. For best install fidelity on iOS, add
  `192x192` and `512x512` PNGs into `public/` and reference them in the
  `manifest.icons` array in `vite.config.ts`.
- All secrets live in env vars; nothing is hardcoded. The `anon` key is safe to ship
  to the browser because RLS restricts every row to the authenticated owner.
