const assert = require('node:assert/strict');
const { test } = require('node:test');
const { selectPythonEngine, getProblemEngine, withProblemEngine } = require('./load-typescript.cjs')('lib/python-engine.ts');

test('basic classroom code stays on the fast engine, ignoring comments and strings', () => {
  for (const code of [
    "a = int(input())\nprint(a * 2)",
    "for n in range(5):\n    if n % 2: print(n)",
    "# eval(input())\nprint('import numpy; eval(1)')",
    "message = '''\n# pyoj: engine=pyodide\n'''\nprint(message)",
    "import random as r, math as m\nprint(m.sqrt(r.randint(1, 4)))",
    "from math import sqrt as s\nprint(s(4))"
  ]) assert.equal(selectPythonEngine(code), 'skulpt', code);
});

test('eval references, dynamic imports, unknown modules and advanced syntax select CPython before execution', () => {
  for (const code of [
    'print(eval(input()))', 'calculate = eval\nprint(calculate("1+2"))',
    'import numpy as np', 'import math, numpy as np', 'from numpy.linalg import norm',
    'import importlib', '__import__(input())', 'from . import helper',
    'import sys', 'import os', 'print(globals())', 'exec(input())',
    'match x:\n    case 1: print(1)', 'async def f():\n    await g()',
    'print(f"{eval(x)}")'
  ]) assert.equal(selectPythonEngine(code), 'pyodide', code);
});

test('problem policy wins over student code directives and manual preference', () => {
  assert.equal(selectPythonEngine('print(1)', { engine: 'pyodide' }), 'pyodide');
  assert.equal(selectPythonEngine('# pyoj: engine=pyodide\nprint(1)'), 'pyodide');
  assert.equal(selectPythonEngine('# pyoj: engine=skulpt\nprint(1)', { problemCode: '# pyoj: engine=pyodide' }), 'pyodide');
  assert.equal(selectPythonEngine('eval(input())', { engine: 'pyodide', problemCode: '# pyoj: engine=skulpt' }), 'skulpt');
  const original = 'print(input())\n';
  const marked = withProblemEngine(original, 'pyodide');
  assert.equal(getProblemEngine(marked), 'pyodide');
  assert.equal(withProblemEngine(marked, 'auto'), original);
  assert.equal(getProblemEngine(withProblemEngine(marked, 'skulpt')), 'skulpt');
  assert.equal(withProblemEngine('x = 1 # pyoj: engine=skulpt\nprint(x)', 'auto'), 'x = 1 \nprint(x)');
});
