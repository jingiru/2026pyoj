-- Challenge data is accessible exclusively through authenticated server routes.
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  entry_code text not null unique check (entry_code ~ '^[A-F0-9]{8}$'),
  title text not null check (length(title) between 1 and 100),
  duration_minutes integer not null check (duration_minutes between 1 and 480),
  show_leaderboard boolean not null default false,
  problem_snapshots jsonb not null check (jsonb_typeof(problem_snapshots) = 'array' and jsonb_array_length(problem_snapshots) between 1 and 50),
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  check ((started_at is null and ends_at is null) or (started_at is not null and ends_at > started_at))
);
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  student_no text not null check (student_no ~ '^[0-9]{4}$'),
  name text not null check (length(name) between 1 and 30),
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  joined_at timestamptz not null default clock_timestamp(),
  unique(challenge_id, student_no),
  unique(challenge_id, token_hash),
  unique(challenge_id, id)
);
create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  participant_id uuid not null,
  problem_id text not null,
  code text not null check (length(code) between 1 and 20000),
  status text not null default 'pending' check (status in ('pending','accepted','wrong_answer','runtime_error','code_requirement_failed')),
  passed_count integer not null default 0,
  total_count integer not null default 0,
  feedback text not null default '',
  received_at timestamptz not null default clock_timestamp(),
  judged_at timestamptz,
  foreign key(challenge_id, participant_id) references public.challenge_participants(challenge_id, id),
  unique(participant_id, request_id)
);
create index challenge_submissions_board on public.challenge_submissions(challenge_id, received_at, id);
create index challenge_submissions_history on public.challenge_submissions(participant_id, problem_id, received_at);
create table public.challenge_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  action text not null check (action in ('start','extend')),
  minutes integer not null,
  created_at timestamptz not null default clock_timestamp()
);
create index challenge_events_challenge on public.challenge_events(challenge_id, created_at);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.challenge_events enable row level security;
revoke all on public.challenges, public.challenge_participants, public.challenge_submissions, public.challenge_events from public, anon, authenticated;
grant all on public.challenges, public.challenge_participants, public.challenge_submissions, public.challenge_events to service_role;

create function public.challenge_control(p_id uuid, p_action text, p_minutes integer)
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
  insert into public.challenge_events(challenge_id, action, minutes) values(p_id, p_action, p_minutes);
  return to_jsonb(c);
end;
$$;

create function public.challenge_receive_submission(p_challenge uuid, p_participant uuid, p_problem text, p_code text, p_request uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.challenges; s public.challenge_submissions; problem jsonb; t timestamptz;
begin
  select * into c from public.challenges where id = p_challenge for update;
  if not found then raise exception '챌린지를 찾을 수 없습니다.'; end if;
  if not exists(select 1 from public.challenge_participants where id = p_participant and challenge_id = p_challenge) then raise exception '입장 권한이 없습니다.'; end if;
  select * into s from public.challenge_submissions where participant_id = p_participant and request_id = p_request;
  if found then return jsonb_build_object('fresh', false, 'submission', to_jsonb(s)); end if;
  t := clock_timestamp();
  if c.started_at is null then raise exception '아직 시작하지 않았습니다.'; end if;
  if t >= c.ends_at then raise exception '제출 시간이 종료되었습니다.'; end if;
  select item into problem from jsonb_array_elements(c.problem_snapshots) item where item->>'id' = p_problem;
  if problem is null then raise exception '이 챌린지의 문항이 아닙니다.'; end if;
  if p_code is null or length(btrim(p_code)) = 0 or length(p_code) > 20000 then raise exception '제출 코드 길이를 확인해주세요.'; end if;
  -- Recover interrupted serverless requests and bound concurrent judging per participant.
  update public.challenge_submissions set status = 'runtime_error', feedback = '채점 연결이 중단되었습니다. 다시 제출해주세요.', judged_at = t
    where participant_id = p_participant and status = 'pending' and received_at < t - interval '45 seconds';
  if exists(select 1 from public.challenge_submissions where participant_id = p_participant and status = 'pending') then raise exception '이전 제출을 채점 중입니다. 잠시 후 다시 제출해주세요.'; end if;
  insert into public.challenge_submissions(request_id, challenge_id, participant_id, problem_id, code, received_at)
    values(p_request, p_challenge, p_participant, p_problem, p_code, t) returning * into s;
  return jsonb_build_object('fresh', true, 'submission', to_jsonb(s), 'problem', problem);
end;
$$;
revoke all on function public.challenge_control(uuid,text,integer) from public, anon, authenticated;
revoke all on function public.challenge_receive_submission(uuid,uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.challenge_control(uuid,text,integer) to service_role;
grant execute on function public.challenge_receive_submission(uuid,uuid,text,text,uuid) to service_role;
