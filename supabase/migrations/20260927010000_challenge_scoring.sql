alter table public.challenges
  add column scoring jsonb not null default '{"mode":"problem_points"}'::jsonb,
  add column bonus_criteria jsonb not null default '[]'::jsonb;

alter table public.challenges add constraint challenges_scoring_object
  check (jsonb_typeof(scoring) = 'object');
alter table public.challenges add constraint challenges_bonus_criteria_array
  check (jsonb_typeof(bonus_criteria) = 'array');

create table public.challenge_bonus_scores (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  participant_id uuid not null,
  criterion_id text not null,
  score numeric not null check (score >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (challenge_id, participant_id, criterion_id),
  foreign key (challenge_id, participant_id) references public.challenge_participants(challenge_id, id) on delete cascade
);
alter table public.challenge_bonus_scores enable row level security;
revoke all on public.challenge_bonus_scores from public, anon, authenticated;
grant all on public.challenge_bonus_scores to service_role;
