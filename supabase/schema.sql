create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text not null,
  name text not null check (char_length(trim(name)) >= 2),
  is_guest boolean not null default false,
  guest_token text,
  last_ip text,
  created_at timestamptz not null default now(),
  constraint students_student_no_check check (
    (not is_guest and student_no ~ '^[0-9]{4}$')
    or
    (is_guest and student_no ~ '^비로그인-[A-F0-9]{12}$')
  ),
  unique (student_no, name)
);

create unique index if not exists students_guest_token_uidx
on public.students(guest_token)
where guest_token is not null;
create index if not exists students_is_guest_idx on public.students(is_guest);

create table if not exists public.problem_books (
  id text primary key,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problems (
  id text primary key,
  book_id text not null references public.problem_books(id),
  title text not null,
  statement text not null,
  input_description text not null,
  output_description text not null,
  starter_code text not null default '',
  hint text not null default '',
  code_requirements jsonb not null default '[]'::jsonb,
  time_limit_ms integer not null default 2000,
  memory_limit_mb integer not null default 128,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references public.problems(id) on delete cascade,
  input text not null default '',
  expected_output text not null,
  is_sample boolean not null default false,
  score numeric not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reference_solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references public.problems(id) on delete cascade,
  language text not null default 'python' check (language = 'python'),
  code text not null,
  explanation text not null default '',
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reference_solutions_problem_id_uidx
on public.reference_solutions(problem_id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  problem_id text not null,
  code text not null,
  status text not null check (
    status in ('accepted', 'wrong_answer', 'runtime_error', 'code_requirement_failed')
  ),
  passed_count integer not null default 0,
  total_count integer not null default 0,
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists submissions_student_idx on public.submissions(student_id);
create index if not exists submissions_problem_idx on public.submissions(problem_id);
create index if not exists submissions_created_at_idx on public.submissions(created_at desc);

grant usage on schema public to anon, authenticated;
revoke select on public.students from anon, authenticated;
grant insert on public.students to anon, authenticated;
grant select on public.problem_books, public.problems, public.test_cases to anon, authenticated;
revoke select on public.submissions from anon, authenticated;
grant insert on public.submissions to anon, authenticated;

alter table public.students enable row level security;
alter table public.problem_books enable row level security;
alter table public.problems enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "students can self register" on public.students;
create policy "students can self register"
on public.students for insert
to anon, authenticated
with check (true);

drop policy if exists "students can find own login" on public.students;
create policy "students can find own login"
on public.students for select
to anon, authenticated
using (true);

drop policy if exists "public can read problems" on public.problems;
create policy "public can read problems"
on public.problems for select
to anon, authenticated
using (true);

drop policy if exists "public can read test cases" on public.test_cases;
create policy "public can read test cases"
on public.test_cases for select
to anon, authenticated
using (true);

drop policy if exists "students can create submissions" on public.submissions;
create policy "students can create submissions"
on public.submissions for insert
to anon, authenticated
with check (true);

drop policy if exists "class dashboard can read submissions" on public.submissions;

insert into public.problem_books (id, title, sort_order, is_published) values
  ('01 출력 함수 기초', '출력 함수 기초', 1, true),
  ('03 변수와 입력 기초', '변수와 입력 기초', 3, true)
on conflict (id) do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

insert into public.problems (
  id, book_id, title, statement, input_description, output_description,
  starter_code, hint, sort_order
) values
  (
    '1-1-01 정수 출력 (1 출력)', '01 출력 함수 기초', '정수 출력 01', '1을 출력하세요.',
    '입력은 없습니다.', '1을 출력합니다.', 'print(1)',
    'print() 안에 출력하고 싶은 값을 넣으면 됩니다.', 1
  ),
  (
    '3-1-02 변수와 입력', '03 변수와 입력 기초', '변수와 입력 02',
    '사용자로부터 어떤 문자를 입력 받아 10번 반복하여 출력하는 프로그램을 작성하세요.',
    '1개의 문자가 주어집니다.', '문자를 10번 반복하여 출력합니다.',
    'ch = input()\nprint(ch * 10)',
    '문자열도 곱셈을 사용할 수 있어요. 예: ''a'' * 3', 2
  )
on conflict (id) do update set
  book_id = excluded.book_id,
  title = excluded.title,
  statement = excluded.statement,
  input_description = excluded.input_description,
  output_description = excluded.output_description,
  starter_code = excluded.starter_code,
  hint = excluded.hint,
  sort_order = excluded.sort_order;

insert into public.test_cases (problem_id, input, expected_output, is_sample, sort_order)
select values_to_insert.*
from (
  values
    ('1-1-01 정수 출력 (1 출력)', '', '1', true, 1),
    ('3-1-02 변수와 입력', 'a', 'aaaaaaaaaa', true, 1),
    ('3-1-02 변수와 입력', 'b', 'bbbbbbbbbb', false, 2)
) as values_to_insert(problem_id, input, expected_output, is_sample, sort_order)
where not exists (
  select 1
  from public.test_cases existing
  where existing.problem_id = values_to_insert.problem_id
    and existing.input = values_to_insert.input
    and existing.expected_output = values_to_insert.expected_output
);
drop policy if exists "public can read problem books" on public.problem_books;
create policy "public can read problem books"
on public.problem_books for select
to anon, authenticated
using (is_published = true);
