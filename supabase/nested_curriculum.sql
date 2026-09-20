begin;
insert into problem_books (id, title, description, sort_order, is_published) values ('11 중첩 구조 기초', '중첩 구조 기초', '반복문 안에서 조건문을 사용하는 기초 문제입니다.', 11, true) on conflict (id) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order, is_published = excluded.is_published;
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-01 숫자 5 찾기', '11 중첩 구조 기초', 'for-if 중첩 01', '1부터 10까지 차례대로 확인하세요. 숫자가 5이면 ''찾았다''를 출력하세요.', '입력은 없습니다.', '찾았다를 출력합니다.', 'for i in range(1, 11):
    # 여기에 코드를 작성하세요.', 'for문 안에서 i가 5와 같은지 if문으로 확인하세요.', 101, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-01 숫자 5 찾기';
delete from reference_solutions where problem_id = '11-1-01 숫자 5 찾기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-01 숫자 5 찾기', '', '찾았다', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-01 숫자 5 찾기', 'for i in range(1, 11):
    if i == 5:
        print(''찾았다'')', 'for문 안에서 i가 5와 같은지 if문으로 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-02 숫자 10 출력하기', '11 중첩 구조 기초', 'for-if 중첩 02', '1부터 10까지 차례대로 확인하세요. 숫자가 10이면 그 숫자를 출력하세요.', '입력은 없습니다.', '10을 출력합니다.', 'for i in range(1, 11):
    # 여기에 코드를 작성하세요.', 'i가 10일 때 print(i)를 실행하세요.', 102, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-02 숫자 10 출력하기';
delete from reference_solutions where problem_id = '11-1-02 숫자 10 출력하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-02 숫자 10 출력하기', '', '10', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-02 숫자 10 출력하기', 'for i in range(1, 11):
    if i == 10:
        print(i)', 'i가 10일 때 print(i)를 실행하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-03 숫자 7에서 인사하기', '11 중첩 구조 기초', 'for-if 중첩 03', '1부터 10까지 차례대로 확인하세요. 숫자가 7이면 ''안녕''을 출력하세요.', '입력은 없습니다.', '안녕을 출력합니다.', 'for i in range(1, 11):
    # 여기에 코드를 작성하세요.', 'i == 7인 경우에만 출력하면 됩니다.', 103, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-03 숫자 7에서 인사하기';
delete from reference_solutions where problem_id = '11-1-03 숫자 7에서 인사하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-03 숫자 7에서 인사하기', '', '안녕', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-03 숫자 7에서 인사하기', 'for i in range(1, 11):
    if i == 7:
        print(''안녕'')', 'i == 7인 경우에만 출력하면 됩니다.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-04 입력한 숫자 찾기', '11 중첩 구조 기초', 'for-if 중첩 04', '1부터 10까지 차례대로 확인하세요. 입력한 숫자와 같은 숫자를 만나면 그 숫자를 출력하세요.', '1부터 10 사이의 정수 하나가 주어집니다.', '입력한 숫자를 출력합니다.', 'n = int(input())

for i in range(1, 11):
    # 여기에 코드를 작성하세요.', 'i와 n이 같은지 확인하세요.', 104, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-04 입력한 숫자 찾기';
delete from reference_solutions where problem_id = '11-1-04 입력한 숫자 찾기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-04 입력한 숫자 찾기', '3', '3', true, 1);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-04 입력한 숫자 찾기', '8', '8', false, 2);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-04 입력한 숫자 찾기', '10', '10', false, 3);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-04 입력한 숫자 찾기', 'n = int(input())

for i in range(1, 11):
    if i == n:
        print(i)', 'i와 n이 같은지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-05 파랑 찾기', '11 중첩 구조 기초', 'for-if 중첩 05', '색깔 목록을 차례대로 확인하세요. ''파랑''을 만나면 ''파랑 찾음''을 출력하세요.', '입력은 없습니다.', '파랑 찾음을 출력합니다.', 'colors = [''빨강'', ''파랑'', ''노랑'']

for color in colors:
    # 여기에 코드를 작성하세요.', 'color가 ''파랑''과 같은지 확인하세요.', 105, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-05 파랑 찾기';
delete from reference_solutions where problem_id = '11-1-05 파랑 찾기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-05 파랑 찾기', '', '파랑 찾음', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-05 파랑 찾기', 'colors = [''빨강'', ''파랑'', ''노랑'']

for color in colors:
    if color == ''파랑'':
        print(''파랑 찾음'')', 'color가 ''파랑''과 같은지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-06 7보다 큰 수', '11 중첩 구조 기초', 'for-if 중첩 06', '1부터 10까지 차례대로 확인하여 7보다 큰 숫자를 한 줄에 하나씩 출력하세요.', '입력은 없습니다.', '8, 9, 10을 한 줄에 하나씩 출력합니다.', 'for i in range(1, 11):
    # 여기에 코드를 작성하세요.', 'i > 7인 경우에 i를 출력하세요.', 106, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-06 7보다 큰 수';
