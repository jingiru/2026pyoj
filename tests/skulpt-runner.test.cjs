const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the real TypeScript runner and installed Skulpt without another test dependency.
const runnerPath = path.resolve(__dirname, "../lib/skulpt-runner.ts");
const compiled = ts.transpileModule(readFileSync(runnerPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const runnerModule = { exports: {} };
new Function("require", "module", "exports", compiled)(
  createRequire(runnerPath), runnerModule, runnerModule.exports
);
const { runPythonWithSkulpt } = runnerModule.exports;

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
  await runPythonWithSkulpt("a = int(input())\nb = int(input())\nprint(a + b)", console.callbacks);
  assert.equal(console.output.join(""), "10\n");
  assert.deepEqual(console.errors, []);
});

test("unanswered input reports a Korean time limit explanation", { timeout: 3000 }, async () => {
  const console = createConsole(() => new Promise(() => {}));
  await runPythonWithSkulpt("value = input()", console.callbacks, { timeLimitMs: 60 });
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
  await runPythonWithSkulpt(
    "try:\n    value = input()\nexcept:\n    print('caught')\nprint('old run')",
    console.callbacks,
    { signal: controller.signal, timeLimitMs: 1000 }
  );
  assert.deepEqual(console.errors, []);
  assert.deepEqual(console.output, []);

  const nextConsole = createConsole();
  await runPythonWithSkulpt("print('new run')", nextConsole.callbacks);
  provideInput("late input");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(console.output, []);
  assert.equal(nextConsole.output.join(""), "new run\n");
  assert.deepEqual(nextConsole.errors, []);
});

test("busy loops yield so the stop action can terminate them", { timeout: 3000 }, async () => {
  const controller = new AbortController();
  const console = createConsole();
  const timer = setTimeout(() => controller.abort(), 10);
  try {
    await runPythonWithSkulpt(
      "try:\n    while True:\n        pass\nexcept:\n    print('caught')\nprint('continued')",
      console.callbacks,
      { signal: controller.signal, timeLimitMs: 1500 }
    );
    assert.equal(controller.signal.aborted, true, "the stop callback must run before the time limit");
    assert.deepEqual(console.errors, []);
    assert.deepEqual(console.output, []);
  } finally {
    clearTimeout(timer);
  }
});

test("busy loops still report the time limit when not stopped", async () => {
  const console = createConsole();
  await runPythonWithSkulpt("while True:\n    pass", console.callbacks, { timeLimitMs: 80 });
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
    await runPythonWithSkulpt(code, console.callbacks);
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
  await runPythonWithSkulpt("print('should not run')", console.callbacks, { signal: controller.signal });
  assert.deepEqual(console.output, []);
  assert.deepEqual(console.errors, []);
});
