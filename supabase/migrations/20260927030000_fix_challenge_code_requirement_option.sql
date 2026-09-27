-- Compatibility migration for databases where the earlier draft migration was applied.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'enforce_code_requirements'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'allow_requirement_failure'
  ) then
    alter table public.challenges rename column enforce_code_requirements to allow_requirement_failure;
  end if;
end $$;

alter table public.challenges drop constraint if exists challenge_requirement_display_dependency;
alter table public.challenges add constraint challenge_requirement_display_dependency
  check (not show_code_requirement_status or allow_requirement_failure);
