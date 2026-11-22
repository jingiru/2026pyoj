const assert = require("node:assert/strict");
const { test } = require("node:test");
require('./python-worker-harness.cjs');

const runnerModule = { exports: require('./load-typescript.cjs')('lib/python-runner.ts') };
const { runPython } = runnerModule.exports;

function createConsole(input = async () => "") {
  const output = [];
  const errors = [];
  return {
    output,
    errors,
    callbacks: { output: (text) => output.push(text), error: (text) => errors.push(text), input }
  };
}

test("ordinary output and multiple inputs still work", async () => {
  const inputs = ["3", "7"];
  const console = createConsole(async () => inputs.shift());
  await runPython("a = int(input())\nb = int(input())\nprint(a + b)", console.callbacks);
  assert.equal(console.output.join(""), "10\n");
  assert.deepEqual(console.errors, []);
});

test("unanswered input reports a Korean time limit explanation", { timeout: 15000 }, async () => {
  const console = createConsole(() => new Promise(() => {}));
  await runPython("value = input()", console.callbacks, { timeLimitMs: 60 });
  assert.equal(console.errors.length, 1);
  assert.match(console.errors[0], /^코드 1번째 줄을 확인해 주세요\./);
  assert.match(console.errors[0], /실행 시간이 너무 길어 중단되었습니다/);
});

test("stopping input never resumes cancelled code, even if Python catches errors", async () => {
  const controller = new AbortController();
  let provideInput;
  const console = createConsole(() => new Promise((resolve) => {
    provideInput = resolve;
    setTimeout(() => controller.abort(), 10);
  }));
  await runPython(
    "try:\n    value = input()\nexcept:\n    print('caught')\nprint('old run')",
    console.callbacks,
    { signal: controller.signal, timeLimitMs: 1000 }
  );
  assert.deepEqual(console.errors, []);
  assert.deepEqual(console.output, []);

  const nextConsole = createConsole();
  await runPython("print('new run')", nextConsole.callbacks);
  provideInput("late input");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(console.output, []);
  assert.equal(nextConsole.output.join(""), "new run\n");
  assert.deepEqual(nextConsole.errors, []);
});

test("busy loops can be stopped after execution has started", { timeout: 15000 }, async () => {
  const controller = new AbortController();
  const console = createConsole();
  console.callbacks.output = text => { console.output.push(text); controller.abort(); };
    await runPython(
      "print('started')\ntry:\n    while True:\n        pass\nexcept:\n    print('caught')\nprint('continued')",
      console.callbacks,
      { signal: controller.signal, timeLimitMs: 1500 }
    );
    assert.equal(controller.signal.aborted, true, "the stop callback must run before the time limit");
    assert.deepEqual(console.errors, []);
    assert.equal(console.output.join('').trimEnd(), 'started');
});

test("eval supports Python locals, literals and interactive Unicode input", async () => {
  const console = createConsole(async () => '[1, 2, 3]');
  await runPython("items = eval(input('입력: '))\ndef f():\n    x = 7\n    return eval('x * 2')\nprint(sum(items), f(), eval('1 / 2'))", console.callbacks);
  assert.deepEqual(console.errors, []);
  assert.equal(console.output.join(''), '6 14 0.5\n');
});

test("NumPy is available without an external CDN at execution time", async () => {
  const console = createConsole();
  await runPython("import numpy as np\nprint(np.array([1, 2, 3]).sum())", console.callbacks);
  assert.deepEqual(console.errors, []);
  assert.equal(console.output.join(''), '6\n');
});

test("input preserves empty strings and Unicode spanning multiple transfer chunks", async () => {
  const value = '가🙂'.repeat(20000);
  const inputs = ['', value];
  const prompts = [];
  const console = createConsole(async prompt => { prompts.push(prompt); return inputs.shift(); });
  await runPython("a = input('빈 값: ')\nb = input('긴 값: ')\nprint(repr(a), len(b), b[-2:])", console.callbacks);
  assert.deepEqual(console.errors, []);
  assert.deepEqual(prompts, ['빈 값: ', '긴 값: ']);
  assert.equal(console.output.join(''), "'' 40000 가🙂\n");
});

test("executions do not retain variables or builtins from previous runs", async () => {
  const first = createConsole();
  await runPython("import builtins\nbuiltins.secret = 123\nx = 7", first.callbacks);
  const second = createConsole();
  await runPython("import builtins\nprint(hasattr(builtins, 'secret'), 'x' in globals())", second.callbacks);
  assert.deepEqual(second.errors, []);
  assert.equal(second.output.join(''), 'False False\n');
});

