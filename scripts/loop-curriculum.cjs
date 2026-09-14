// Source for the ten new list/while exercises and their database update.
const rows = [];
function add(number, topic, statement, starter, solution, output, hint, inputs) {
  rows.push({ id: `6-2-${String(number).padStart(2, '0')} 반복 구조 기초(${topic})`,
    title: `반복 구조 기초(list, while) ${String(number).padStart(2, '0')}`,
    statement, starter, solution, hint, output,
    requirements: number <= 5 ? [{ type: 'for_list' }] : [{ type: 'while_loop' }, { type: 'forbidden_keywords', values: ['for'] }],
    cases: inputs || [{ input: '', output }],
    inputDescription: inputs ? '정수 n(1 이상 20 이하)이 주어집니다.' : '입력은 없습니다.' });
}
add(1, '리스트 값 출력', '리스트 a = [1, 2, 3]의 값을 for문으로 한 줄씩 출력하도록 프로그래밍하세요.', 'a = [1, 2, 3]\nfor i in :\n    print()', 'a = [1, 2, 3]\nfor i in a:\n    print(i)', '1\n2\n3', 'for i in a를 사용하면 리스트의 값을 차례로 가져옵니다.');
add(2, '리스트 문자열 출력', "리스트 a = ['apple', 'banana', 'cherry']의 문자열을 for문으로 한 줄씩 출력하도록 프로그래밍하세요.", "a = ['apple', 'banana', 'cherry']\nfor i in :\n    print()", "a = ['apple', 'banana', 'cherry']\nfor i in a:\n    print(i)", 'apple\nbanana\ncherry', '문자열이 들어 있는 리스트도 for문으로 반복할 수 있습니다.');
add(3, '리스트 값 두 배', '리스트 a = [2, 4, 6, 8, 10]의 각 값을 for문으로 가져와 2배한 값을 한 줄씩 출력하도록 프로그래밍하세요.', 'a = [2, 4, 6, 8, 10]\nfor i in :\n    print()', 'a = [2, 4, 6, 8, 10]\nfor i in a:\n    print(i * 2)', '4\n8\n12\n16\n20', '리스트에서 가져온 값에 2를 곱해 출력합니다.');
add(4, '리스트 인덱스 순회', '리스트 a = [10, 20, 30]의 값을 for문과 range(3), a[i]를 사용하여 한 줄씩 출력하도록 프로그래밍하세요.', 'a = [10, 20, 30]\nfor i in range():\n    print()', 'a = [10, 20, 30]\nfor i in range(3):\n    print(a[i])', '10\n20\n30', 'range(3)은 인덱스 0, 1, 2를 만듭니다.');
rows[3].requirements = [{ type: 'for_list' }, { type: 'for_range' }, { type: 'indexing', minCount: 1 }];
add(5, '리스트 역순 출력', '리스트 a = [10, 20, 30, 40, 50]의 값을 for문과 range(), a[i]를 사용하여 마지막 값부터 한 줄씩 출력하도록 프로그래밍하세요.', 'a = [10, 20, 30, 40, 50]\nfor i in range():\n    print()', 'a = [10, 20, 30, 40, 50]\nfor i in range(4, -1, -1):\n    print(a[i])', '50\n40\n30\n20\n10', '인덱스를 4부터 0까지 1씩 감소시킵니다.');
rows[4].requirements = [{ type: 'for_list' }, { type: 'for_range' }, { type: 'indexing', minCount: 1 }];
const restriction = '\n\n반드시 while문을 사용해야 합니다. for문과 for를 사용하는 컴프리헨션은 사용할 수 없습니다. 출력문만 나열해서 풀 수 없습니다.';
add(6, 'while 증가', 'while문을 사용하여 1부터 5까지 1씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.' + restriction, 'n = 1\nwhile :\n    print()\n    n = ', 'n = 1\nwhile n <= 5:\n    print(n)\n    n = n + 1', '1\n2\n3\n4\n5', '반복할 때마다 n을 1씩 증가시키고, n이 5 이하일 때 반복합니다.');
add(7, 'while 감소', 'n = 5에서 시작하여 while문으로 n이 3 이상인 동안 n을 출력하고 1씩 감소시키도록 프로그래밍하세요.' + restriction, 'n = 5\nwhile :\n    print()\n    n = ', 'n = 5\nwhile n >= 3:\n    print(n)\n    n = n - 1', '5\n4\n3', '현재 값을 출력한 뒤 n을 1씩 감소시킵니다.');
add(8, 'while 종료 후 값', 'a = 10에서 시작하여 while문으로 a가 3보다 큰 동안 a를 1씩 감소시키고, 반복이 끝난 뒤 a를 한 번만 출력하도록 프로그래밍하세요.' + restriction, 'a = 10\nwhile :\n    a = \nprint()', 'a = 10\nwhile a > 3:\n    a = a - 1\nprint(a)', '3', 'print(a)는 while문 바깥에 작성합니다. 반복이 끝나는 순간의 조건을 생각해보세요.');
add(9, 'while 두 칸씩 증가', 'while문을 사용하여 2부터 10까지 2씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.' + restriction, 'n = 2\nwhile :\n    print()\n    n = ', 'n = 2\nwhile n <= 10:\n    print(n)\n    n = n + 2', '2\n4\n6\n8\n10', '반복할 때마다 n에 2를 더합니다.');
add(10, 'while 입력 카운트다운', '정수 n을 입력받고, while문을 사용하여 n부터 1까지 1씩 감소하면서 한 줄씩 출력하도록 프로그래밍하세요.' + restriction, 'n = int(input())\nwhile :\n    print()\n    n = ', 'n = int(input())\nwhile n >= 1:\n    print(n)\n    n = n - 1', '입력받은 n부터 1까지 한 줄씩 출력합니다.', 'n이 1 이상인 동안 출력하고, n을 1씩 감소시킵니다.', [1, 5, 2, 10, 20].map(n => ({ input: String(n), output: Array.from({length:n}, (_,i)=>n-i).join('\n') })));
// Keep the same concepts while allowing five independent input/output checks.
const numericLists = [[1, 2, 3], [0, 0, 0], [-3, -2, -1], [10, 20, 30], [5, -5, 0]];
const longLists = [[2, 4, 6, 8, 10], [0, 0, 0, 0, 0], [-5, -4, -3, -2, -1], [10, 20, 30, 40, 50], [3, -2, 0, 7, -9]];
const wordLists = [['apple', 'banana', 'cherry'], ['a', 'b', 'c'], ['hello world', 'Python', 'list'], ['사과', '바나나', '체리'], ['same', 'same', 'same']];
for (let index = 0; index < 5; index++) {
  const row = rows[index];
  const lists = index === 1 ? wordLists : index === 2 || index === 4 ? longLists : numericLists;
  const size = lists[0].length;
  const listCode = `a = [${Array(size).fill(index === 1 ? 'input()' : 'int(input())').join(', ')}]`;
  const loop = index < 3 ? 'for i in a:' : index === 3 ? `for i in range(${size}):` : `for i in range(${size - 1}, -1, -1):`;
  const expression = index === 2 ? 'i * 2' : index < 3 ? 'i' : 'a[i]';
  row.statement = `${index === 1 ? '문자열' : '정수'} ${size}개를 입력받아 리스트 a에 저장하세요. ` + [
    'for문으로 리스트의 값을 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.',
    'for문으로 리스트의 문자열을 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.',
    'for문으로 각 값을 가져와 2배한 값을 한 줄씩 출력하도록 프로그래밍하세요.',
    'for문과 range(3), a[i]를 사용하여 입력 순서대로 한 줄씩 출력하도록 프로그래밍하세요.',
    'for문과 range(), a[i]를 사용하여 마지막 값부터 한 줄씩 출력하도록 프로그래밍하세요.'
  ][index];
  row.inputDescription = index === 1 ? '문자열 3개가 한 줄에 하나씩 주어집니다. 문자열 안의 공백도 그대로 저장합니다.' : `정수 ${size}개(-100 이상 100 이하)가 한 줄에 하나씩 주어집니다.`;
  row.starter = `${listCode}\n${index < 3 ? 'for i in :' : 'for i in range():'}\n    print()`;
  row.solution = `${listCode}\n${loop}\n    print(${expression})`;
  row.cases = lists.map(values => ({ input: values.join('\n'), output: (index === 4 ? [...values].reverse() : index === 2 ? values.map(value => value * 2) : values).join('\n') }));
  row.output = index === 2 ? '각 입력값을 2배하여 입력 순서대로 한 줄씩 출력합니다.' : index === 4 ? '리스트의 값을 입력 순서의 역순으로 한 줄씩 출력합니다.' : '리스트의 값을 입력 순서대로 한 줄씩 출력합니다.';
}
function sequence(start, end, step) {
  const values = [];
  for (let value = start; step > 0 ? value <= end : value >= end; value += step) values.push(value);
  return values.join('\n');
}
Object.assign(rows[5], {
  statement: '정수 n을 입력받고, while문을 사용하여 1부터 n까지 1씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요.' + restriction,
  inputDescription: '정수 n(1 이상 20 이하)이 주어집니다.',
  starter: 'n = int(input())\ni = 1\nwhile :\n    print()\n    i = ',
  solution: 'n = int(input())\ni = 1\nwhile i <= n:\n    print(i)\n    i = i + 1',
  hint: 'i를 1에서 시작하여 n 이하인 동안 출력하고 1씩 증가시킵니다.',
  output: '1부터 n까지 한 줄씩 출력합니다.',
  cases: [5, 1, 2, 10, 20].map(n => ({ input: String(n), output: sequence(1, n, 1) }))
});
Object.assign(rows[6], {
  statement: '정수 n을 입력받고, while문으로 n이 3 이상인 동안 n을 출력하고 1씩 감소시키도록 프로그래밍하세요.' + restriction,
  inputDescription: '정수 n(3 이상 20 이하)이 주어집니다.',
  starter: 'n = int(input())\nwhile :\n    print()\n    n = ',
  solution: 'n = int(input())\nwhile n >= 3:\n    print(n)\n    n = n - 1',
  output: 'n부터 3까지 한 줄씩 출력합니다.',
  cases: [5, 3, 4, 10, 20].map(n => ({ input: String(n), output: sequence(n, 3, -1) }))
});
Object.assign(rows[7], {
  statement: '정수 a와 b를 입력받고, while문으로 a가 b보다 큰 동안 a를 1씩 감소시키세요. 반복이 끝난 뒤 a를 한 번만 출력하도록 프로그래밍하세요.' + restriction,
  inputDescription: '첫째 줄에 정수 a, 둘째 줄에 정수 b가 주어집니다. -20 ≤ b ≤ a ≤ 20입니다.',
  starter: 'a = int(input())\nb = int(input())\nwhile :\n    a = \nprint()',
  solution: 'a = int(input())\nb = int(input())\nwhile a > b:\n    a = a - 1\nprint(a)',
  output: '반복이 끝난 뒤 a의 값을 한 번만 출력합니다.',
  cases: [[10, 3], [3, 3], [4, 3], [0, -5], [20, 0]].map(([a, b]) => ({ input: `${a}\n${b}`, output: String(b) }))
});
Object.assign(rows[8], {
  statement: '정수 n을 입력받고, while문으로 2부터 n 이하까지 2씩 증가하면서 한 줄씩 출력하도록 프로그래밍하세요. n이 홀수이면 n보다 작은 마지막 짝수까지 출력합니다.' + restriction,
  inputDescription: '정수 n(2 이상 20 이하)이 주어집니다.',
  starter: 'n = int(input())\ni = 2\nwhile :\n    print()\n    i = ',
  solution: 'n = int(input())\ni = 2\nwhile i <= n:\n    print(i)\n    i = i + 2',
  hint: 'i를 2에서 시작하여 n 이하인 동안 출력하고 2씩 증가시킵니다.',
  output: '2부터 n 이하인 짝수를 한 줄씩 출력합니다.',
  cases: [10, 2, 3, 9, 20].map(n => ({ input: String(n), output: sequence(2, n, 2) }))
});
const quote = value => "'" + String(value).replace(/'/g, "''") + "'";
function sql() {
  const commands = ['begin;', "update problems set id = regexp_replace(id, '^6-2-', '6-3-'), sort_order = sort_order + 100 where book_id = '06 반복 구조' and id like '6-2-% 반복 구조 응용%';", "update problems set title = '반복 구조 기초(for) ' || lpad((sort_order - 100)::text, 2, '0') where book_id = '06 반복 구조' and sort_order between 101 and 110;"];
  for (const row of rows) {
    commands.push(`insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values (${[row.id, '06 반복 구조', row.title, row.statement, row.inputDescription, row.output, row.starter, row.hint].map(quote).join(', ')}, ${200 + rows.indexOf(row) + 1}, true, ${quote(JSON.stringify(row.requirements))}::jsonb);`);
    row.cases.forEach((test, i) => commands.push(`insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values (${quote(row.id)}, ${quote(test.input)}, ${quote(test.output)}, ${i === 0}, ${i + 1});`));
    commands.push(`insert into reference_solutions (problem_id, code, explanation) values (${quote(row.id)}, ${quote(row.solution)}, ${quote(row.hint)});`);
  }
  commands.push('commit;');
  return commands.join('\n');
}
function testCaseUpdateSql() {
  const commands = ['begin;'];
  for (const row of rows) {
    commands.push(`update problems set statement=${quote(row.statement)}, input_description=${quote(row.inputDescription)}, output_description=${quote(row.output)}, starter_code=${quote(row.starter)}, hint=${quote(row.hint)} where id=${quote(row.id)};`);
    commands.push(`delete from test_cases where problem_id=${quote(row.id)};`);
    row.cases.forEach((item, index) => commands.push(`insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values (${quote(row.id)},${quote(item.input)},${quote(item.output)},${index === 0},${index + 1});`));
    commands.push(`update reference_solutions set code=${quote(row.solution)}, explanation=${quote(row.hint)} where problem_id=${quote(row.id)} and is_primary=true;`);
  }
  return [...commands, 'commit;'].join('\n');
}
module.exports = { rows, sql, testCaseUpdateSql };
if (require.main === module) {
  const fs = require('node:fs'), path = require('node:path');
  fs.writeFileSync(path.join(__dirname, '../supabase/loop_curriculum.sql'), sql());
  fs.writeFileSync(path.join(__dirname, '../supabase/loop_test_cases.sql'), testCaseUpdateSql());
}
