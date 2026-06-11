-- Run this once in the Supabase SQL Editor for an existing project.
-- Teacher dashboard reads now use the server-only service role key.

revoke select on public.submissions from anon, authenticated;

drop policy if exists "class dashboard can read submissions" on public.submissions;
