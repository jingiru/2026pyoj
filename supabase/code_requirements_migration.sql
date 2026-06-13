-- Adds AST-based solution requirements to problems where a specific Python
-- construct is part of the learning objective.

begin;

alter table public.problems
add column if not exists code_requirements jsonb not null default '[]'::jsonb;

update public.problems
set code_requirements = '[]'::jsonb;

-- 02-1: print values as separate arguments.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'print_arguments',
    'minCount',
    case sort_order
      when 101 then 3 when 102 then 4 when 103 then 3 when 104 then 5
      when 105 then 3 when 106 then 3 when 107 then 2 when 108 then 5
      when 109 then 6 when 110 then 3
    end
  )
)
where book_id = '02 출력 함수 응용'
  and sort_order between 101 and 110;

-- 02-3: calculate with the operators shown in the problem.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'operators',
    'values',
    case sort_order
      when 301 then '["+"]'::jsonb
      when 302 then '["-"]'::jsonb
      when 303 then '["*"]'::jsonb
      when 304 then '["/"]'::jsonb
      when 305 then '["+","*"]'::jsonb
      when 306 then '["-","*"]'::jsonb
      when 307 then '["+","-","*"]'::jsonb
      when 308 then '["+","-","*","/"]'::jsonb
      when 309 then '["+","-","*"]'::jsonb
      when 310 then '["+","-","*","/"]'::jsonb
    end
  )
)
where book_id = '02 출력 함수 응용'
  and sort_order between 301 and 310;

-- 02-4: string concatenation and repetition.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'operators',
    'values',
    case
      when sort_order between 401 and 403 then '["+"]'::jsonb
      when sort_order between 404 and 406 then '["*"]'::jsonb
      else '["+","*"]'::jsonb
    end
  )
)
where book_id = '02 출력 함수 응용'
  and sort_order between 401 and 410;

-- 03-1 and 03-2: values must flow through variables to print().
update public.problems
set code_requirements =
  jsonb_build_array(jsonb_build_object('type', 'assigned_output')) ||
  case sort_order
    when 107 then '[{"type":"operators","values":["*"]}]'::jsonb
    when 108 then '[{"type":"operators","values":["*"]}]'::jsonb
    when 109 then '[{"type":"operators","values":["+"]}]'::jsonb
    when 110 then '[{"type":"operators","values":["+","*"]}]'::jsonb
    when 201 then '[{"type":"operators","values":["+"]}]'::jsonb
    when 202 then '[{"type":"operators","values":["-"]}]'::jsonb
    when 203 then '[{"type":"operators","values":["*"]}]'::jsonb
    when 204 then '[{"type":"operators","values":["+"]}]'::jsonb
    when 205 then '[{"type":"operators","values":["*"]}]'::jsonb
    when 206 then '[{"type":"operators","values":["+","*"]}]'::jsonb
    when 207 then '[{"type":"operators","values":["+","*"]}]'::jsonb
    when 208 then '[{"type":"operators","values":["+","*"]}]'::jsonb
    when 209 then '[{"type":"operators","values":["+"]}]'::jsonb
    when 210 then '[{"type":"operators","values":["+","*"]}]'::jsonb
    else '[]'::jsonb
  end
where book_id = '03 변수와 입력 기초'
  and sort_order between 101 and 210;

-- 04-1-04 through 04-1-10: preserve the requested sequential variable flow.
update public.problems
set code_requirements =
  jsonb_build_array(
    jsonb_build_object(
      'type',
      case when sort_order in (104, 105, 106, 107, 109, 110)
        then 'reassignment'
        else 'assigned_output'
      end
    )
  ) ||
  jsonb_build_array(
    jsonb_build_object(
      'type', 'operators',
      'values',
      case sort_order
        when 104 then '["+"]'::jsonb
        when 105 then '["+"]'::jsonb
        when 106 then '["+"]'::jsonb
        when 107 then '["+","*"]'::jsonb
        when 108 then '["+","*"]'::jsonb
        when 109 then '["+"]'::jsonb
        when 110 then '["+","-","*"]'::jsonb
      end
    )
  )
where book_id = '04 순차 구조'
  and sort_order between 104 and 110;

