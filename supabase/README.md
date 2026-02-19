# Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In SQL Editor, run the contents of `migrations/20250219100000_initial_schema.sql`.
3. Copy the project URL and keys into `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)

Optional: install [Supabase CLI](https://supabase.com/docs/guides/cli) and run `supabase db push` to apply migrations.
