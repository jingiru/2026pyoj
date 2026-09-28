const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const compiled = ts.transpileModule(
  readFileSync(path.resolve(__dirname, "../lib/challenge-result-sorting.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const sortingModule = { exports: {} };
new Function("module", "exports", compiled)(sortingModule, sortingModule.exports);
const { rankChallengeResults, sortChallengeResults } = sortingModule.exports;

const rows = [
  { participant: { id: "a", student_no: "1010", name: "다희" }, solved: 3, score: 8 },
  { participant: { id: "b", student_no: "1002", name: "가람" }, solved: 5, score: 7 },
  { participant: { id: "c", student_no: "1003", name: "나래" }, solved: 5, score: 10 }
];

test("challenge ranks remain competition ranks independently of display sorting", () => {
  assert.deepEqual(Object.fromEntries(rankChallengeResults(rows)), { a: 3, b: 1, c: 1 });
  const byName = sortChallengeResults(rows, "name", "asc");
  assert.deepEqual(byName.map((row) => row.participant.id), ["b", "c", "a"]);
  assert.deepEqual(Object.fromEntries(rankChallengeResults(byName)), { b: 1, c: 1, a: 3 });
});

test("challenge result columns support ascending and descending sorting", () => {
  assert.deepEqual(sortChallengeResults(rows, "rank", "asc").map((row) => row.participant.id), ["b", "c", "a"]);
  assert.deepEqual(sortChallengeResults(rows, "studentNo", "desc").map((row) => row.participant.id), ["a", "c", "b"]);
  assert.deepEqual(sortChallengeResults(rows, "score", "desc").map((row) => row.participant.id), ["c", "a", "b"]);
});