delete from reference_solutions where problem_id = '11-1-06 7보다 큰 수';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-06 7보다 큰 수', '', '8
9
10', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-06 7보다 큰 수', 'for i in range(1, 11):
    if i > 7:
        print(i)', 'i > 7인 경우에 i를 출력하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-07 5 이상인 값', '11 중첩 구조 기초', 'for-if 중첩 07', '리스트 numbers의 값을 차례대로 확인하여 5 이상인 값만 한 줄에 하나씩 출력하세요.', '입력은 없습니다.', '5 이상인 값을 원래 순서대로 출력합니다.', 'numbers = [2, 7, 4, 9, 5]

for number in numbers:
    # 여기에 코드를 작성하세요.', 'number >= 5인 경우에 출력하세요.', 107, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-07 5 이상인 값';
delete from reference_solutions where problem_id = '11-1-07 5 이상인 값';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-07 5 이상인 값', '', '7
9
5', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-07 5 이상인 값', 'numbers = [2, 7, 4, 9, 5]

for number in numbers:
    if number >= 5:
        print(number)', 'number >= 5인 경우에 출력하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-08 3의 배수 출력하기', '11 중첩 구조 기초', 'for-if 중첩 08', '1부터 10까지 차례대로 확인하여 3으로 나누어떨어지는 숫자를 한 줄에 하나씩 출력하세요.', '입력은 없습니다.', '3, 6, 9를 한 줄에 하나씩 출력합니다.', 'for i in range(1, 11):
    # 여기에 코드를 작성하세요.', '나머지 연산자 %를 사용하여 i를 3으로 나눈 나머지가 0인지 확인하세요.', 108, true, '[{"type":"for_if"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-08 3의 배수 출력하기';
delete from reference_solutions where problem_id = '11-1-08 3의 배수 출력하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-08 3의 배수 출력하기', '', '3
6
9', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-08 3의 배수 출력하기', 'for i in range(1, 11):
    if i % 3 == 0:
        print(i)', '나머지 연산자 %를 사용하여 i를 3으로 나눈 나머지가 0인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-09 큰 수의 합', '11 중첩 구조 기초', 'for-if 중첩 09', '리스트 numbers에서 5보다 큰 값만 골라 모두 더한 결과를 출력하세요.', '입력은 없습니다.', '5보다 큰 값의 합을 출력합니다.', 'numbers = [3, 8, 2, 7, 9]
total = 0

for number in numbers:
    # 여기에 코드를 작성하세요.

