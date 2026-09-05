const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const compiled = ts.transpileModule(
  readFileSync(path.resolve(__dirname, "../lib/dashboard-ranking.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const rankingModule = { exports: {} };
new Function("module", "exports", compiled)(rankingModule, rankingModule.exports);
const { getAccuracy, rankStudents } = rankingModule.exports;

test("accuracy formats percentages and handles no submissions", () => {
  for (const [accepted, submitted, expected] of [
    [30, 30, "100.0"], [32, 35, "91.4"], [13, 40, "32.5"], [0, 0, "0.0"]
  ]) {
    assert.equal(getAccuracy(accepted, submitted).toFixed(1), expected);
  }
});

test("ranks prioritize solved count then accuracy regardless of display order", () => {
  const rows = [
    { student: { id: "a" }, accepted: 5, accuracy: 100 },
    { student: { id: "b" }, accepted: 30, accuracy: 50 },
    { student: { id: "c" }, accepted: 30, accuracy: 90 },
    { student: { id: "d" }, accepted: 30, accuracy: 90 },
    { student: { id: "e" }, accepted: 0, accuracy: 0 }
  ];
  const expected = { a: 4, b: 3, c: 1, d: 1, e: 5 };
  assert.deepEqual(Object.fromEntries(rankStudents(rows)), expected);
  assert.deepEqual(Object.fromEntries(rankStudents([...rows].reverse())), expected);
  assert.deepEqual(rows.map((row) => row.student.id), ["a", "b", "c", "d", "e"]);
  assert.equal(rankStudents([]).size, 0);
});

test("ranking uses unrounded accuracy when displayed percentages match", () => {
  const rows = [
    { student: { id: "a" }, accepted: 1, accuracy: getAccuracy(1, 300) },
    { student: { id: "b" }, accepted: 1, accuracy: getAccuracy(1, 301) }
  ];
  assert.equal(rows[0].accuracy.toFixed(1), rows[1].accuracy.toFixed(1));
  assert.deepEqual(Object.fromEntries(rankStudents(rows)), { a: 1, b: 2 });
});
