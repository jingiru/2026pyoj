-- Read-only diagnostics for student login, code run, and submission logging.
-- Run the whole script in Supabase SQL Editor and share the result tables.

select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'students',
    'student_access_logs',
    'student_sessions',
    'code_runs',
    'submissions',
    'submission_results'
  )
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'students',
    'student_access_logs',
    'student_sessions',
    'code_runs',
    'submissions',
    'submission_results'
  )
order by tablename, policyname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'students',
    'student_access_logs',
    'student_sessions',
    'code_runs',
    'submissions',
    'submission_results'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;