-- 05 selection problems intentionally have no syntax requirements.

-- 06: output must be produced inside for ... in range(...).
update public.problems
set code_requirements = '[{"type":"for_range"}]'::jsonb
where book_id = '06 반복 구조';

-- 07: list indexing. The actual index value is intentionally unrestricted.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'indexing',
    'minCount',
    case
      when sort_order between 101 and 110 then 1
      when sort_order between 201 and 205 then 2
      when sort_order between 206 and 208 then 3
      else 4
    end
  )
)
where book_id = '07 리스트 인덱싱';

-- 08: string indexing. Positive and negative indexes are both accepted.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'indexing',
    'minCount',
    case
      when sort_order between 101 and 110 then 1
      when sort_order between 201 and 208 then 3
      when sort_order = 209 then 4
      else 5
    end
  )
)
where book_id = '08 문자열 인덱싱';

-- 09: require slices that contribute to printed output.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'slicing',
    'minCount',
    case sort_order
      when 101 then 1 when 102 then 1 when 103 then 1 when 104 then 1 when 105 then 1
      when 106 then 2 when 107 then 3 when 108 then 3 when 109 then 3 when 110 then 4
      when 201 then 1 when 202 then 1 when 203 then 1 when 204 then 2 when 205 then 2
      when 206 then 1 when 207 then 2 when 208 then 2 when 209 then 3 when 210 then 3
    end
  )
)
where book_id = '09 슬라이싱';

-- 10-1: list statistics functions.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'functions',
    'names',
    case sort_order
      when 101 then '["sum"]'::jsonb when 102 then '["max"]'::jsonb
      when 103 then '["min"]'::jsonb when 104 then '["len"]'::jsonb
      when 105 then '["sum"]'::jsonb when 106 then '["max"]'::jsonb
      when 107 then '["min"]'::jsonb when 108 then '["len"]'::jsonb
      when 109 then '["sum","max","min"]'::jsonb
      when 110 then '["len"]'::jsonb
    end
  )
)
where book_id = '10 리스트 데이터 분석'
  and sort_order between 101 and 110;

-- 10-2: combined statistics, operators, and input-driven slices.
update public.problems
set code_requirements =
  case sort_order
    when 201 then '[{"type":"functions","names":["sum","len"]},{"type":"operators","values":["/"]}]'::jsonb
    when 202 then '[{"type":"functions","names":["sum","len"]},{"type":"operators","values":["/"]}]'::jsonb
    when 203 then '[{"type":"functions","names":["sum","len"]},{"type":"operators","values":["/"]}]'::jsonb
    when 204 then '[{"type":"functions","names":["max","min"]},{"type":"operators","values":["+"]}]'::jsonb
    when 205 then '[{"type":"functions","names":["max","min"]},{"type":"operators","values":["-"]}]'::jsonb
    when 206 then '[{"type":"functions","names":["max","min"]},{"type":"operators","values":["*"]}]'::jsonb
    when 207 then '[{"type":"functions","names":["max","min","sum"]}]'::jsonb
    else '[{"type":"slicing","minCount":1},{"type":"functions","names":["sum","len"]},{"type":"operators","values":["/"]}]'::jsonb
  end
where book_id = '10 리스트 데이터 분석'
  and sort_order between 201 and 210;

-- 10-3: string len/min/max.
update public.problems
set code_requirements = jsonb_build_array(
  jsonb_build_object(
    'type', 'functions',
    'names',
    case
      when sort_order between 301 and 303 then '["len"]'::jsonb
      when sort_order between 304 and 306 then '["min"]'::jsonb
      when sort_order between 307 and 309 then '["max"]'::jsonb
      else '["len","min","max"]'::jsonb
    end
  )
)
where book_id = '10 리스트 데이터 분석'
  and sort_order between 301 and 310;

-- 10-4: sorted(), plus reverse=True for descending problems.
update public.problems
set code_requirements =
  '[{"type":"functions","names":["sorted"]}]'::jsonb ||
  case when sort_order in (404, 405, 408)
    then '[{"type":"sorted_reverse"}]'::jsonb
    else '[]'::jsonb
  end
where book_id = '10 리스트 데이터 분석'
  and sort_order between 401 and 410;

commit;
