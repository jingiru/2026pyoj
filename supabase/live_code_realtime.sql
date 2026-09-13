-- Private Broadcast channels only. No student code is exposed through tables.
-- A dedicated role avoids granting these tokens access through existing
-- policies for the application's authenticated users.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'pyoj_live_code') then
    create role pyoj_live_code nologin;
  end if;
end $$;
grant pyoj_live_code to authenticator;
grant usage on schema realtime to pyoj_live_code;
grant select, insert on realtime.messages to pyoj_live_code;
grant execute on function realtime.topic() to pyoj_live_code;
drop policy if exists "live_code_receive" on realtime.messages;
drop policy if exists "live_code_send" on realtime.messages;
create policy "live_code_receive" on realtime.messages for select to pyoj_live_code
using (extension = 'broadcast' and realtime.topic() = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'live_code_topic'));
create policy "live_code_send" on realtime.messages for insert to pyoj_live_code
with check (extension = 'broadcast' and realtime.topic() = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'live_code_topic'));
