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

test("unanswered input settles with the existing TimeLimitError", { timeout: 3000 }, async () => {
  const console = createConsole(() => new Promise(() => {}));
  await runPythonWithSkulpt("value = input()", console.callbacks, { timeLimitMs: 60 });
  assert.deepEqual(console.errors, ["TimeLimitError: Program exceeded run time limit. on line 1"]);
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
  assert.match(console.errors[0], /^TimeLimitError: Program exceeded run time limit\. on line \d+$/);
});

test("an already cancelled run does not start", async () => {
  const controller = new AbortController();
  controller.abort();
  const console = createConsole();
  await runPythonWithSkulpt("print('should not run')", console.callbacks, { signal: controller.signal });
  assert.deepEqual(console.output, []);
  assert.deepEqual(console.errors, []);
});
