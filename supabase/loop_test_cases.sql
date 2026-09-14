begin;
update problems set statement='리스트 a = [1, 2, 3]의 값을 for문으로 한 줄씩 출력하도록 프로그래밍하세요.', input_description='입력은 없습니다.', output_description='1
2
3', starter_code='a = [1, 2, 3]
for i in :
    print()', hint='for i in a를 사용하면 리스트의 값을 차례로 가져옵니다.' where id='6-2-01 반복 구조 기초(리스트 값 출력)';
delete from test_cases where problem_id='6-2-01 반복 구조 기초(리스트 값 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','','1
2
3',true,1);
update reference_solutions set code='a = [1, 2, 3]
for i in a:
    print(i)', explanation='for i in a를 사용하면 리스트의 값을 차례로 가져옵니다.' where problem_id='6-2-01 반복 구조 기초(리스트 값 출력)' and is_primary=true;
update problems set statement='리스트 a = [''apple'', ''banana'', ''cherry'']의 문자열을 for문으로 한 줄씩 출력하도록 프로그래밍하세요.', input_description='입력은 없습니다.', output_description='apple
banana
cherry', starter_code='a = [''apple'', ''banana'', ''cherry'']
for i in :
    print()', hint='문자열이 들어 있는 리스트도 for문으로 반복할 수 있습니다.' where id='6-2-02 반복 구조 기초(리스트 문자열 출력)';
delete from test_cases where problem_id='6-2-02 반복 구조 기초(리스트 문자열 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','','apple
banana
cherry',true,1);
update reference_solutions set code='a = [''apple'', ''banana'', ''cherry'']
for i in a:
    print(i)', explanation='문자열이 들어 있는 리스트도 for문으로 반복할 수 있습니다.' where problem_id='6-2-02 반복 구조 기초(리스트 문자열 출력)' and is_primary=true;
update problems set statement='리스트 a = [2, 4, 6, 8, 10]의 각 값을 for문으로 가져와 2배한 값을 한 줄씩 출력하도록 프로그래밍하세요.', input_description='입력은 없습니다.', output_description='4
8
12
16
20', starter_code='a = [2, 4, 6, 8, 10]
for i in :
    print()', hint='리스트에서 가져온 값에 2를 곱해 출력합니다.' where id='6-2-03 반복 구조 기초(리스트 값 두 배)';
delete from test_cases where problem_id='6-2-03 반복 구조 기초(리스트 값 두 배)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','','4
8
12
16
20',true,1);
update reference_solutions set code='a = [2, 4, 6, 8, 10]
for i in a:
    print(i * 2)', explanation='리스트에서 가져온 값에 2를 곱해 출력합니다.' where problem_id='6-2-03 반복 구조 기초(리스트 값 두 배)' and is_primary=true;
update problems set statement='리스트 a = [10, 20, 30]의 값을 for문과 range(3), a[i]를 사용하여 한 줄씩 출력하도록 프로그래밍하세요.', input_description='입력은 없습니다.', output_description='10
20
30', starter_code='a = [10, 20, 30]
for i in range():
    print()', hint='range(3)은 인덱스 0, 1, 2를 만듭니다.' where id='6-2-04 반복 구조 기초(리스트 인덱스 순회)';
delete from test_cases where problem_id='6-2-04 반복 구조 기초(리스트 인덱스 순회)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','','10
20
30',true,1);
update reference_solutions set code='a = [10, 20, 30]
for i in range(3):
    print(a[i])', explanation='range(3)은 인덱스 0, 1, 2를 만듭니다.' where problem_id='6-2-04 반복 구조 기초(리스트 인덱스 순회)' and is_primary=true;
update problems set statement='리스트 a = [10, 20, 30, 40, 50]의 값을 for문과 range(), a[i]를 사용하여 마지막 값부터 한 줄씩 출력하도록 프로그래밍하세요.', input_description='입력은 없습니다.', output_description='50
40
30
20
10', starter_code='a = [10, 20, 30, 40, 50]
for i in range():
    print()', hint='인덱스를 4부터 0까지 1씩 감소시킵니다.' where id='6-2-05 반복 구조 기초(리스트 역순 출력)';
delete from test_cases where problem_id='6-2-05 반복 구조 기초(리스트 역순 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','','50
40
30
20
10',true,1);
update reference_solutions set code='a = [10, 20, 30, 40, 50]
for i in range(4, -1, -1):
    print(a[i])', explanation='인덱스를 4부터 0까지 1씩 감소시킵니다.' where problem_id='6-2-05 반복 구조 기초(리스트 역순 출력)' and is_primary=true;
