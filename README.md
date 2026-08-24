# Team Feedback & Review Tool

A multi-tenant SaaS app for running structured peer/manager review cycles — with **anonymity enforced at the database level**, not just hidden in the UI.

**Live app:** https://feedback-tool-enptvv2ox-fatimas-projects-4ee27625.vercel.app/login
**Source:** https://github.com/fatiimhh/feedback-tool

## The problem

Most feedback tools either fake anonymity (the backend can still trace a response to its author, it's just hidden client-side) or skip it entirely. This app treats anonymity as a data-access problem, not a display problem: a manager literally *cannot query* which specific person submitted which response, because the permission to do so doesn't exist in the database.

## How it works

1. A manager creates a **review cycle** with custom rating/text questions
2. They assign **who reviews whom**
3. Reviewers submit feedback, visible only to them until the cycle closes
4. Managers see **aggregated results only** (averages, response counts, grouped text answers) — reviewer identity is never exposed through any query path available to them

## Tech stack

- **Next.js** (App Router, TypeScript) — frontend + backend in one framework
- **Supabase** (Postgres, Auth, Row Level Security) — the anonymity guarantee lives here
- **Tailwind CSS** — styling
- Deployed on **Vercel**

## The interesting part: RLS-enforced anonymity

Every table has Row Level Security policies scoped to the logged-in user. The key design decision: managers are **never** given a SELECT policy on the raw `responses` table joined to reviewer identity. Instead, they query a Postgres `view` (`cycle_response_summary`) that pre-aggregates responses — averages, counts, and a text array — with no reviewer ID in the result set at all.

This means the anonymity guarantee holds even against someone with direct database access and full knowledge of the schema, not just someone using the app's UI as intended.

Multi-tenancy is enforced the same way: every table checks org membership via RLS helper functions (`is_org_member`, `is_org_manager`), so one organization's data is structurally unreachable from another organization's account — not just filtered out in a query.

## Core features

- Multi-tenant orgs with owner/manager/member roles
- Custom review cycles with rating and free-text questions
- Reviewer assignment (who reviews whom)
- Anonymous or attributed cycles (configurable)
- Aggregated results dashboard
- Open/close cycle lifecycle with submission locking

## Running locally

```bash
git clone https://github.com/fatiimhh/feedback-tool.git
cd feedback-tool
npm install
```

Create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run `schema.sql` in your own Supabase project's SQL Editor, then:

```bash
npm run dev
```

## What I'd build next

- Email invites instead of sharing an org ID manually
- Notification emails when a cycle opens/closes
- CSV export of results