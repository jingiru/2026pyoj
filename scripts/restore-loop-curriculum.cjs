// Restore the original fixed-list and while exercises without changing their IDs.
const { rows } = require('./loop-curriculum.cjs');
const quote = value => "'" + String(value).replace(/'/g, "''") + "'";
const commands = ['begin;'];
for (const row of rows) {
  commands.push(`update problems set statement=${quote(row.statement)}, input_description=${quote(row.inputDescription)}, output_description=${quote(row.output)}, starter_code=${quote(row.starter)}, hint=${quote(row.hint)} where id=${quote(row.id)};`);
  commands.push(`delete from test_cases where problem_id=${quote(row.id)};`);
  row.cases.forEach((item, index) => commands.push(`insert into test_cases (problem_id,input,expected_output,is_sample,sort_order) values (${quote(row.id)},${quote(item.input)},${quote(item.output)},${index === 0},${index + 1});`));
  commands.push(`update reference_solutions set code=${quote(row.solution)}, explanation=${quote(row.hint)} where problem_id=${quote(row.id)} and is_primary=true;`);
}
commands.push('commit;');
const sql = commands.join('\n');
module.exports = { sql };
if (require.main === module) require('node:fs').writeFileSync(require('node:path').join(__dirname, '../supabase/loop_test_cases.sql'), sql);
