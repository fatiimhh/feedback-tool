# Team Feedback / Review Tool — starter scaffold

## What's here
```
feedback-tool/
├── schema.sql                 # run this in Supabase SQL Editor first
├── .env.local.example         # copy to .env.local and fill in
├── lib/supabase/
│   ├── client.ts               # for use in "use client" components
│   └── server.ts                # for Server Components / Route Handlers (RLS-aware)
└── types/database.ts           # TypeScript types matching the schema
```

## How the pieces fit together

1. **schema.sql** creates 6 tables (organizations, org_members, review_cycles,
   cycle_questions, cycle_participants, responses) plus a `cycle_response_summary`
   view. RLS policies are attached directly to the tables — this is the part
   worth understanding well, since it's your best interview talking point.

2. **The anonymity guarantee** works like this: a reviewer can INSERT and SELECT
   their own rows in `responses`, but there is deliberately NO policy letting a
   manager read `responses` joined to `reviewer_user_id`. Managers instead query
   `cycle_response_summary`, which is pre-aggregated (averages, counts, and a
   text array) with no reviewer identity in it at all. So anonymity isn't just
   "hidden in the UI" — it's structurally impossible to query the reviewer's
   identity through the manager's permissions.

3. **lib/supabase/client.ts vs server.ts** — this pattern exists because
   Next.js App Router runs code in two places. Client components (interactive
   UI, forms) use `client.ts`. Server Components, Server Actions, and Route
   Handlers use `server.ts`, which forwards the user's session cookie so
   Postgres RLS knows who `auth.uid()` is.

## Next steps (in order)
1. Follow the Supabase setup steps and run `schema.sql`
2. `npx create-next-app@latest .` (TypeScript + App Router + Tailwind) inside
   this folder, then `npm install @supabase/supabase-js @supabase/ssr`
3. Copy `.env.local.example` to `.env.local`, fill in your real keys
4. Build the auth flow first (sign up, log in, create an org) — everything
   else depends on `auth.uid()` existing
5. Then: create a review cycle → add questions → add participants → submit
   responses → manager dashboard reading from `cycle_response_summary`

## Suggested build order for milestones
- [ ] Auth + org creation
- [ ] Invite members to org
- [ ] Create a review cycle with questions
- [ ] Assign participants (who reviews whom)
- [ ] Feedback submission form
- [ ] Manager dashboard (using the summary view)
- [ ] Close cycle + lock further submissions
- [ ] Polish: empty states, loading states, error handling