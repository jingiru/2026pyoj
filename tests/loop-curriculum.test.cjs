const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const { rows } = require('../scripts/loop-curriculum.cjs');
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(createRequire(filename), mod, mod.exports);
  return mod.exports;
}
const { checkCodeRequirements } = load('lib/code-requirements.ts');
const { runPythonWithSkulpt } = load('lib/skulpt-runner.ts');
test('all ten reference solutions satisfy requirements and produce expected outputs', async () => {
  for (const row of rows) {
    assert.equal(checkCodeRequirements(row.solution, row.requirements).passed, true, row.id);
    for (const example of row.cases) {
      let actual = '', errors = [];
      const inputs = example.input.split('\n');
      await runPythonWithSkulpt(row.solution, { output: value => actual += value, error: value => errors.push(value), input: async () => inputs.shift() ?? '' });
      assert.deepEqual(errors, [], row.id);
      assert.equal(actual.trim(), example.output, row.id);
    }
  }
});
test('while requirements reject hardcoded output, comments, strings, unrelated loops and for alternatives', () => {
  const requirements = rows[5].requirements;
  for (const code of ["print('1\\n2\\n3\\n4\\n5')", "# while True:\nprint(1)", "print('while')", "while False:\n    pass\nprint(1)", "while False:\n    print(0)\nprint('1\\n2\\n3\\n4\\n5')", "for n in range(1, 6):\n    print(n)", "while False:\n    print(0)\nprint([n for n in range(5)])"]) {
    assert.equal(checkCodeRequirements(code, requirements).passed, false, code);
  }
  assert.equal(checkCodeRequirements('a = 10\nwhile a > 3:\n    a -= 1\nprint(a)', rows[7].requirements).passed, true);
});
test('list requirements reject unrolled prints and range without list indexing', () => {
  for (const code of ['a = [1, 2, 3]\nprint(a[0])\nprint(a[1])\nprint(a[2])', 'for i in range(1, 4):\n    print(i)']) {
    assert.equal(checkCodeRequirements(code, rows[0].requirements).passed, false);
  }
});
