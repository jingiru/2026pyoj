const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const curriculum = require('../data/nested-curriculum.json');

function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(createRequire(filename), mod, mod.exports);
  return mod.exports;
}

const { checkCodeRequirements, hasPotentialInfiniteLoop } = load('lib/code-requirements.ts');
const { runPythonWithSkulpt } = load('lib/skulpt-runner.ts');

test('nested curriculum has two groups of ten with the requested difficulty mix', () => {
  for (const prefix of ['11-1-', '11-2-']) {
    const problems = curriculum.problems.filter((problem) => problem.id.startsWith(prefix));
    assert.equal(problems.length, 10);
    assert.deepEqual(
      problems.reduce((counts, problem) => ({ ...counts, [problem.difficulty]: (counts[problem.difficulty] ?? 0) + 1 }), {}),
      { '많이 쉬움': 3, '좀 쉬움': 3, '보통': 2, '어려움': 2 }
    );
  }
});

test('all nested reference solutions satisfy requirements and expected outputs', async () => {
  for (const problem of curriculum.problems) {
    assert.equal(checkCodeRequirements(problem.solution, problem.requirements).passed, true, problem.id);
    if (problem.id.startsWith('11-2-')) {
      assert.equal(hasPotentialInfiniteLoop(problem.solution), false, problem.id);
    }
    for (const testCase of problem.cases) {
      let actual = '';
      const errors = [];
      const inputs = testCase.input.split('\n');
      await runPythonWithSkulpt(problem.solution, {
        output: (value) => actual += value,
        error: (value) => errors.push(value),
        input: async () => inputs.shift() ?? ''
      }, { timeLimitMs: 2000 });
      assert.deepEqual(errors, [], problem.id);
      assert.equal(actual.trim(), testCase.output, problem.id);
    }
  }
});

test('nested structure requirements reject shortcuts', () => {
  assert.equal(checkCodeRequirements("for i in range(10):\n    print(i)", [{ type: 'for_if' }]).passed, false);
  assert.equal(checkCodeRequirements("while True:\n    print(1)\n    break", [{ type: 'while_true_if_break' }]).passed, false);
  assert.equal(checkCodeRequirements("n = 0\nwhile True:\n    n += 1\n    if n == 5:\n        break", [{ type: 'forbidden_augmented_assignment' }]).passed, false);
});

test('infinite-loop preflight catches beginner loop hazards', () => {
  assert.equal(hasPotentialInfiniteLoop("while True:\n    print('계속')"), true);
  assert.equal(hasPotentialInfiniteLoop("n = 0\nwhile True:\n    if n == 5:\n        break"), true);
  assert.equal(hasPotentialInfiniteLoop("while True:\n    if False:\n        break"), true);
  assert.equal(hasPotentialInfiniteLoop("n = 0\nwhile True:\n    n = 1\n    if n == 5:\n        break"), true);
  assert.equal(hasPotentialInfiniteLoop("n = 0\nwhile True:\n    n = n + 0\n    if n == 5:\n        break"), true);
  assert.equal(hasPotentialInfiniteLoop("n = 0\nwhile True:\n    n = n + 1\n    if n == 5:\n        break"), false);
  assert.equal(hasPotentialInfiniteLoop("while True:\n    word = input()\n    if word == '그만':\n        break"), false);
});
