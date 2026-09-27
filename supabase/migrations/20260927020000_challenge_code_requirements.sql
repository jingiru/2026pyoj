alter table public.challenges
  add column allow_requirement_failure boolean not null default false,
  add column show_code_requirement_status boolean not null default false,
  add constraint challenge_requirement_display_dependency
    check (not show_code_requirement_status or allow_requirement_failure);

alter table public.challenge_submissions
  add column requirement_passed boolean,
  add column requirement_feedback text not null default '';
