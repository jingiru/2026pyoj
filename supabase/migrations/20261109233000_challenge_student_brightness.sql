alter table public.challenges
  add column student_brightness_limit integer not null default 100
  check (student_brightness_limit between 20 and 100);