test("busy loops still report the time limit when not stopped", async () => {
  const console = createConsole();
  await runPython("while True:\n    pass", console.callbacks, { timeLimitMs: 80 });
  assert.equal(console.errors.length, 1);
  assert.match(console.errors[0], /^코드 \d+번째 줄을 확인해 주세요\./);
  assert.match(console.errors[0], /실행 시간이 너무 길어 중단되었습니다/);
});

test("Python errors show Korean guidance with the actual failing line", async () => {
  const examples = [
    ["a = 1\nprint(b)", 2, /'b'라는 변수 또는 함수는 정의되지 않았습니다/],
    ['print(1)\nprint(",1"2)', 2, /문법이 올바르지 않습니다/],
    ["print(1)\nprint(1 / 0)", 2, /0으로 나눌 수 없습니다/],
    ["print(1)\nprint(int('abc'))", 2, /처리할 수 없는 값입니다/],
    ["print(1)\nprint(1 + 'a')", 2, /자료형/],
    ["items = [1]\nprint(items[3])", 2, /범위를 벗어난 위치/],
    ["items = {}\nprint(items['a'])", 2, /딕셔너리에 없는 키/],
    ["if True:\nprint(1)", 2, /들여쓰기/]
  ];
  for (const [code, line, explanation] of examples) {
    const console = createConsole();
    await runPython(code, console.callbacks);
    assert.equal(console.errors.length, 1, code);
    assert.ok(console.errors[0].startsWith(`코드 ${line}번째 줄을 확인해 주세요.\n`), console.errors[0]);
    assert.match(console.errors[0], explanation);
  }
});

test("unknown errors keep diagnostics and do not invent a line number", () => {
  const { formatPythonError } = runnerModule.exports;
  assert.equal(formatPythonError("CustomError: details on line 7"), "코드 7번째 줄을 확인해 주세요.\n코드를 실행하는 중 오류가 발생했습니다.\n오류 상세: CustomError: details on line 7");
  assert.ok(!formatPythonError(new Error("unexpected failure")).includes("번째 줄"));
});

test("an already cancelled run does not start", async () => {
  const controller = new AbortController();
  controller.abort();
  const console = createConsole();
  await runPython("print('should not run')", console.callbacks, { signal: controller.signal });
  assert.deepEqual(console.output, []);
  assert.deepEqual(console.errors, []);
});

test("the basic engine runs without SharedArrayBuffer or Pyodide initialization", async () => {
  const shared = global.SharedArrayBuffer;
  try {
    global.SharedArrayBuffer = undefined;
    const console = createConsole(async () => '7');
    await runPython('print(int(input()) * 2)', console.callbacks);
    assert.deepEqual(console.errors, []);
    assert.equal(console.output.join(''), '14\n');
  } finally { global.SharedArrayBuffer = shared; }
});

test("automatic extension selection never repeats output or requests input twice", async () => {
  let reads = 0;
  const console = createConsole(async () => { reads++; return '1 + 2'; });
  await runPython("print('before')\ntext = input()\nprint(eval(text))", console.callbacks);
  assert.deepEqual(console.errors, []);
  assert.equal(console.output.join(''), 'before\n3\n');
  assert.equal(reads, 1);
});

test("manual and problem-fixed Pyodide preserve input timeout and cancellation", async () => {
  const waiting = createConsole(() => new Promise(() => {}));
  await runPython('value = input()', waiting.callbacks, { engine: 'pyodide', timeLimitMs: 80 });
  assert.match(waiting.errors[0], /코드 1번째 줄/);
  assert.match(waiting.errors[0], /실행 시간이 너무 길어/);
  const controller = new AbortController();
  const stopped = createConsole(async () => { controller.abort(); return 'late'; });
  await runPython("try:\n    input()\nexcept:\n    print('caught')\nprint('continued')", stopped.callbacks,
    { problemCode: '# pyoj: engine=pyodide', signal: controller.signal });
  assert.deepEqual(stopped.errors, []);
  assert.deepEqual(stopped.output, []);
});

test("both engines enforce busy-loop timeouts without catching cancellation in Python", async () => {
  const console = createConsole();
  await runPython('while True:\n    pass', console.callbacks, { engine: 'pyodide', timeLimitMs: 80 });
  assert.match(console.errors[0], /실행 시간이 너무 길어/);
});
