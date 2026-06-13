-- Run once in the Supabase SQL Editor before using XLSX bulk import.
-- This removes unused problem columns, prepares reference solutions,
-- and migrates the legacy English problem-book IDs to the XLSX IDs.

begin;

-- Older schemas allowed only lowercase English slugs in these IDs.
-- The XLSX format intentionally uses Korean display IDs, so remove those checks.
alter table public.problem_books drop constraint if exists problem_books_id_check;
alter table public.problems drop constraint if exists problems_id_check;

alter table public.problems drop column if exists unit;
alter table public.problems drop column if exists level;

create table if not exists public.reference_solutions (
  problem_id text primary key references public.problems(id) on delete cascade,
  solution_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reference_solutions
  add column if not exists solution_code text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists reference_solutions_problem_id_uidx
on public.reference_solutions(problem_id);

-- Preserve any legacy "code" column contents when that column exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reference_solutions'
      and column_name = 'code'
  ) then
    execute '
      update public.reference_solutions
      set solution_code = code
      where solution_code = ''''
        and code is not null
    ';
  end if;
end
$$;

with book_mapping(old_id, new_id, new_title, new_order) as (
  values
    ('print-basic', '01 출력 함수 기초', '출력 함수 기초', 1),
    ('print-advanced', '02 출력 함수 응용', '출력 함수 응용', 2),
    ('input-basic', '03 변수와 입력 기초', '변수와 입력 기초', 3),
    ('sequence', '04 순차 구조', '순차 구조', 4),
    ('condition', '05 선택 구조', '선택 구조', 5),
    ('loop', '06 반복 구조', '반복 구조', 6),
    ('list-index', '07 리스트 인덱싱', '리스트 인덱싱', 7),
    ('string-index', '08 문자열 인덱싱', '문자열 인덱싱', 8),
    ('slicing', '09 슬라이싱', '슬라이싱', 9),
    ('list-analysis', '10 리스트 데이터 분석', '리스트 데이터 분석', 10)
)
insert into public.problem_books (
  id, title, description, sort_order, is_published, updated_at
)
select
  mapping.new_id,
  mapping.new_title,
  coalesce(existing.description, ''),
  mapping.new_order,
  coalesce(existing.is_published, true),
  now()
from book_mapping mapping
left join public.problem_books existing on existing.id = mapping.old_id
on conflict (id) do update set
  title = excluded.title,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();

with book_mapping(old_id, new_id) as (
  values
    ('print-basic', '01 출력 함수 기초'),
    ('print-advanced', '02 출력 함수 응용'),
    ('input-basic', '03 변수와 입력 기초'),
    ('sequence', '04 순차 구조'),
    ('condition', '05 선택 구조'),
    ('loop', '06 반복 구조'),
    ('list-index', '07 리스트 인덱싱'),
    ('string-index', '08 문자열 인덱싱'),
    ('slicing', '09 슬라이싱'),
    ('list-analysis', '10 리스트 데이터 분석')
)
update public.problems problem
set book_id = mapping.new_id,
    updated_at = now()
from book_mapping mapping
where problem.book_id = mapping.old_id;

delete from public.problem_books
where id in (
  'print-basic',
  'print-advanced',
  'input-basic',
  'sequence',
  'condition',
  'loop',
  'list-index',
  'string-index',
  'slicing',
  'list-analysis'
);

grant select on public.reference_solutions to authenticated;

commit;
