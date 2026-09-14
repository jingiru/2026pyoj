begin;
update problems set statement='정수 3개를 입력받아 리스트 a에 저장하세요. for문으로 리스트의 값을 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.', input_description='정수 3개(-100 이상 100 이하)가 한 줄에 하나씩 주어집니다.', output_description='리스트의 값을 입력 순서대로 한 줄씩 출력합니다.', starter_code='a = [int(input()), int(input()), int(input())]
for i in :
    print()', hint='for i in a를 사용하면 리스트의 값을 차례로 가져옵니다.' where id='6-2-01 반복 구조 기초(리스트 값 출력)';
delete from test_cases where problem_id='6-2-01 반복 구조 기초(리스트 값 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','1
2
3','1
2
3',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','0
0
0','0
0
0',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','-3
-2
-1','-3
-2
-1',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','10
20
30','10
20
30',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-01 반복 구조 기초(리스트 값 출력)','5
-5
0','5
-5
0',false,5);
update reference_solutions set code='a = [int(input()), int(input()), int(input())]
for i in a:
    print(i)', explanation='for i in a를 사용하면 리스트의 값을 차례로 가져옵니다.' where problem_id='6-2-01 반복 구조 기초(리스트 값 출력)' and is_primary=true;
update problems set statement='문자열 3개를 입력받아 리스트 a에 저장하세요. for문으로 리스트의 문자열을 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.', input_description='문자열 3개가 한 줄에 하나씩 주어집니다. 문자열 안의 공백도 그대로 저장합니다.', output_description='리스트의 값을 입력 순서대로 한 줄씩 출력합니다.', starter_code='a = [input(), input(), input()]
for i in :
    print()', hint='문자열이 들어 있는 리스트도 for문으로 반복할 수 있습니다.' where id='6-2-02 반복 구조 기초(리스트 문자열 출력)';
delete from test_cases where problem_id='6-2-02 반복 구조 기초(리스트 문자열 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','apple
banana
cherry','apple
banana
cherry',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','a
b
c','a
b
c',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','hello world
Python
list','hello world
Python
list',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','사과
바나나
체리','사과
바나나
체리',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-02 반복 구조 기초(리스트 문자열 출력)','same
same
same','same
same
same',false,5);
update reference_solutions set code='a = [input(), input(), input()]
for i in a:
    print(i)', explanation='문자열이 들어 있는 리스트도 for문으로 반복할 수 있습니다.' where problem_id='6-2-02 반복 구조 기초(리스트 문자열 출력)' and is_primary=true;
update problems set statement='정수 5개를 입력받아 리스트 a에 저장하세요. for문으로 각 값을 가져와 2배한 값을 한 줄씩 출력하도록 프로그래밍하세요.', input_description='정수 5개(-100 이상 100 이하)가 한 줄에 하나씩 주어집니다.', output_description='각 입력값을 2배하여 입력 순서대로 한 줄씩 출력합니다.', starter_code='a = [int(input()), int(input()), int(input()), int(input()), int(input())]
for i in :
    print()', hint='리스트에서 가져온 값에 2를 곱해 출력합니다.' where id='6-2-03 반복 구조 기초(리스트 값 두 배)';
delete from test_cases where problem_id='6-2-03 반복 구조 기초(리스트 값 두 배)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','2
4
6
8
10','4
8
12
16
20',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','0
0
0
0
0','0
0
0
0
0',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','-5
-4
-3
-2
-1','-10
-8
-6
-4
-2',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','10
20
30
40
50','20
40
60
80
100',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-03 반복 구조 기초(리스트 값 두 배)','3
-2
0
7
-9','6
-4
0
14
-18',false,5);
update reference_solutions set code='a = [int(input()), int(input()), int(input()), int(input()), int(input())]
for i in a:
    print(i * 2)', explanation='리스트에서 가져온 값에 2를 곱해 출력합니다.' where problem_id='6-2-03 반복 구조 기초(리스트 값 두 배)' and is_primary=true;
update problems set statement='정수 3개를 입력받아 리스트 a에 저장하세요. for문과 range(3), a[i]를 사용하여 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.', input_description='정수 3개(-100 이상 100 이하)가 한 줄에 하나씩 주어집니다.', output_description='리스트의 값을 입력 순서대로 한 줄씩 출력합니다.', starter_code='a = [int(input()), int(input()), int(input())]
for i in range():
    print()', hint='range(3)은 인덱스 0, 1, 2를 만듭니다.' where id='6-2-04 반복 구조 기초(리스트 인덱스 순회)';
delete from test_cases where problem_id='6-2-04 반복 구조 기초(리스트 인덱스 순회)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','1
2
3','1
2
3',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','0
0
0','0
0
0',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','-3
-2
-1','-3
-2
-1',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','10
20
30','10
20
30',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-04 반복 구조 기초(리스트 인덱스 순회)','5
-5
0','5
-5
0',false,5);
update reference_solutions set code='a = [int(input()), int(input()), int(input())]
for i in range(3):
    print(a[i])', explanation='range(3)은 인덱스 0, 1, 2를 만듭니다.' where problem_id='6-2-04 반복 구조 기초(리스트 인덱스 순회)' and is_primary=true;
update problems set statement='정수 5개를 입력받아 리스트 a에 저장하세요. for문과 range(), a[i]를 사용하여 마지막 값부터 한 줄씩 출력하도록 프로그래밍하세요.', input_description='정수 5개(-100 이상 100 이하)가 한 줄에 하나씩 주어집니다.', output_description='리스트의 값을 입력 순서의 역순으로 한 줄씩 출력합니다.', starter_code='a = [int(input()), int(input()), int(input()), int(input()), int(input())]
for i in range():
    print()', hint='인덱스를 4부터 0까지 1씩 감소시킵니다.' where id='6-2-05 반복 구조 기초(리스트 역순 출력)';
