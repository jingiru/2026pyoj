-- Run once for existing projects before deploying guest access.
alter table public.students
drop constraint if exists students_student_no_check;

alter table public.students
add column if not exists is_guest boolean not null default false,
add column if not exists guest_token_hash text,
add column if not exists last_ip_hash text;

alter table public.students
add constraint students_student_no_check
check (
  (not is_guest and student_no ~ '^[0-9]{4}$')
  or
  (is_guest and student_no ~ '^비로그인-[A-F0-9]{12}$')
);

create unique index if not exists students_guest_token_hash_uidx
on public.students(guest_token_hash)
where guest_token_hash is not null;

create index if not exists students_is_guest_idx on public.students(is_guest);

revoke select on public.students from anon, authenticated;
