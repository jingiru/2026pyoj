begin;

update public.problems
set title = '리스트의 각 값에 n 더하기',
    statement = '정수 n을 입력받으세요. 리스트 a = [1, 2, 3, 4, 5, 6, 7, 8, 9]의 값을 for 반복문으로 하나씩 꺼내고, 각 값에 n을 더한 결과를 한 줄에 하나씩 출력하세요. + 연산자를 사용하세요.',
    input_description = '정수 n이 한 줄에 주어집니다.',
    output_description = '1+n부터 9+n까지의 값을 순서대로 한 줄에 하나씩, 총 9줄 출력합니다.',
    starter_code = E'n = \na = [1, 2, 3, 4, 5, 6, 7, 8, 9]\nfor i in a:',
    hint = '',
    code_requirements = '[{"type":"for_list"},{"type":"operators","values":["+"]}]'::jsonb
where id = '평가5-1-08 1부터 n까지 합';

update public.test_cases as tc
set expected_output = (
    select string_agg((i + tc.input::integer)::text, E'\n' order by i)
    from generate_series(1, 9) as numbers(i)
)
where problem_id = '평가5-1-08 1부터 n까지 합';

commit;