update problems set statement='while문을 사용하여 1부터 5까지 1씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='입력은 없습니다.', output_description='1
2
3
4
5', starter_code='n = 1
while :
    print()
    n = ', hint='반복할 때마다 n을 1씩 증가시키고, n이 5 이하일 때 반복합니다.' where id='6-2-06 반복 구조 기초(while 증가)';
delete from test_cases where problem_id='6-2-06 반복 구조 기초(while 증가)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','','1
2
3
4
5',true,1);
update reference_solutions set code='n = 1
while n <= 5:
    print(n)
    n = n + 1', explanation='반복할 때마다 n을 1씩 증가시키고, n이 5 이하일 때 반복합니다.' where problem_id='6-2-06 반복 구조 기초(while 증가)' and is_primary=true;
update problems set statement='n = 5에서 시작하여 while문으로 n이 3 이상인 동안 n을 출력하고 1씩 감소시키도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='입력은 없습니다.', output_description='5
4
3', starter_code='n = 5
while :
    print()
    n = ', hint='현재 값을 출력한 뒤 n을 1씩 감소시킵니다.' where id='6-2-07 반복 구조 기초(while 감소)';
delete from test_cases where problem_id='6-2-07 반복 구조 기초(while 감소)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','','5
4
3',true,1);
update reference_solutions set code='n = 5
while n >= 3:
    print(n)
    n = n - 1', explanation='현재 값을 출력한 뒤 n을 1씩 감소시킵니다.' where problem_id='6-2-07 반복 구조 기초(while 감소)' and is_primary=true;
update problems set statement='a = 10에서 시작하여 while문으로 a가 3보다 큰 동안 a를 1씩 감소시키고, 반복이 끝난 뒤 a를 한 번만 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='입력은 없습니다.', output_description='3', starter_code='a = 10
while :
    a = 
print()', hint='print(a)는 while문 바깥에 작성합니다. 반복이 끝나는 순간의 조건을 생각해보세요.' where id='6-2-08 반복 구조 기초(while 종료 후 값)';
delete from test_cases where problem_id='6-2-08 반복 구조 기초(while 종료 후 값)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','','3',true,1);
update reference_solutions set code='a = 10
while a > 3:
    a = a - 1
print(a)', explanation='print(a)는 while문 바깥에 작성합니다. 반복이 끝나는 순간의 조건을 생각해보세요.' where problem_id='6-2-08 반복 구조 기초(while 종료 후 값)' and is_primary=true;
update problems set statement='while문을 사용하여 2부터 10까지 2씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='입력은 없습니다.', output_description='2
4
6
8
10', starter_code='n = 2
while :
    print()
    n = ', hint='반복할 때마다 n에 2를 더합니다.' where id='6-2-09 반복 구조 기초(while 두 칸씩 증가)';
delete from test_cases where problem_id='6-2-09 반복 구조 기초(while 두 칸씩 증가)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','','2
4
6
8
10',true,1);
update reference_solutions set code='n = 2
while n <= 10:
    print(n)
    n = n + 2', explanation='반복할 때마다 n에 2를 더합니다.' where problem_id='6-2-09 반복 구조 기초(while 두 칸씩 증가)' and is_primary=true;
update problems set statement='정수 n을 입력받고, while문을 사용하여 n부터 1까지 1씩 감소하면서 한 줄씩 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='정수 n(1 이상 20 이하)이 주어집니다.', output_description='입력받은 n부터 1까지 한 줄씩 출력합니다.', starter_code='n = int(input())
while :
    print()
    n = ', hint='n이 1 이상인 동안 출력하고, n을 1씩 감소시킵니다.' where id='6-2-10 반복 구조 기초(while 입력 카운트다운)';
delete from test_cases where problem_id='6-2-10 반복 구조 기초(while 입력 카운트다운)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-10 반복 구조 기초(while 입력 카운트다운)','1','1',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-10 반복 구조 기초(while 입력 카운트다운)','5','5
4
3
2
1',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-10 반복 구조 기초(while 입력 카운트다운)','2','2
1',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-10 반복 구조 기초(while 입력 카운트다운)','10','10
9
8
7
6
5
4
3
2
1',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-10 반복 구조 기초(while 입력 카운트다운)','20','20
19
18
17
16
15
14
13
12
11
10
9
8
7
6
5
4
3
2
1',false,5);
update reference_solutions set code='n = int(input())
while n >= 1:
    print(n)
    n = n - 1', explanation='n이 1 이상인 동안 출력하고, n을 1씩 감소시킵니다.' where problem_id='6-2-10 반복 구조 기초(while 입력 카운트다운)' and is_primary=true;
commit;