delete from test_cases where problem_id='6-2-05 반복 구조 기초(리스트 역순 출력)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','2
4
6
8
10','10
8
6
4
2',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','0
0
0
0
0','0
0
0
0
0',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','-5
-4
-3
-2
-1','-1
-2
-3
-4
-5',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','10
20
30
40
50','50
40
30
20
10',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-05 반복 구조 기초(리스트 역순 출력)','3
-2
0
7
-9','-9
7
0
-2
3',false,5);
update reference_solutions set code='a = [int(input()), int(input()), int(input()), int(input()), int(input())]
for i in range(4, -1, -1):
    print(a[i])', explanation='인덱스를 4부터 0까지 1씩 감소시킵니다.' where problem_id='6-2-05 반복 구조 기초(리스트 역순 출력)' and is_primary=true;
update problems set statement='정수 n을 입력받고, while문을 사용하여 1부터 n까지 1씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='정수 n(1 이상 20 이하)이 주어집니다.', output_description='1부터 n까지 한 줄씩 출력합니다.', starter_code='n = int(input())
i = 1
while :
    print()
    i = ', hint='i를 1에서 시작하여 n 이하인 동안 출력하고 1씩 증가시킵니다.' where id='6-2-06 반복 구조 기초(while 증가)';
delete from test_cases where problem_id='6-2-06 반복 구조 기초(while 증가)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','5','1
2
3
4
5',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','1','1',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','2','1
2',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','10','1
2
3
4
5
6
7
8
9
10',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-06 반복 구조 기초(while 증가)','20','1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20',false,5);
update reference_solutions set code='n = int(input())
i = 1
while i <= n:
    print(i)
    i = i + 1', explanation='i를 1에서 시작하여 n 이하인 동안 출력하고 1씩 증가시킵니다.' where problem_id='6-2-06 반복 구조 기초(while 증가)' and is_primary=true;
update problems set statement='정수 n을 입력받고, while문으로 n이 3 이상인 동안 n을 출력하고 1씩 감소시키도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='정수 n(3 이상 20 이하)이 주어집니다.', output_description='n부터 3까지 한 줄씩 출력합니다.', starter_code='n = int(input())
while :
    print()
    n = ', hint='현재 값을 출력한 뒤 n을 1씩 감소시킵니다.' where id='6-2-07 반복 구조 기초(while 감소)';
delete from test_cases where problem_id='6-2-07 반복 구조 기초(while 감소)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','5','5
4
3',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','3','3',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','4','4
3',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','10','10
9
8
7
6
5
4
3',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-07 반복 구조 기초(while 감소)','20','20
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
3',false,5);
update reference_solutions set code='n = int(input())
while n >= 3:
    print(n)
    n = n - 1', explanation='현재 값을 출력한 뒤 n을 1씩 감소시킵니다.' where problem_id='6-2-07 반복 구조 기초(while 감소)' and is_primary=true;
update problems set statement='정수 a와 b를 입력받고, while문으로 a가 b보다 큰 동안 a를 1씩 감소시키세요. 반복이 끝난 뒤 a를 한 번만 출력하도록 프로그래밍하세요.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='첫째 줄에 정수 a, 둘째 줄에 정수 b가 주어집니다. -20 ≤ b ≤ a ≤ 20입니다.', output_description='반복이 끝난 뒤 a의 값을 한 번만 출력합니다.', starter_code='a = int(input())
b = int(input())
while :
    a = 
print()', hint='print(a)는 while문 바깥에 작성합니다. 반복이 끝나는 순간의 조건을 생각해보세요.' where id='6-2-08 반복 구조 기초(while 종료 후 값)';
delete from test_cases where problem_id='6-2-08 반복 구조 기초(while 종료 후 값)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','10
3','3',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','3
3','3',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','4
3','3',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','0
-5','-5',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-08 반복 구조 기초(while 종료 후 값)','20
0','0',false,5);
update reference_solutions set code='a = int(input())
b = int(input())
while a > b:
    a = a - 1
print(a)', explanation='print(a)는 while문 바깥에 작성합니다. 반복이 끝나는 순간의 조건을 생각해보세요.' where problem_id='6-2-08 반복 구조 기초(while 종료 후 값)' and is_primary=true;
update problems set statement='정수 n을 입력받고, while문으로 2부터 n 이하까지 2씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요. n이 홀수이면 n보다 작은 마지막 짝수까지 출력합니다.

반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.', input_description='정수 n(2 이상 20 이하)이 주어집니다.', output_description='2부터 n 이하인 짝수를 한 줄씩 출력합니다.', starter_code='n = int(input())
i = 2
while :
    print()
    i = ', hint='i를 2에서 시작하여 n 이하인 동안 출력하고 2씩 증가시킵니다.' where id='6-2-09 반복 구조 기초(while 두 칸씩 증가)';
delete from test_cases where problem_id='6-2-09 반복 구조 기초(while 두 칸씩 증가)';
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','10','2
4
6
8
10',true,1);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','2','2',false,2);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','3','2',false,3);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','9','2
4
6
8',false,4);
insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values ('6-2-09 반복 구조 기초(while 두 칸씩 증가)','20','2
4
6
8
10
12
14
16
18
20',false,5);
update reference_solutions set code='n = int(input())
i = 2
while i <= n:
    print(i)
    i = i + 2', explanation='i를 2에서 시작하여 n 이하인 동안 출력하고 2씩 증가시킵니다.' where problem_id='6-2-09 반복 구조 기초(while 두 칸씩 증가)' and is_primary=true;
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