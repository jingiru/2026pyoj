-- Server-only leases. Never add this table to supabase_realtime.
create table if not exists public.live_code_monitors (
  session_id uuid primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists live_code_monitors_student_expiry on public.live_code_monitors(student_id, expires_at);
alter table public.live_code_monitors enable row level security;
revoke all on public.live_code_monitors from public, anon, authenticated;
grant select, insert, update, delete on public.live_code_monitors to service_role;
