-- Private Broadcast channels only. No student code is exposed through tables.
-- A dedicated role avoids granting these tokens access through existing
-- policies for the application's authenticated users.
begin;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'pyoj_live_code') then
    create role pyoj_live_code nologin;
  end if;
end $$;
grant pyoj_live_code to authenticator;
-- Supabase owns realtime.messages and postgres cannot grant its privileges
-- directly. Inherit the existing public-client role instead; authenticated
-- and service_role privileges remain excluded. RLS still restricts channels.
grant anon to pyoj_live_code;
grant usage on schema realtime to pyoj_live_code;
grant execute on function realtime.topic() to pyoj_live_code;
drop policy if exists "live_code_receive" on realtime.messages;
drop policy if exists "live_code_send" on realtime.messages;
create policy "live_code_receive" on realtime.messages for select to pyoj_live_code
using (extension = 'broadcast' and realtime.topic() = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'live_code_topic'));
create policy "live_code_send" on realtime.messages for insert to pyoj_live_code
with check (extension = 'broadcast' and realtime.topic() = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'live_code_topic'));
commit;
