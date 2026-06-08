create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text not null check (student_no ~ '^[0-9]{4}$'),
  name text not null check (char_length(trim(name)) >= 2),
  created_at timestamptz not null default now(),
  unique (student_no, name)
);

create table if not exists public.problems (
  id text primary key,
  title text not null,
  unit text not null,
  level text not null check (level in ('start', 'practice', 'challenge')),
  statement text not null,
  input_description text not null,
  output_description text not null,
  starter_code text not null default '',
  hint text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references public.problems(id) on delete cascade,
  input text not null default '',
  output text not null,
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  problem_id text not null,
  code text not null,
  status text not null check (status in ('accepted', 'wrong_answer', 'runtime_error')),
  passed_count integer not null default 0,
  total_count integer not null default 0,
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists submissions_student_idx on public.submissions(student_id);
create index if not exists submissions_problem_idx on public.submissions(problem_id);
create index if not exists submissions_created_at_idx on public.submissions(created_at desc);

alter table public.students enable row level security;
alter table public.problems enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "students can self register" on public.students;
create policy "students can self register"
on public.students for insert
to anon
with check (true);

drop policy if exists "students can find own login" on public.students;
create policy "students can find own login"
on public.students for select
to anon
using (true);

drop policy if exists "public can read problems" on public.problems;
create policy "public can read problems"
on public.problems for select
to anon
using (true);

drop policy if exists "public can read test cases" on public.test_cases;
create policy "public can read test cases"
on public.test_cases for select
to anon
using (true);

drop policy if exists "students can create submissions" on public.submissions;
create policy "students can create submissions"
on public.submissions for insert
to anon
with check (true);

drop policy if exists "class dashboard can read submissions" on public.submissions;
create policy "class dashboard can read submissions"
on public.submissions for select
to anon
using (true);

insert into public.problems (
  id,
  title,
  unit,
  level,
  statement,
  input_description,
  output_description,
  starter_code,
  hint,
  sort_order
) values
  (
    'print-int-01',
    '정수 출력 01',
    '출력',
    'start',
    '1을 출력하세요.',
    '입력은 없습니다.',
    '1을 출력합니다.',
    'print(1)',
    'print() 안에 출력하고 싶은 값을 넣으면 됩니다.',
    1
  ),
  (
    'repeat-char-02',
    '변수와 입력 02',
    '입력과 변수',
    'practice',
    '사용자로부터 어떤 문자를 입력 받아 10번 반복하여 출력하는 프로그램을 작성하세요.',
    '1개의 문자가 주어집니다.',
    '문자를 10번 반복하여 출력합니다.',
    'ch = input()
print(ch * 10)',
    '문자열도 곱셈을 사용할 수 있어요. 예: ''a'' * 3',
    2
  )
on conflict (id) do nothing;

insert into public.test_cases (problem_id, input, output, is_sample, sort_order) values
  ('print-int-01', '', '1', true, 1),
  ('repeat-char-02', 'a', 'aaaaaaaaaa', true, 1),
  ('repeat-char-02', 'b', 'bbbbbbbbbb', false, 2),
  ('repeat-char-02', '1', '1111111111', false, 3),
  ('repeat-char-02', '*', '**********', false, 4),
  ('repeat-char-02', '가', '가가가가가가가가가가', false, 5),
  ('repeat-char-02', 'x', 'xxxxxxxxxx', false, 6)
on conflict do nothing;
