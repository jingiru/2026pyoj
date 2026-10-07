begin;
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-01-02','수행평가 1반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',201,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-02-02','수행평가 2반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',202,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-04-02','수행평가 4반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',204,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-05-02','수행평가 5반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',205,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-06-02','수행평가 6반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',206,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-07-02','수행평가 7반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',207,false);
insert into public.problem_books (id,title,description,sort_order,is_published) values ('평가-08-02','수행평가 8반(2차)','3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.',208,false);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-01 여섯 값 띄어 출력','평가-01-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Python 2026 Class 1 Round 2]]를 한 줄에 출력하세요.','입력은 없습니다.','Python 2026 Class 1 Round 2를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-01 여섯 값 띄어 출력','','Python 2026 Class 1 Round 2',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-02 문자 사이 빈 줄 출력','평가-01-02','문자 사이 빈 줄 출력','P, Y, N를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-02 문자 사이 빈 줄 출력','','P


Y


N',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-03 네 문자열 순서 바꾸기','평가-01-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 3번째, 4번째, 1번째, 2번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','가을
겨울
봄
여름',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','A
B
C
D','C
D
A
B',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','1
22
333
4444','333
4444
1
22',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','see you
good bye
hello world
good morning',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','다름
같음
같음
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-03 네 문자열 순서 바꾸기','가
나
다
라','다
라
가
나',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-04 더한 뒤 몫 출력','평가-01-02','더한 뒤 몫 출력','정수 하나를 입력받아 12을 먼저 더한 후, 그 결과를 5로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','10','4',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','-7','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','23','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','100','22',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','-12','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-04 더한 뒤 몫 출력','-13','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-05 다음 층 보관함 번호','평가-01-02','다음 층 보관함 번호','층, 구역, 칸를 차례로 입력받습니다.
층을 하나 올린 뒤, 층 1자리와 구역 2자리, 칸 2자리를 이어 붙인 5자리 번호를 출력하세요.
구역이나 칸가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','층: 1~2, 구역: 1~9, 칸: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-05 다음 층 보관함 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-06 세 입력 재배치 출력','평가-01-02','세 입력 재배치 출력','과일, 맛, 가게를 차례로 한 줄에 하나씩 입력받습니다. 가게, 과일, 맛 순서로 바꾸고 각 값 사이에 " / "를 넣어 한 줄에 출력하세요.','1번째 줄: 과일
2번째 줄: 맛
3번째 줄: 가게','가게 / 과일 / 맛','fruit = 
taste = 
shop = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','사과
달콤
시장','시장 / 사과 / 달콤',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','cat
white
park','park / cat / white',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','첫째
둘째
셋째','셋째 / 첫째 / 둘째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','old tree / hello world / deep blue',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','봄
여름
가을','가을 / 봄 / 여름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-06 세 입력 재배치 출력','A
B
C','C / A / B',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-07 6의 배수 판정','평가-01-02','6의 배수 판정','정수 n을 입력받아 6의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','12','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','13','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','-18','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','-5','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','60','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-07 6의 배수 판정','61','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-08 두 기준으로 값 분류','평가-01-02','두 기준으로 값 분류','변수 score에는 정수 15가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- score가 30 이상이면 [[30 이상]]
- 그렇지 않고 15 이상이면 [[15 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 30부터 차례대로 확인하세요.','입력은 없습니다.','30 이상, 15 이상, 그 외 중 하나를 출력합니다.','score = 15
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"score","branches":[{"value":30,"output":"30 이상","operator":">="},{"value":15,"output":"15 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-08 두 기준으로 값 분류','','15 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-09 문자열 묶음 여러 줄 출력','평가-01-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "hi!"를 공백 없이 4번 이어 붙인 문자열을 6줄 출력하세요.','입력은 없습니다.','hi!hi!hi!hi!를 6줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-09 문자열 묶음 여러 줄 출력','','hi!hi!hi!hi!
hi!hi!hi!hi!
hi!hi!hi!hi!
hi!hi!hi!hi!
hi!hi!hi!hi!
hi!hi!hi!hi!',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가1-2-10 인덱싱과 슬라이싱 결합','평가-01-02','인덱싱과 슬라이싱 결합','a = [2, 4, 6, 3, 8]
b = "246810"
c = "coding practice"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 2번째 문자와 c의 마지막 문자를 결합한 뒤, a의 4번째 요소만큼 반복
2. c의 처음 2개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','4e4e4e
co810','a = [2, 4, 6, 3, 8]
b = "246810"
c = "coding practice"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가1-2-10 인덱싱과 슬라이싱 결합','','4e4e4e
co810',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-01 여섯 값 띄어 출력','평가-02-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Ready 2 Set 4 Go 6]]를 한 줄에 출력하세요.','입력은 없습니다.','Ready 2 Set 4 Go 6를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-01 여섯 값 띄어 출력','','Ready 2 Set 4 Go 6',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-02 문자 사이 빈 줄 출력','평가-02-02','문자 사이 빈 줄 출력','R, S, G를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-02 문자 사이 빈 줄 출력','','R


S


G',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-03 네 문자열 순서 바꾸기','평가-02-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 4번째, 1번째, 2번째, 3번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','겨울
봄
여름
가을',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','A
B
C
D','D
A
B
C',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','1
22
333
4444','4444
1
22
333',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','good bye
hello world
good morning
see you',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','같음
같음
다름
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-03 네 문자열 순서 바꾸기','가
나
다
라','라
가
나
다',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-04 더한 뒤 몫 출력','평가-02-02','더한 뒤 몫 출력','정수 하나를 입력받아 9을 먼저 더한 후, 그 결과를 4로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','10','4',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','-5','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','19','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','100','27',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','-9','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-04 더한 뒤 몫 출력','-10','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-05 다음 단계 참가 번호','평가-02-02','다음 단계 참가 번호','단계, 팀, 번호를 차례로 입력받습니다.
단계을 하나 올린 뒤, 단계 1자리와 팀 2자리, 번호 2자리를 이어 붙인 5자리 번호를 출력하세요.
팀이나 번호가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','단계: 1~2, 팀: 1~9, 번호: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-05 다음 단계 참가 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-06 세 입력 재배치 출력','평가-02-02','세 입력 재배치 출력','이름, 도시, 취미를 차례로 한 줄에 하나씩 입력받습니다. 도시, 취미, 이름 순서로 바꾸고 각 값 사이에 " : "를 넣어 한 줄에 출력하세요.','1번째 줄: 이름
2번째 줄: 도시
3번째 줄: 취미','도시 : 취미 : 이름','name = 
city = 
hobby = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','민수
서울
독서','서울 : 독서 : 민수',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','cat
white
park','white : park : cat',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','첫째
둘째
셋째','둘째 : 셋째 : 첫째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','deep blue : old tree : hello world',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','봄
여름
가을','여름 : 가을 : 봄',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-06 세 입력 재배치 출력','A
B
C','B : C : A',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-07 8의 배수 판정','평가-02-02','8의 배수 판정','정수 n을 입력받아 8의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','16','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','17','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','-24','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','-7','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','80','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-07 8의 배수 판정','81','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-08 두 기준으로 값 분류','평가-02-02','두 기준으로 값 분류','변수 level에는 정수 10가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- level가 25 이상이면 [[25 이상]]
- 그렇지 않고 10 이상이면 [[10 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 25부터 차례대로 확인하세요.','입력은 없습니다.','25 이상, 10 이상, 그 외 중 하나를 출력합니다.','level = 10
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"level","branches":[{"value":25,"output":"25 이상","operator":">="},{"value":10,"output":"10 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-08 두 기준으로 값 분류','','10 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-09 문자열 묶음 여러 줄 출력','평가-02-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "run"를 공백 없이 3번 이어 붙인 문자열을 9줄 출력하세요.','입력은 없습니다.','runrunrun를 9줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-09 문자열 묶음 여러 줄 출력','','runrunrun
runrunrun
runrunrun
runrunrun
runrunrun
runrunrun
runrunrun
runrunrun
runrunrun',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가2-2-10 인덱싱과 슬라이싱 결합','평가-02-02','인덱싱과 슬라이싱 결합','a = [5, 3, 7, 2, 9]
b = "135790"
c = "python school"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 3번째 문자와 c의 마지막 문자를 결합한 뒤, a의 2번째 요소만큼 반복
2. c의 처음 3개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','5l5l5l
pyt790','a = [5, 3, 7, 2, 9]
b = "135790"
c = "python school"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가2-2-10 인덱싱과 슬라이싱 결합','','5l5l5l
pyt790',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-01 여섯 값 띄어 출력','평가-04-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Code 4 Step 8 Start 12]]를 한 줄에 출력하세요.','입력은 없습니다.','Code 4 Step 8 Start 12를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-01 여섯 값 띄어 출력','','Code 4 Step 8 Start 12',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-02 문자 사이 빈 줄 출력','평가-04-02','문자 사이 빈 줄 출력','C, O, E를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-02 문자 사이 빈 줄 출력','','C


O


E',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-03 네 문자열 순서 바꾸기','평가-04-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 4번째, 1번째, 2번째, 3번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','겨울
봄
여름
가을',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','A
B
C
D','D
A
B
C',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','1
22
333
4444','4444
1
22
333',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','good bye
hello world
good morning
see you',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','같음
같음
다름
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-03 네 문자열 순서 바꾸기','가
나
다
라','라
가
나
다',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-04 더한 뒤 몫 출력','평가-04-02','더한 뒤 몫 출력','정수 하나를 입력받아 14을 먼저 더한 후, 그 결과를 6로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','10','4',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','-8','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','28','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','100','19',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','-14','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-04 더한 뒤 몫 출력','-15','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-05 다음 층 객실 번호','평가-04-02','다음 층 객실 번호','층, 구역, 객실를 차례로 입력받습니다.
층을 하나 올린 뒤, 층 1자리와 구역 2자리, 객실 2자리를 이어 붙인 5자리 번호를 출력하세요.
구역이나 객실가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','층: 1~2, 구역: 1~9, 객실: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-05 다음 층 객실 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-06 세 입력 재배치 출력','평가-04-02','세 입력 재배치 출력','계절, 날씨, 활동를 차례로 한 줄에 하나씩 입력받습니다. 활동, 날씨, 계절 순서로 바꾸고 각 값 사이에 " - "를 넣어 한 줄에 출력하세요.','1번째 줄: 계절
2번째 줄: 날씨
3번째 줄: 활동','활동 - 날씨 - 계절','season = 
weather = 
activity = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','여름
맑음
수영','수영 - 맑음 - 여름',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','cat
white
park','park - white - cat',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','첫째
둘째
셋째','셋째 - 둘째 - 첫째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','old tree - deep blue - hello world',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','봄
여름
가을','가을 - 여름 - 봄',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-06 세 입력 재배치 출력','A
B
C','C - B - A',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-07 9의 배수 판정','평가-04-02','9의 배수 판정','정수 n을 입력받아 9의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','18','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','19','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','-27','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','-8','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','90','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-07 9의 배수 판정','91','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-08 두 기준으로 값 분류','평가-04-02','두 기준으로 값 분류','변수 point에는 정수 18가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- point가 40 이상이면 [[40 이상]]
- 그렇지 않고 18 이상이면 [[18 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 40부터 차례대로 확인하세요.','입력은 없습니다.','40 이상, 18 이상, 그 외 중 하나를 출력합니다.','point = 18
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"point","branches":[{"value":40,"output":"40 이상","operator":">="},{"value":18,"output":"18 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-08 두 기준으로 값 분류','','18 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-09 문자열 묶음 여러 줄 출력','평가-04-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "ha!"를 공백 없이 4번 이어 붙인 문자열을 7줄 출력하세요.','입력은 없습니다.','ha!ha!ha!ha!를 7줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-09 문자열 묶음 여러 줄 출력','','ha!ha!ha!ha!
ha!ha!ha!ha!
ha!ha!ha!ha!
ha!ha!ha!ha!
ha!ha!ha!ha!
ha!ha!ha!ha!
ha!ha!ha!ha!',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가4-2-10 인덱싱과 슬라이싱 결합','평가-04-02','인덱싱과 슬라이싱 결합','a = [3, 6, 2, 4, 8]
b = "357910"
c = "computer class"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 2번째 문자와 c의 마지막 문자를 결합한 뒤, a의 4번째 요소만큼 반복
2. c의 처음 2개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','5s5s5s5s
co910','a = [3, 6, 2, 4, 8]
b = "357910"
c = "computer class"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가4-2-10 인덱싱과 슬라이싱 결합','','5s5s5s5s
co910',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-01 여섯 값 띄어 출력','평가-05-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Day 5 Month 10 Year 2026]]를 한 줄에 출력하세요.','입력은 없습니다.','Day 5 Month 10 Year 2026를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-01 여섯 값 띄어 출력','','Day 5 Month 10 Year 2026',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-02 문자 사이 빈 줄 출력','평가-05-02','문자 사이 빈 줄 출력','D, M, Y를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-02 문자 사이 빈 줄 출력','','D


M


Y',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-03 네 문자열 순서 바꾸기','평가-05-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 3번째, 4번째, 1번째, 2번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','가을
겨울
봄
여름',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','A
B
C
D','C
D
A
B',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','1
22
333
4444','333
4444
1
22',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','see you
good bye
hello world
good morning',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','다름
같음
같음
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-03 네 문자열 순서 바꾸기','가
나
다
라','다
라
가
나',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-04 더한 뒤 몫 출력','평가-05-02','더한 뒤 몫 출력','정수 하나를 입력받아 8을 먼저 더한 후, 그 결과를 3로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','10','6',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','-5','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','13','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','100','36',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','-8','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-04 더한 뒤 몫 출력','-9','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-05 다음 회차 좌석 번호','평가-05-02','다음 회차 좌석 번호','회차, 줄, 좌석를 차례로 입력받습니다.
회차을 하나 올린 뒤, 회차 1자리와 줄 2자리, 좌석 2자리를 이어 붙인 5자리 번호를 출력하세요.
줄이나 좌석가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','회차: 1~2, 줄: 1~9, 좌석: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-05 다음 회차 좌석 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-06 세 입력 재배치 출력','평가-05-02','세 입력 재배치 출력','음식, 나라, 식당를 차례로 한 줄에 하나씩 입력받습니다. 나라, 음식, 식당 순서로 바꾸고 각 값 사이에 " / "를 넣어 한 줄에 출력하세요.','1번째 줄: 음식
2번째 줄: 나라
3번째 줄: 식당','나라 / 음식 / 식당','food = 
country = 
store = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','피자
이탈리아
맛나식당','이탈리아 / 피자 / 맛나식당',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','cat
white
park','white / cat / park',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','첫째
둘째
셋째','둘째 / 첫째 / 셋째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','deep blue / hello world / old tree',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','봄
여름
가을','여름 / 봄 / 가을',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-06 세 입력 재배치 출력','A
B
C','B / A / C',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-07 7의 배수 판정','평가-05-02','7의 배수 판정','정수 n을 입력받아 7의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','14','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','15','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','-21','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','-6','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','70','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-07 7의 배수 판정','71','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-08 두 기준으로 값 분류','평가-05-02','두 기준으로 값 분류','변수 count에는 정수 14가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- count가 35 이상이면 [[35 이상]]
- 그렇지 않고 14 이상이면 [[14 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 35부터 차례대로 확인하세요.','입력은 없습니다.','35 이상, 14 이상, 그 외 중 하나를 출력합니다.','count = 14
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"count","branches":[{"value":35,"output":"35 이상","operator":">="},{"value":14,"output":"14 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-08 두 기준으로 값 분류','','14 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-09 문자열 묶음 여러 줄 출력','평가-05-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "yes"를 공백 없이 3번 이어 붙인 문자열을 7줄 출력하세요.','입력은 없습니다.','yesyesyes를 7줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-09 문자열 묶음 여러 줄 출력','','yesyesyes
yesyesyes
yesyesyes
yesyesyes
yesyesyes
yesyesyes
yesyesyes',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가5-2-10 인덱싱과 슬라이싱 결합','평가-05-02','인덱싱과 슬라이싱 결합','a = [4, 2, 5, 3, 7]
b = "468120"
c = "learning python"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 3번째 문자와 c의 마지막 문자를 결합한 뒤, a의 1번째 요소만큼 반복
2. c의 처음 2개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','8n8n8n8n
le120','a = [4, 2, 5, 3, 7]
b = "468120"
c = "learning python"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가5-2-10 인덱싱과 슬라이싱 결합','','8n8n8n8n
le120',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-01 여섯 값 띄어 출력','평가-06-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Team 6 Score 12 Goal 18]]를 한 줄에 출력하세요.','입력은 없습니다.','Team 6 Score 12 Goal 18를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-01 여섯 값 띄어 출력','','Team 6 Score 12 Goal 18',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-02 문자 사이 빈 줄 출력','평가-06-02','문자 사이 빈 줄 출력','T, S, G를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-02 문자 사이 빈 줄 출력','','T


S


G',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-03 네 문자열 순서 바꾸기','평가-06-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 4번째, 1번째, 2번째, 3번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','겨울
봄
여름
가을',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','A
B
C
D','D
A
B
C',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','1
22
333
4444','4444
1
22
333',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','good bye
hello world
good morning
see you',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','같음
같음
다름
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-03 네 문자열 순서 바꾸기','가
나
다
라','라
가
나
다',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-04 더한 뒤 몫 출력','평가-06-02','더한 뒤 몫 출력','정수 하나를 입력받아 11을 먼저 더한 후, 그 결과를 5로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','10','4',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','-6','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','24','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','100','22',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','-11','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-04 더한 뒤 몫 출력','-12','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-05 다음 단계 상품 번호','평가-06-02','다음 단계 상품 번호','단계, 종류, 번호를 차례로 입력받습니다.
단계을 하나 올린 뒤, 단계 1자리와 종류 2자리, 번호 2자리를 이어 붙인 5자리 번호를 출력하세요.
종류이나 번호가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','단계: 1~2, 종류: 1~9, 번호: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-05 다음 단계 상품 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-06 세 입력 재배치 출력','평가-06-02','세 입력 재배치 출력','물건, 색깔, 장소를 차례로 한 줄에 하나씩 입력받습니다. 장소, 색깔, 물건 순서로 바꾸고 각 값 사이에 " : "를 넣어 한 줄에 출력하세요.','1번째 줄: 물건
2번째 줄: 색깔
3번째 줄: 장소','장소 : 색깔 : 물건','item = 
color = 
place = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','가방
파랑
교실','교실 : 파랑 : 가방',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','cat
white
park','park : white : cat',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','첫째
둘째
셋째','셋째 : 둘째 : 첫째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','old tree : deep blue : hello world',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','봄
여름
가을','가을 : 여름 : 봄',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-06 세 입력 재배치 출력','A
B
C','C : B : A',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-07 3의 배수 판정','평가-06-02','3의 배수 판정','정수 n을 입력받아 3의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','6','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','7','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','-9','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','-2','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','30','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-07 3의 배수 판정','31','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-08 두 기준으로 값 분류','평가-06-02','두 기준으로 값 분류','변수 value에는 정수 11가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- value가 28 이상이면 [[28 이상]]
- 그렇지 않고 11 이상이면 [[11 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 28부터 차례대로 확인하세요.','입력은 없습니다.','28 이상, 11 이상, 그 외 중 하나를 출력합니다.','value = 11
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"value","branches":[{"value":28,"output":"28 이상","operator":">="},{"value":11,"output":"11 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-08 두 기준으로 값 분류','','11 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-09 문자열 묶음 여러 줄 출력','평가-06-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "ok!"를 공백 없이 4번 이어 붙인 문자열을 8줄 출력하세요.','입력은 없습니다.','ok!ok!ok!ok!를 8줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-09 문자열 묶음 여러 줄 출력','','ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!
ok!ok!ok!ok!',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가6-2-10 인덱싱과 슬라이싱 결합','평가-06-02','인덱싱과 슬라이싱 결합','a = [6, 3, 2, 5, 9]
b = "579130"
c = "school coding"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 2번째 문자와 c의 마지막 문자를 결합한 뒤, a의 2번째 요소만큼 반복
2. c의 처음 3개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','7g7g7g
sch130','a = [6, 3, 2, 5, 9]
b = "579130"
c = "school coding"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가6-2-10 인덱싱과 슬라이싱 결합','','7g7g7g
sch130',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-01 여섯 값 띄어 출력','평가-07-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[Red 7 Green 14 Blue 21]]를 한 줄에 출력하세요.','입력은 없습니다.','Red 7 Green 14 Blue 21를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-01 여섯 값 띄어 출력','','Red 7 Green 14 Blue 21',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-02 문자 사이 빈 줄 출력','평가-07-02','문자 사이 빈 줄 출력','R, G, B를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-02 문자 사이 빈 줄 출력','','R


G


B',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-03 네 문자열 순서 바꾸기','평가-07-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 3번째, 4번째, 1번째, 2번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','가을
겨울
봄
여름',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','A
B
C
D','C
D
A
B',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','1
22
333
4444','333
4444
1
22',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','see you
good bye
hello world
good morning',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','다름
같음
같음
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-03 네 문자열 순서 바꾸기','가
나
다
라','다
라
가
나',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-04 더한 뒤 몫 출력','평가-07-02','더한 뒤 몫 출력','정수 하나를 입력받아 13을 먼저 더한 후, 그 결과를 6로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','10','3',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','0','2',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','-7','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','29','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','100','18',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','-13','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-04 더한 뒤 몫 출력','-14','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-05 다음 층 사물함 번호','평가-07-02','다음 층 사물함 번호','층, 반, 번호를 차례로 입력받습니다.
층을 하나 올린 뒤, 층 1자리와 반 2자리, 번호 2자리를 이어 붙인 5자리 번호를 출력하세요.
반이나 번호가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','층: 1~2, 반: 1~9, 번호: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-05 다음 층 사물함 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-06 세 입력 재배치 출력','평가-07-02','세 입력 재배치 출력','동물, 먹이, 서식지를 차례로 한 줄에 하나씩 입력받습니다. 먹이, 서식지, 동물 순서로 바꾸고 각 값 사이에 " - "를 넣어 한 줄에 출력하세요.','1번째 줄: 동물
2번째 줄: 먹이
3번째 줄: 서식지','먹이 - 서식지 - 동물','animal = 
food = 
home = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','토끼
당근
숲','당근 - 숲 - 토끼',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','cat
white
park','white - park - cat',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','첫째
둘째
셋째','둘째 - 셋째 - 첫째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','deep blue - old tree - hello world',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','봄
여름
가을','여름 - 가을 - 봄',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-06 세 입력 재배치 출력','A
B
C','B - C - A',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-07 10의 배수 판정','평가-07-02','10의 배수 판정','정수 n을 입력받아 10의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','20','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','21','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','-30','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','-9','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','100','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-07 10의 배수 판정','101','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-08 두 기준으로 값 분류','평가-07-02','두 기준으로 값 분류','변수 number에는 정수 16가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- number가 32 이상이면 [[32 이상]]
- 그렇지 않고 16 이상이면 [[16 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 32부터 차례대로 확인하세요.','입력은 없습니다.','32 이상, 16 이상, 그 외 중 하나를 출력합니다.','number = 16
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"number","branches":[{"value":32,"output":"32 이상","operator":">="},{"value":16,"output":"16 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-08 두 기준으로 값 분류','','16 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-09 문자열 묶음 여러 줄 출력','평가-07-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "go?"를 공백 없이 3번 이어 붙인 문자열을 6줄 출력하세요.','입력은 없습니다.','go?go?go?를 6줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-09 문자열 묶음 여러 줄 출력','','go?go?go?
go?go?go?
go?go?go?
go?go?go?
go?go?go?
go?go?go?',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가7-2-10 인덱싱과 슬라이싱 결합','평가-07-02','인덱싱과 슬라이싱 결합','a = [2, 5, 3, 4, 7]
b = "681240"
c = "digital learning"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 3번째 문자와 c의 마지막 문자를 결합한 뒤, a의 4번째 요소만큼 반복
2. c의 처음 2개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','1g1g1g1g
di240','a = [2, 5, 3, 4, 7]
b = "681240"
c = "digital learning"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가7-2-10 인덱싱과 슬라이싱 결합','','1g1g1g1g
di240',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-01 여섯 값 띄어 출력','평가-08-02','여섯 값 띄어 출력','print 함수의 쉼표(,)를 활용하여 [[First 8 Second 16 Third 24]]를 한 줄에 출력하세요.','입력은 없습니다.','First 8 Second 16 Third 24를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.','','',1,false,'[{"type":"print_arguments","minCount":6}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-01 여섯 값 띄어 출력','','First 8 Second 16 Third 24',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-02 문자 사이 빈 줄 출력','평가-08-02','문자 사이 빈 줄 출력','F, S, T를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.','입력은 없습니다.','문자 세 줄과 빈 줄 네 줄을 출력합니다.','','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.',2,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-02 문자 사이 빈 줄 출력','','F


S


T',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-03 네 문자열 순서 바꾸기','평가-08-02','네 문자열 순서 바꾸기','문자열 4개를 한 줄에 하나씩 입력받아 4번째, 1번째, 2번째, 3번째 입력 순서로 한 줄에 하나씩 출력하세요.','문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.','','',3,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','봄
여름
가을
겨울','겨울
봄
여름
가을',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','A
B
C
D','D
A
B
C',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','1
22
333
4444','4444
1
22
333',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','hello world
good morning
see you
good bye','good bye
hello world
good morning
see you',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','같음
다름
다름
같음','같음
같음
다름
다름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-03 네 문자열 순서 바꾸기','가
나
다
라','라
가
나
다',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-04 더한 뒤 몫 출력','평가-08-02','더한 뒤 몫 출력','정수 하나를 입력받아 7을 먼저 더한 후, 그 결과를 4로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.','정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.','','',4,false,'[{"type":"operators","values":["+","//"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','10','4',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','0','1',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','-3','1',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','21','7',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','100','26',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','-7','0',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-04 더한 뒤 몫 출력','-8','-1',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-05 다음 회차 접수 번호','평가-08-02','다음 회차 접수 번호','회차, 창구, 번호를 차례로 입력받습니다.
회차을 하나 올린 뒤, 회차 1자리와 창구 2자리, 번호 2자리를 이어 붙인 5자리 번호를 출력하세요.
창구이나 번호가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.

[[if를 사용하지 않고 풀어야 합니다.]]','회차: 1~2, 창구: 1~9, 번호: 1~33인 정수 세 개가 한 줄씩 주어집니다.','설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())
second = int(input())
third = int(input())
','',5,false,'[{"type":"forbidden_keywords","values":["if"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','1
4
28','20428',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','1
3
9','20309',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','1
1
1','20101',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','1
9
10','20910',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','2
4
7','30407',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','2
9
33','30933',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-05 다음 회차 접수 번호','2
1
20','30120',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-06 세 입력 재배치 출력','평가-08-02','세 입력 재배치 출력','책, 작가, 도서관를 차례로 한 줄에 하나씩 입력받습니다. 도서관, 책, 작가 순서로 바꾸고 각 값 사이에 " / "를 넣어 한 줄에 출력하세요.','1번째 줄: 책
2번째 줄: 작가
3번째 줄: 도서관','도서관 / 책 / 작가','book = 
author = 
library = 
','',6,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','어린왕자
생텍쥐페리
중앙도서관','중앙도서관 / 어린왕자 / 생텍쥐페리',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','cat
white
park','park / cat / white',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','첫째
둘째
셋째','셋째 / 첫째 / 둘째',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','hello world
deep blue
old tree','old tree / hello world / deep blue',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','봄
여름
가을','가을 / 봄 / 여름',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-06 세 입력 재배치 출력','A
B
C','C / A / B',false,1,6);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-07 11의 배수 판정','평가-08-02','11의 배수 판정','정수 n을 입력받아 11의 배수이면 YES, 아니면 NO를 출력하세요.','정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.','n = 
if :
    print()
else:
    print()','',7,false,'[]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','22','YES',true,1,1);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','23','NO',false,1,2);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','0','YES',false,1,3);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','-33','YES',false,1,4);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','-10','NO',false,1,5);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','110','YES',false,1,6);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-07 11의 배수 판정','111','NO',false,1,7);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-08 두 기준으로 값 분류','평가-08-02','두 기준으로 값 분류','변수 total에는 정수 21가 저장되어 있습니다.
if, elif, else를 사용하여 다음 조건에 맞게 출력하세요.
- total가 45 이상이면 [[45 이상]]
- 그렇지 않고 21 이상이면 [[21 이상]]
- 두 조건에 모두 해당하지 않으면 [[그 외]]
큰 기준인 45부터 차례대로 확인하세요.','입력은 없습니다.','45 이상, 21 이상, 그 외 중 하나를 출력합니다.','total = 21
if :
    print()','',8,false,'[{"type":"conditional_ladder","variable":"total","branches":[{"value":45,"output":"45 이상","operator":">="},{"value":21,"output":"21 이상","operator":">="}],"elseOutput":"그 외"}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-08 두 기준으로 값 분류','','21 이상',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-09 문자열 묶음 여러 줄 출력','평가-08-02','문자열 묶음 여러 줄 출력','for 반복문과 * 연산자를 사용하여 "wow"를 공백 없이 3번 이어 붙인 문자열을 8줄 출력하세요.','입력은 없습니다.','wowwowwow를 8줄 출력합니다.','for i in range():
    print()','',9,false,'[{"type":"for_range"},{"type":"operators","values":["*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-09 문자열 묶음 여러 줄 출력','','wowwowwow
wowwowwow
wowwowwow
wowwowwow
wowwowwow
wowwowwow
wowwowwow
wowwowwow',true,1,1);
insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values ('평가8-2-10 인덱싱과 슬라이싱 결합','평가-08-02','인덱싱과 슬라이싱 결합','a = [5, 2, 4, 3, 8]
b = "792460"
c = "creative coding"

인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.
1. b의 2번째 문자와 c의 마지막 문자를 결합한 뒤, a의 3번째 요소만큼 반복
2. c의 처음 3개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합','입력은 없습니다.','9g9g9g9g
cre460','a = [5, 2, 4, 3, 8]
b = "792460"
c = "creative coding"
','인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.',10,false,'[{"type":"indexing","minCount":3},{"type":"slicing","minCount":2},{"type":"operators","values":["+","*"]}]'::jsonb,2000,128);
insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values ('평가8-2-10 인덱싱과 슬라이싱 결합','','9g9g9g9g
cre460',true,1,1);
commit;