print(total)', 'number > 5일 때 total = total + number를 실행하세요.', 109, true, '[{"type":"for_if"},{"type":"reassignment"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-09 큰 수의 합';
delete from reference_solutions where problem_id = '11-1-09 큰 수의 합';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-09 큰 수의 합', '', '24', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-09 큰 수의 합', 'numbers = [3, 8, 2, 7, 9]
total = 0

for number in numbers:
    if number > 5:
        total = total + number

print(total)', 'number > 5일 때 total = total + number를 실행하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-1-10 문자 a 개수 세기', '11 중첩 구조 기초', 'for-if 중첩 10', '문자열 ''banana''의 문자를 차례대로 확인하여 문자 ''a''의 개수를 출력하세요.', '입력은 없습니다.', '문자 a의 개수인 3을 출력합니다.', 'word = ''banana''
count = 0

for ch in word:
    # 여기에 코드를 작성하세요.

print(count)', 'ch가 ''a''일 때 count = count + 1을 실행하세요.', 110, true, '[{"type":"for_if"},{"type":"reassignment"},{"type":"forbidden_keywords","values":["while"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-1-10 문자 a 개수 세기';
delete from reference_solutions where problem_id = '11-1-10 문자 a 개수 세기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-1-10 문자 a 개수 세기', '', '3', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-1-10 문자 a 개수 세기', 'word = ''banana''
count = 0

for ch in word:
    if ch == ''a'':
        count = count + 1

print(count)', 'ch가 ''a''일 때 count = count + 1을 실행하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-01 5까지 세고 멈추기', '11 중첩 구조 기초', 'while-if 중첩 01', 'n을 0으로 시작하세요. 반복할 때마다 n에 1을 더해 다시 저장하세요. n이 5가 되면 5를 출력하고 반복을 끝내세요.', '입력은 없습니다.', '5를 출력합니다.', 'n = 0

while True:
    # 여기에 코드를 작성하세요.', 'n = n + 1을 먼저 실행하고, n == 5인지 확인하세요.', 201, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-01 5까지 세고 멈추기';
delete from reference_solutions where problem_id = '11-2-01 5까지 세고 멈추기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-01 5까지 세고 멈추기', '', '5', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-01 5까지 세고 멈추기', 'n = 0

while True:
    n = n + 1
    if n == 5:
        print(n)
        break', 'n = n + 1을 먼저 실행하고, n == 5인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-02 10에 도착하기', '11 중첩 구조 기초', 'while-if 중첩 02', 'count를 0으로 시작하세요. 반복할 때마다 count에 1을 더해 다시 저장하세요. count가 10이 되면 ''도착''을 출력하고 반복을 끝내세요.', '입력은 없습니다.', '도착을 출력합니다.', 'count = 0

while True:
    # 여기에 코드를 작성하세요.', 'count = count + 1 다음에 count == 10인지 확인하세요.', 202, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-02 10에 도착하기';
delete from reference_solutions where problem_id = '11-2-02 10에 도착하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-02 10에 도착하기', '', '도착', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-02 10에 도착하기', 'count = 0

while True:
    count = count + 1
    if count == 10:
        print(''도착'')
        break', 'count = count + 1 다음에 count == 10인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-03 5까지 내려가기', '11 중첩 구조 기초', 'while-if 중첩 03', 'n을 10으로 시작하세요. 반복할 때마다 n에서 1을 빼 다시 저장하세요. n이 5가 되면 5를 출력하고 반복을 끝내세요.', '입력은 없습니다.', '5를 출력합니다.', 'n = 10

while True:
    # 여기에 코드를 작성하세요.', 'n = n - 1을 먼저 실행하고, n == 5인지 확인하세요.', 203, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-03 5까지 내려가기';
delete from reference_solutions where problem_id = '11-2-03 5까지 내려가기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-03 5까지 내려가기', '', '5', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-03 5까지 내려가기', 'n = 10

while True:
    n = n - 1
    if n == 5:
        print(n)
        break', 'n = n - 1을 먼저 실행하고, n == 5인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-04 1부터 5까지 출력하기', '11 중첩 구조 기초', 'while-if 중첩 04', 'n을 1로 시작하여 1부터 5까지 한 줄에 하나씩 출력하세요. 5를 출력하면 반복을 끝내세요.', '입력은 없습니다.', '1부터 5까지 한 줄에 하나씩 출력합니다.', 'n = 1

while True:
    print(n)
    # 여기에 코드를 작성하세요.', 'n이 5이면 break하고, 그렇지 않으면 n = n + 1로 바꾸세요.', 204, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-04 1부터 5까지 출력하기';
delete from reference_solutions where problem_id = '11-2-04 1부터 5까지 출력하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-04 1부터 5까지 출력하기', '', '1
2
3
4
5', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-04 1부터 5까지 출력하기', 'n = 1

while True:
    print(n)
    if n == 5:
        break
    n = n + 1', 'n이 5이면 break하고, 그렇지 않으면 n = n + 1로 바꾸세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-05 입력한 수까지 세기', '11 중첩 구조 기초', 'while-if 중첩 05', '목표 숫자 target을 입력받으세요. count를 0부터 1씩 늘리다가 target과 같아지면 count를 출력하고 반복을 끝내세요.', '1부터 10 사이의 정수 target이 주어집니다.', 'target과 같은 숫자를 출력합니다.', 'target = int(input())
count = 0

while True:
    # 여기에 코드를 작성하세요.', 'count를 1 늘린 다음 target과 같은지 확인하세요.', 205, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-05 입력한 수까지 세기';
delete from reference_solutions where problem_id = '11-2-05 입력한 수까지 세기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-05 입력한 수까지 세기', '3', '3', true, 1);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-05 입력한 수까지 세기', '7', '7', false, 2);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-05 입력한 수까지 세기', '10', '10', false, 3);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-05 입력한 수까지 세기', 'target = int(input())
count = 0

while True:
    count = count + 1
    if count == target:
        print(count)
        break', 'count를 1 늘린 다음 target과 같은지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-06 그만 입력받기', '11 중첩 구조 기초', 'while-if 중첩 06', '문자열을 계속 입력받으세요. 입력한 문자열이 ''그만''이면 ''종료''를 출력하고 반복을 끝내세요.', '여러 줄에 문자열이 주어지며 마지막 줄은 그만입니다.', '그만을 입력받으면 종료를 출력합니다.', 'while True:
    word = input()
    # 여기에 코드를 작성하세요.', 'word == ''그만''인 경우에 출력한 뒤 break하세요.', 206, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-06 그만 입력받기';
delete from reference_solutions where problem_id = '11-2-06 그만 입력받기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-06 그만 입력받기', '안녕
그만', '종료', true, 1);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-06 그만 입력받기', '사과
바나나
그만', '종료', false, 2);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-06 그만 입력받기', 'while True:
    word = input()
    if word == ''그만'':
        print(''종료'')
        break', 'word == ''그만''인 경우에 출력한 뒤 break하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-07 1부터 5까지 더하기', '11 중첩 구조 기초', 'while-if 중첩 07', '1부터 5까지의 숫자를 total에 차례대로 더하세요. n이 5가 되면 합을 출력하고 반복을 끝내세요.', '입력은 없습니다.', '1부터 5까지의 합인 15를 출력합니다.', 'n = 0
total = 0

while True:
    # 여기에 코드를 작성하세요.', 'n을 1 늘리고 total에 n을 더한 뒤, n이 5인지 확인하세요.', 207, true, '[{"type":"while_true_if_break"},{"type":"reassignment"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-07 1부터 5까지 더하기';
delete from reference_solutions where problem_id = '11-2-07 1부터 5까지 더하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-07 1부터 5까지 더하기', '', '15', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-07 1부터 5까지 더하기', 'n = 0
total = 0

while True:
    n = n + 1
    total = total + n
    if n == 5:
        print(total)
        break', 'n을 1 늘리고 total에 n을 더한 뒤, n이 5인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-08 2씩 늘려 10 만들기', '11 중첩 구조 기초', 'while-if 중첩 08', 'n을 0으로 시작하세요. 반복할 때마다 n에 2를 더해 다시 저장하세요. n이 10이 되면 10을 출력하고 반복을 끝내세요.', '입력은 없습니다.', '10을 출력합니다.', 'n = 0

while True:
    # 여기에 코드를 작성하세요.', 'n = n + 2 다음에 n == 10인지 확인하세요.', 208, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-08 2씩 늘려 10 만들기';
delete from reference_solutions where problem_id = '11-2-08 2씩 늘려 10 만들기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-08 2씩 늘려 10 만들기', '', '10', true, 1);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-08 2씩 늘려 10 만들기', 'n = 0

while True:
    n = n + 2
    if n == 10:
        print(n)
        break', 'n = n + 2 다음에 n == 10인지 확인하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-09 0 전까지 더하기', '11 중첩 구조 기초', 'while-if 중첩 09', '정수를 계속 입력받아 total에 더하세요. 0을 입력받으면 지금까지의 합을 출력하고 반복을 끝내세요. 0은 합에 더하지 않습니다.', '여러 줄에 정수가 주어지며 마지막 정수는 0입니다.', '0보다 앞에 입력된 모든 정수의 합을 출력합니다.', 'total = 0

while True:
    number = int(input())
    # 여기에 코드를 작성하세요.', 'number가 0이면 합을 출력하고 break하세요. 그렇지 않으면 total에 더하세요.', 209, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-09 0 전까지 더하기';
delete from reference_solutions where problem_id = '11-2-09 0 전까지 더하기';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-09 0 전까지 더하기', '3
5
2
0', '10', true, 1);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-09 0 전까지 더하기', '10
20
0', '30', false, 2);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-09 0 전까지 더하기', '7
0', '7', false, 3);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-09 0 전까지 더하기', 'total = 0

while True:
    number = int(input())
    if number == 0:
        print(total)
        break
    total = total + number', 'number가 0이면 합을 출력하고 break하세요. 그렇지 않으면 total에 더하세요.');
insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values ('11-2-10 제곱이 목표 이상인 수', '11 중첩 구조 기초', 'while-if 중첩 10', '양의 정수 target을 입력받으세요. n을 0부터 1씩 늘리면서 n을 두 번 곱한 값이 target 이상이 되는 첫 번째 n을 출력하고 반복을 끝내세요.', '양의 정수 target이 주어집니다.', 'n × n이 target 이상이 되는 첫 번째 n을 출력합니다.', 'target = int(input())
n = 0

while True:
    # 여기에 코드를 작성하세요.', 'n을 1 늘린 뒤 n * n >= target인지 확인하세요.', 210, true, '[{"type":"while_true_if_break"},{"type":"forbidden_augmented_assignment"},{"type":"forbidden_keywords","values":["for"]}]'::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;
delete from test_cases where problem_id = '11-2-10 제곱이 목표 이상인 수';
delete from reference_solutions where problem_id = '11-2-10 제곱이 목표 이상인 수';
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-10 제곱이 목표 이상인 수', '10', '4', true, 1);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-10 제곱이 목표 이상인 수', '25', '5', false, 2);
insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values ('11-2-10 제곱이 목표 이상인 수', '50', '8', false, 3);
insert into reference_solutions (problem_id, code, explanation) values ('11-2-10 제곱이 목표 이상인 수', 'target = int(input())
n = 0

while True:
    n = n + 1
    if n * n >= target:
        print(n)
        break', 'n을 1 늘린 뒤 n * n >= target인지 확인하세요.');
commit;
