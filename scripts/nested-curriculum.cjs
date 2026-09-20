const fs = require('node:fs');
const path = require('node:path');

const curriculum = require('../data/nested-curriculum.json');

function quote(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function sql() {
  const lines = [
    'begin;',
    `insert into problem_books (id, title, description, sort_order, is_published) values (${quote(curriculum.book.id)}, ${quote(curriculum.book.title)}, ${quote(curriculum.book.description)}, ${curriculum.book.order}, true) on conflict (id) do update set title = excluded.title, description = excluded.description, sort_order = excluded.sort_order, is_published = excluded.is_published;`
  ];

  for (const problem of curriculum.problems) {
    lines.push(
      `insert into problems (id, book_id, title, statement, input_description, output_description, starter_code, hint, sort_order, is_published, code_requirements) values (${quote(problem.id)}, ${quote(problem.bookId)}, ${quote(problem.title)}, ${quote(problem.statement)}, ${quote(problem.inputDescription)}, ${quote(problem.outputDescription)}, ${quote(problem.starterCode)}, ${quote(problem.hint)}, ${problem.order}, true, ${quote(JSON.stringify(problem.requirements))}::jsonb) on conflict (id) do update set book_id = excluded.book_id, title = excluded.title, statement = excluded.statement, input_description = excluded.input_description, output_description = excluded.output_description, starter_code = excluded.starter_code, hint = excluded.hint, sort_order = excluded.sort_order, is_published = excluded.is_published, code_requirements = excluded.code_requirements;`,
      `delete from test_cases where problem_id = ${quote(problem.id)};`,
      `delete from reference_solutions where problem_id = ${quote(problem.id)};`
    );
    problem.cases.forEach((testCase, index) => {
      lines.push(`insert into test_cases (problem_id, input, expected_output, is_sample, sort_order) values (${quote(problem.id)}, ${quote(testCase.input)}, ${quote(testCase.output)}, ${index === 0}, ${index + 1});`);
    });
    lines.push(`insert into reference_solutions (problem_id, code, explanation) values (${quote(problem.id)}, ${quote(problem.solution)}, ${quote(problem.hint)});`);
  }

  lines.push('commit;', '');
  return lines.join('\n');
}

if (require.main === module) {
  const target = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../supabase/nested_curriculum.sql');
  fs.writeFileSync(target, sql(), 'utf8');
}

module.exports = { curriculum, sql };
