-- Seed the curriculum currently bundled in lib/problems.ts.
-- Safe to run repeatedly: books/problems are upserted and test cases are de-duplicated.

insert into public.problem_books (
  id, title, description, sort_order, is_published
) values
  ('print-basic', '출력 함수 기초', '', 1, true),
  ('print-advanced', '출력 함수 응용', '', 2, true),
  ('input-basic', '변수와 입력 기초', '', 3, true),
  ('sequence', '순차 구조', '', 4, true),
  ('condition', '선택 구조', '', 5, true),
  ('loop', '반복 구조', '', 6, true),
  ('list-index', '리스트 인덱싱', '', 7, true),
  ('string-index', '문자열 인덱싱', '', 8, true),
  ('slicing', '슬라이싱', '', 9, true),
  ('list-analysis', '리스트 데이터 분석', '', 10, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.problems (
  id, book_id, title, unit, level, statement,
  input_description, output_description, starter_code, hint,
  time_limit_ms, memory_limit_mb, sort_order, is_published
) values
  (
    'print-int-01', 'print-basic', '정수 출력 01', '출력', 'start',
    '1을 출력하세요.', '입력은 없습니다.', '1을 출력합니다.',
    'print(1)', 'print() 안에 출력하고 싶은 값을 넣으면 됩니다.',
    2000, 128, 1, true
  ),
  (
    'repeat-char-02', 'input-basic', '변수와 입력 02', '입력과 변수', 'practice',
    '사용자로부터 어떤 문자를 입력 받아 10번 반복하여 출력하는 프로그램을 작성하세요.',
    '1개의 문자가 주어집니다.', '문자를 10번 반복하여 출력합니다.',
    E'ch = input()\nprint(ch * 10)',
    '문자열도 곱셈을 사용할 수 있어요. 예: ''a'' * 3',
    2000, 128, 1, true
  ),
  (
    'sum-two-03', 'sequence', '덧셈 연습 03', '자료형', 'practice',
    '두 정수를 입력 받아 합을 출력하는 프로그램을 작성하세요.',
    '첫 줄에 정수 a, 둘째 줄에 정수 b가 주어집니다.',
    'a와 b의 합을 출력합니다.',
    E'a = int(input())\nb = int(input())\nprint(a + b)',
    'input()으로 받은 값은 문자라서 int()로 정수로 바꿔야 합니다.',
    2000, 128, 1, true
  ),
  (
    'even-odd-04', 'condition', '짝수 홀수 04', '조건문', 'challenge',
    '정수 하나를 입력 받아 짝수면 even, 홀수면 odd를 출력하세요.',
    '정수 1개가 주어집니다.', '짝수는 even, 홀수는 odd를 출력합니다.',
    E'n = int(input())\nif n % 2 == 0:\n    print(''even'')\nelse:\n    print(''odd'')',
    '% 연산자는 나머지를 구합니다.',
    2000, 128, 1, true
  )
on conflict (id) do update set
  book_id = excluded.book_id,
  title = excluded.title,
  unit = excluded.unit,
  level = excluded.level,
  statement = excluded.statement,
  input_description = excluded.input_description,
  output_description = excluded.output_description,
  starter_code = excluded.starter_code,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms,
  memory_limit_mb = excluded.memory_limit_mb,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();

with seed_cases(problem_id, input, expected_output, is_sample, score, sort_order) as (
  values
    ('print-int-01', '', '1', true, 1::numeric, 1),
    ('repeat-char-02', 'a', 'aaaaaaaaaa', true, 1::numeric, 1),
    ('repeat-char-02', 'b', 'bbbbbbbbbb', false, 1::numeric, 2),
    ('repeat-char-02', '1', '1111111111', false, 1::numeric, 3),
    ('repeat-char-02', '*', '**********', false, 1::numeric, 4),
    ('repeat-char-02', '가', '가가가가가가가가가가', false, 1::numeric, 5),
    ('repeat-char-02', 'x', 'xxxxxxxxxx', false, 1::numeric, 6),
    ('sum-two-03', E'2\n3', '5', true, 1::numeric, 1),
    ('sum-two-03', E'1\n4', '5', false, 1::numeric, 2),
    ('sum-two-03', E'10\n20', '30', false, 1::numeric, 3),
    ('sum-two-03', E'-3\n7', '4', false, 1::numeric, 4),
    ('sum-two-03', E'0\n0', '0', false, 1::numeric, 5),
    ('even-odd-04', '8', 'even', true, 1::numeric, 1),
    ('even-odd-04', '2', 'even', false, 1::numeric, 2),
    ('even-odd-04', '9', 'odd', false, 1::numeric, 3),
    ('even-odd-04', '0', 'even', false, 1::numeric, 4),
    ('even-odd-04', '-5', 'odd', false, 1::numeric, 5)
)
insert into public.test_cases (
  problem_id, input, expected_output, is_sample, score, sort_order
)
select
  seed.problem_id,
  seed.input,
  seed.expected_output,
  seed.is_sample,
  seed.score,
  seed.sort_order
from seed_cases seed
where not exists (
  select 1
  from public.test_cases existing
  where existing.problem_id = seed.problem_id
    and existing.sort_order = seed.sort_order
);
