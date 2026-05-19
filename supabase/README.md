# Supabase Setup

1. Open Supabase Dashboard.
2. Select your project.
3. Open **SQL Editor**.
4. Run `schema.sql`.
5. Optional: run `seed.sql` to add demo products.
6. Open **Project Settings > API** and copy:
   - Project URL to `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key to `SUPABASE_SERVICE_ROLE_KEY`

Keep `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local` or Vercel Environment
Variables. Do not expose it with a `NEXT_PUBLIC_` prefix.

All POS tables have RLS enabled and no public policies. This is intentional:
the app should access Supabase only from protected Next.js server/API routes
after the shared passcode session is valid.
