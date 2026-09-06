drop table if exists public.challenge_events;

alter table public.challenges drop constraint if exists challenges_entry_code_check;
alter table public.challenges add constraint challenges_entry_code_check
  check (entry_code ~ '^[ACDEFGHJKLMNPQRSTUVWXYZ2345679]{8}$') not valid;

create or replace function public.challenge_control(p_id uuid, p_action text, p_minutes integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.challenges; t timestamptz;
begin
  if p_minutes is null or p_minutes < 1 or p_minutes > 480 then raise exception '시간은 1~480분으로 설정해주세요.'; end if;
  select * into c from public.challenges where id = p_id for update;
  if not found then raise exception '챌린지를 찾을 수 없습니다.'; end if;
  t := clock_timestamp();
  if p_action = 'start' then
    if c.started_at is not null then raise exception '이미 시작한 챌린지입니다.'; end if;
    update public.challenges set started_at = t, ends_at = t + make_interval(mins => p_minutes), duration_minutes = p_minutes where id = p_id returning * into c;
  elsif p_action = 'extend' then
    if c.started_at is null then raise exception '시작한 후에 시간을 추가할 수 있습니다.'; end if;
    update public.challenges set ends_at = greatest(ends_at, t) + make_interval(mins => p_minutes) where id = p_id returning * into c;
  else raise exception '잘못된 진행 요청입니다.';
  end if;
  return to_jsonb(c);
end;
$$;

revoke all on function public.challenge_control(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.challenge_control(uuid,text,integer) to service_role;
