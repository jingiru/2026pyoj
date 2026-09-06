-- Run after installing the migration. All fixture data is rolled back.
begin;
do $$
declare c uuid; p uuid; other_p uuid; receipt jsonb; retry jsonb; started timestamptz; ended timestamptz; denied boolean; request_id uuid := gen_random_uuid(); role_name text; table_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    foreach table_name in array array['challenges','challenge_participants','challenge_submissions'] loop
      if has_table_privilege(role_name, 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Client role has table access: % %', role_name, table_name; end if;
      if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then raise exception 'RLS missing: %', table_name; end if;
    end loop;
    if has_function_privilege(role_name, 'public.challenge_control(uuid,text,integer)', 'EXECUTE') or has_function_privilege(role_name, 'public.challenge_receive_submission(uuid,uuid,text,text,uuid)', 'EXECUTE') then raise exception 'Client can execute server function'; end if;
  end loop;
  if to_regclass('public.challenge_events') is not null then raise exception 'Unused timing history table still exists'; end if;
  insert into public.challenges(entry_code,title,duration_minutes,problem_snapshots) values('ACDE2345', '자동 검증용', 10, '[{"id":"test-p1","testCases":[{"input":"","output":"1"}]}]') returning id into c;
  insert into public.challenge_participants(challenge_id,student_no,name,token_hash) values(c,'9991','검증학생',repeat('a',64)) returning id into p;
  denied := false;
  begin perform public.challenge_receive_submission(c,p,'test-p1','print(1)',request_id); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Pre-start submission accepted'; end if;
  perform public.challenge_control(c,'start',10);
  select started_at, ends_at into started, ended from public.challenges where id = c;
  if ended - started <> interval '10 minutes' then raise exception 'Wrong duration'; end if;
  denied := false;
  begin perform public.challenge_control(c,'start',10); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Double start accepted'; end if;
  denied := false;
  begin perform public.challenge_receive_submission(c,p,'outside-problem','print(1)',request_id); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Foreign problem accepted'; end if;
  denied := false;
  begin perform public.challenge_receive_submission(c,gen_random_uuid(),'test-p1','print(1)',request_id); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Foreign participant accepted'; end if;
  receipt := public.challenge_receive_submission(c,p,'test-p1','print(1)',request_id);
  if not (receipt->>'fresh')::boolean then raise exception 'Fresh submission missing'; end if;
  denied := false;
  begin perform public.challenge_receive_submission(c,p,'test-p1','print(1)',gen_random_uuid()); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Concurrent grading accepted'; end if;
  retry := public.challenge_receive_submission(c,p,'test-p1','print(1)',request_id);
  if (retry->>'fresh')::boolean or retry->'submission'->>'id' <> receipt->'submission'->>'id' then raise exception 'Duplicate submission counted'; end if;
  update public.challenges set started_at = clock_timestamp() - interval '10 minutes', ends_at = clock_timestamp() - interval '1 millisecond' where id = c;
  denied := false;
  begin perform public.challenge_receive_submission(c,p,'test-p1','print(1)',gen_random_uuid()); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Late submission accepted'; end if;
  -- A result received before expiry can finish grading afterwards.
  update public.challenge_submissions set status = 'accepted', judged_at = clock_timestamp() where id = (receipt->'submission'->>'id')::uuid;
  perform public.challenge_control(c,'extend',5);
  select ends_at into ended from public.challenges where id = c;
  if ended <= clock_timestamp() + interval '4 minutes 59 seconds' then raise exception 'Expired challenge did not reopen'; end if;
  perform public.challenge_receive_submission(c,p,'test-p1','print(1)',gen_random_uuid());
end;
$$;
select 'Challenge SQL checks passed' as result;
rollback;
