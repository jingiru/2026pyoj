const fs = require('node:fs');
const path = require('node:path');
const specs = [
  { cls:1, words:['Python','2026','Class','1','Round','2'], letters:['P','Y','N'], add:12, div:5, code:['다음 층 보관함 번호','층','구역','칸'], fields:['과일','맛','가게'], names:['fruit','taste','shop'], perm:[2,0,1], sep:' / ', divisor:6, variable:'score', high:30, low:15, token:'hi!', repeat:4, lines:6, a:[2,4,6,3,8], b:'246810', c:'coding practice', bi:1, ai:3, slice:2 },
  { cls:2, words:['Ready','2','Set','4','Go','6'], letters:['R','S','G'], add:9, div:4, code:['다음 단계 참가 번호','단계','팀','번호'], fields:['이름','도시','취미'], names:['name','city','hobby'], perm:[1,2,0], sep:' : ', divisor:8, variable:'level', high:25, low:10, token:'run', repeat:3, lines:9, a:[5,3,7,2,9], b:'135790', c:'python school', bi:2, ai:1, slice:3 },
  { cls:4, words:['Code','4','Step','8','Start','12'], letters:['C','O','E'], add:14, div:6, code:['다음 층 객실 번호','층','구역','객실'], fields:['계절','날씨','활동'], names:['season','weather','activity'], perm:[2,1,0], sep:' - ', divisor:9, variable:'point', high:40, low:18, token:'ha!', repeat:4, lines:7, a:[3,6,2,4,8], b:'357910', c:'computer class', bi:1, ai:3, slice:2 },
  { cls:5, words:['Day','5','Month','10','Year','2026'], letters:['D','M','Y'], add:8, div:3, code:['다음 회차 좌석 번호','회차','줄','좌석'], fields:['음식','나라','식당'], names:['food','country','store'], perm:[1,0,2], sep:' / ', divisor:7, variable:'count', high:35, low:14, token:'yes', repeat:3, lines:7, a:[4,2,5,3,7], b:'468120', c:'learning python', bi:2, ai:0, slice:2 },
  { cls:6, words:['Team','6','Score','12','Goal','18'], letters:['T','S','G'], add:11, div:5, code:['다음 단계 상품 번호','단계','종류','번호'], fields:['물건','색깔','장소'], names:['item','color','place'], perm:[2,1,0], sep:' : ', divisor:3, variable:'value', high:28, low:11, token:'ok!', repeat:4, lines:8, a:[6,3,2,5,9], b:'579130', c:'school coding', bi:1, ai:1, slice:3 },
  { cls:7, words:['Red','7','Green','14','Blue','21'], letters:['R','G','B'], add:13, div:6, code:['다음 층 사물함 번호','층','반','번호'], fields:['동물','먹이','서식지'], names:['animal','food','home'], perm:[1,2,0], sep:' - ', divisor:10, variable:'number', high:32, low:16, token:'go?', repeat:3, lines:6, a:[2,5,3,4,7], b:'681240', c:'digital learning', bi:2, ai:3, slice:2 },
  { cls:8, words:['First','8','Second','16','Third','24'], letters:['F','S','T'], add:7, div:4, code:['다음 회차 접수 번호','회차','창구','번호'], fields:['책','작가','도서관'], names:['book','author','library'], perm:[2,0,1], sep:' / ', divisor:11, variable:'total', high:45, low:21, token:'wow', repeat:3, lines:8, a:[5,2,4,3,8], b:'792460', c:'creative coding', bi:1, ai:2, slice:3 }
];
const all = [];
for (const s of specs) {
 const bookId=`평가-${String(s.cls).padStart(2,'0')}-02`;
 const add=(title,statement,inputDescription,outputDescription,solution,cases,requirements=[],starterCode='',hint='')=> {
   const order=all.filter(p=>p.bookId===bookId).length+1;
   all.push({id:`평가${s.cls}-2-${String(order).padStart(2,'0')} ${title}`,bookId,order,title,statement,inputDescription,outputDescription,solution,cases,requirements,starterCode,hint});
 };
 const fixed=(out)=>[{input:'',output:out}];
 const noInput='입력은 없습니다.';
 const out=s.words.join(' ');
 add('여섯 값 띄어 출력',`print 함수의 쉼표(,)를 활용하여 [[${out}]]를 한 줄에 출력하세요.`,noInput,`${out}를 출력합니다. 각 값 사이에 공백을 하나 넣습니다.`,`print(${s.words.map(w=>/^\d+$/.test(w)?w:JSON.stringify(w)).join(', ')})`,fixed(out),[{type:'print_arguments',minCount:6}]);
 const blank=s.letters.join('\n\n\n');
 add('문자 사이 빈 줄 출력',`${s.letters.join(', ')}를 순서대로 한 줄씩 출력하되, 문자 사이에 빈 줄을 두 줄씩 넣어 총 일곱 줄로 출력하세요.`,noInput,'문자 세 줄과 빈 줄 네 줄을 출력합니다.',`print(${JSON.stringify(blank)})`,fixed(blank),[],'','각 문자 사이에 빈 줄이 두 줄 있어야 합니다.');
 const strings=[['봄','여름','가을','겨울'],['A','B','C','D'],['1','22','333','4444'],['hello world','good morning','see you','good bye'],['같음','다름','다름','같음'],['가','나','다','라']];
 // Rotate four inputs rather than reverse: the same four input/output operations.
 const order=s.cls%2?[2,3,0,1]:[3,0,1,2];
 add('네 문자열 순서 바꾸기',`문자열 4개를 한 줄에 하나씩 입력받아 ${order.map(i=>i+1).join('번째, ')}번째 입력 순서로 한 줄에 하나씩 출력하세요.`,'문자 또는 문자열 4개가 한 줄씩 주어집니다.','지정한 순서로 문자열을 한 줄에 하나씩 출력합니다.',`a = input()\nb = input()\nc = input()\nd = input()\n${order.map(i=>`print(${['a','b','c','d'][i]})`).join('\n')}`,strings.map(x=>({input:x.join('\n'),output:order.map(i=>x[i]).join('\n')})));
 const numbers=[10,0,s.div-s.add,7*s.div-s.add,100,-s.add,-s.add-1];
 add('더한 뒤 몫 출력',`정수 하나를 입력받아 ${s.add}을 먼저 더한 후, 그 결과를 ${s.div}로 나눈 몫을 출력하세요. +와 // 연산자를 사용하세요.`,'정수 1개가 주어집니다.','먼저 덧셈을 하고 나눗셈의 몫을 출력합니다.',`n = int(input())\nprint((n + ${s.add}) // ${s.div})`,numbers.map(n=>({input:String(n),output:String(Math.floor((n+s.add)/s.div))})),[{type:'operators',values:['+','//']}]);
 const [ct,x,y,z]=s.code;
 const triples=[[1,4,28],[1,3,9],[1,1,1],[1,9,10],[2,4,7],[2,9,33],[2,1,20]];
 add(ct,`${x}, ${y}, ${z}를 차례로 입력받습니다.\n${x}을 하나 올린 뒤, ${x} 1자리와 ${y} 2자리, ${z} 2자리를 이어 붙인 5자리 번호를 출력하세요.\n${y}이나 ${z}가 1~9이면 앞에 0을 붙여 두 자리로 만드세요.\n\n[[if를 사용하지 않고 풀어야 합니다.]]`,`${x}: 1~2, ${y}: 1~9, ${z}: 1~33인 정수 세 개가 한 줄씩 주어집니다.`,'설명에 따라 만든 5자리 번호를 출력합니다.','first = int(input())\nsecond = int(input())\nthird = int(input())\nprint((first + 1) * 10000 + second * 100 + third)',triples.map(t=>({input:t.join('\n'),output:String((t[0]+1)*10000+t[1]*100+t[2])})),[{type:'forbidden_keywords',values:['if']}],'first = int(input())\nsecond = int(input())\nthird = int(input())\n');
 const natural={1:['사과','달콤','시장'],2:['민수','서울','독서'],4:['여름','맑음','수영'],5:['피자','이탈리아','맛나식당'],6:['가방','파랑','교실'],7:['토끼','당근','숲'],8:['어린왕자','생텍쥐페리','중앙도서관']};
 const samples=[natural[s.cls],['cat','white','park'],['첫째','둘째','셋째'],['hello world','deep blue','old tree'],['봄','여름','가을'],['A','B','C']];
 add('세 입력 재배치 출력',`${s.fields.join(', ')}를 차례로 한 줄에 하나씩 입력받습니다. ${s.perm.map(i=>s.fields[i]).join(', ')} 순서로 바꾸고 각 값 사이에 ${JSON.stringify(s.sep)}를 넣어 한 줄에 출력하세요.`,s.fields.map((v,i)=>`${i+1}번째 줄: ${v}`).join('\n'),s.perm.map(i=>s.fields[i]).join(s.sep),s.names.map(n=>`${n} = input()`).join('\n')+`\nprint(${s.perm.map(i=>s.names[i]).join(` + ${JSON.stringify(s.sep)} + `)})`,samples.map(t=>({input:t.join('\n'),output:s.perm.map(i=>t[i]).join(s.sep)})),[],s.names.map(n=>`${n} = `).join('\n')+'\n','','');
 const mult=[2*s.divisor,2*s.divisor+1,0,-3*s.divisor,-s.divisor+1,10*s.divisor,10*s.divisor+1];
 add(`${s.divisor}의 배수 판정`,`정수 n을 입력받아 ${s.divisor}의 배수이면 YES, 아니면 NO를 출력하세요.`,'정수 1개가 주어집니다.','YES 또는 NO를 출력합니다.',`n = int(input())\nif n % ${s.divisor} == 0:\n    print("YES")\nelse:\n    print("NO")`,mult.map(n=>({input:String(n),output:n%s.divisor===0?'YES':'NO'})),[],'n = \nif :\n    print()\nelse:\n    print()');
 const v=s.variable, hi=`${s.high} 이상`,lo=`${s.low} 이상`;
 add('두 기준으로 값 분류',`변수 ${v}에는 정수 ${s.low}가 저장되어 있습니다.\nif, elif, else를 사용하여 다음 조건에 맞게 출력하세요.\n- ${v}가 ${s.high} 이상이면 [[${hi}]]\n- 그렇지 않고 ${s.low} 이상이면 [[${lo}]]\n- 두 조건에 모두 해당하지 않으면 [[그 외]]\n큰 기준인 ${s.high}부터 차례대로 확인하세요.`,noInput,`${hi}, ${lo}, 그 외 중 하나를 출력합니다.`,`${v} = ${s.low}\nif ${v} >= ${s.high}:\n    print("${hi}")\nelif ${v} >= ${s.low}:\n    print("${lo}")\nelse:\n    print("그 외")`,fixed(lo),[{type:'conditional_ladder',variable:v,branches:[{value:s.high,output:hi,operator:'>='},{value:s.low,output:lo,operator:'>='}],elseOutput:'그 외'}],`${v} = ${s.low}\nif :\n    print()`);
 const repeated=s.token.repeat(s.repeat);
 add('문자열 묶음 여러 줄 출력',`for 반복문과 * 연산자를 사용하여 ${JSON.stringify(s.token)}를 공백 없이 ${s.repeat}번 이어 붙인 문자열을 ${s.lines}줄 출력하세요.`,noInput,`${repeated}를 ${s.lines}줄 출력합니다.`,`for i in range(${s.lines}):\n    print(${JSON.stringify(s.token)} * ${s.repeat})`,fixed(Array(s.lines).fill(repeated).join('\n')),[{type:'for_range'},{type:'operators',values:['*']}],'for i in range():\n    print()');
 const defs=`a = [${s.a.join(', ')}]\nb = ${JSON.stringify(s.b)}\nc = ${JSON.stringify(s.c)}\n`;
 const result=(s.b[s.bi]+s.c.at(-1)).repeat(s.a[s.ai])+'\n'+s.c.slice(0,s.slice)+s.b.slice(-3);
 add('인덱싱과 슬라이싱 결합',`${defs}\n인덱싱과 슬라이싱을 사용하여 다음 결과를 한 줄에 하나씩 출력하세요.\n1. b의 ${s.bi+1}번째 문자와 c의 마지막 문자를 결합한 뒤, a의 ${s.ai+1}번째 요소만큼 반복\n2. c의 처음 ${s.slice}개 문자를 슬라이싱하고, b의 마지막 세 문자를 슬라이싱한 후 결합`,noInput,result,defs+`print((b[${s.bi}] + c[-1]) * a[${s.ai}])\nprint(c[:${s.slice}] + b[-3:])`,fixed(result),[{type:'indexing',minCount:3},{type:'slicing',minCount:2},{type:'operators',values:['+','*']}],defs,'인덱싱하거나 슬라이싱한 후 +로 결합할 수 있습니다.');
}
function quote(x){return `'${String(x).replaceAll("'","''")}'`;}
function sql(problems=all){
 const lines=['begin;'];
 for(const bookId of new Set(problems.map(p=>p.bookId))) {
  const cls=Number(bookId.split('-')[1]);
  lines.push(`insert into public.problem_books (id,title,description,sort_order,is_published) values (${quote(bookId)},${quote(`수행평가 ${cls}반(2차)`)},${quote('3반 2차와 같은 개념 범위와 유사한 난이도로 구성한 10문항. 1~5번은 1점 묶음, 6~10번은 2점 묶음.')},${200+cls},false);`);
 }
 for(const p of problems){
  lines.push(`insert into public.problems (id,book_id,title,statement,input_description,output_description,starter_code,hint,sort_order,is_published,code_requirements,time_limit_ms,memory_limit_mb) values (${[p.id,p.bookId,p.title,p.statement,p.inputDescription,p.outputDescription,p.starterCode,p.hint].map(quote).join(',')},${p.order},false,${quote(JSON.stringify(p.requirements))}::jsonb,2000,128);`);
  p.cases.forEach((t,i)=>lines.push(`insert into public.test_cases (problem_id,input,expected_output,is_sample,score,sort_order) values (${quote(p.id)},${quote(t.input)},${quote(t.output)},${i===0},1,${i+1});`));
 }
 lines.push('commit;');return lines.join('\n');
}
if(require.main===module){
 fs.writeFileSync(path.join(__dirname,'../data/evaluation-second.json'),JSON.stringify(all,null,2)+'\n');
 fs.writeFileSync(path.join(__dirname,'../supabase/evaluation_second.sql'),sql());
 const review=['# 나머지 7개 반 2차 수행평가 문제','', '3반 2차 기준의 10문항 구성. 1~5번은 1점 묶음, 6~10번은 2점 묶음. 문제집과 문항은 비공개로 등록.',''];
 for(const s of specs){
  review.push(`## ${s.cls}반(2차)`,'');
  for(const p of all.filter(p=>p.bookId===`평가-${String(s.cls).padStart(2,'0')}-02`)){
   review.push(`### ${p.order}. ${p.title}`,'',p.statement,'','입력: '+p.inputDescription,'','출력: '+p.outputDescription,'');
   if(p.starterCode)review.push('기본 코드:','```python',p.starterCode,'```','');
   if(p.hint)review.push('힌트: '+p.hint,'');
   review.push(`테스트 ${p.cases.length}개 (공개 예시 1개).`,'');
  }
 }
 fs.writeFileSync(path.join(__dirname,'../data/evaluation-second-review.md'),review.join('\n'));
 console.log(JSON.stringify({problems:all.length,cases:all.reduce((n,p)=>n+p.cases.length,0)}));
}
module.exports={all,sql};
