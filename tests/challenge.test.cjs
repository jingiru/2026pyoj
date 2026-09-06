const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function load(relative, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const nativeRequire = createRequire(filename);
  const localRequire = name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("./")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".ts")), overrides);
    return nativeRequire(name);
  };
  localRequire.resolve = nativeRequire.resolve;
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(localRequire, mod, mod.exports);
  return mod.exports;
}
const { challengePhase, elapsedLabel, firstSolvers, publicChallenge } = load("lib/challenge-types.ts");
const { judgeChallenge } = load("lib/challenge-judge.ts");
const { CHALLENGE_CODE_ALPHABET, generateChallengeEntryCode } = load("lib/challenge-server.ts");
const { buildChallengeResultsWorkbook } = load("lib/challenge-export.ts");
const problem = { id: "p1", title: "더하기", hint: "힌트", testCases: [{ input: "2\n3", output: "5", isSample: true }, { input: "-1\n4", output: "3", isSample: false }], examples: [{ input: "2\n3", output: "5", isSample: true }] };
const challenge = { id: "c", entry_code: "1234ABCD", started_at: "2026-09-06T01:00:00Z", ends_at: "2026-09-06T01:40:00Z", problem_snapshots: [problem] };

test("challenge timing: pre-start, exact deadline, extended deadline and elapsed time", () => {
  assert.equal(challengePhase({ ...challenge, started_at: null }), "waiting");
  assert.equal(challengePhase(challenge, Date.parse(challenge.ends_at) - 1), "running");
  assert.equal(challengePhase(challenge, Date.parse(challenge.ends_at)), "ended");
  assert.equal(challengePhase({ ...challenge, ends_at: "2026-09-06T01:45:00Z" }, Date.parse(challenge.ends_at)), "running");
  assert.equal(elapsedLabel(challenge.started_at, "2026-09-06T01:12:34Z"), "12:34");
});
test("entry codes use only uppercase, visually distinct characters", () => {
  assert.equal(CHALLENGE_CODE_ALPHABET, "ACDEFGHJKLMNPQRSTUVWXYZ2345679");
  for (let index = 0; index < 1000; index += 1) {
    const code = generateChallengeEntryCode();
    assert.match(code, /^[ACDEFGHJKLMNPQRSTUVWXYZ2345679]{8}$/);
    assert.doesNotMatch(code, /[BOI018a-z]/);
  }
});
test("challenge result workbook includes base results and selected details", async () => {
  const richChallenge = { ...challenge, title: "2학년 수행평가", entry_code: "ACDE2345", started_at: "2026-09-06T17:30:00Z", ends_at: "2026-09-06T18:10:00Z" };
  const participants = [
    { id: "student-b", challenge_id: "c", student_no: "1202", name: "나학생", joined_at: "2026-09-06T01:00:00Z" },
    { id: "student-a", challenge_id: "c", student_no: "1201", name: "가학생", joined_at: "2026-09-06T01:00:00Z" }
  ];
  const submissions = [
    { id: "s1", participant_id: "student-a", challenge_id: "c", problem_id: "p1", status: "wrong_answer", received_at: "2026-09-06T17:32:00Z", passed_count: 0, total_count: 2 },
    { id: "s2", participant_id: "student-a", challenge_id: "c", problem_id: "p1", status: "accepted", received_at: "2026-09-06T17:35:00Z", passed_count: 2, total_count: 2 }
  ];
  const workbook = await buildChallengeResultsWorkbook(richChallenge, participants, submissions, { includeFirstSolver: true, includeSubmissionTimes: true, includeAttemptCounts: true });
  assert.ok(Math.abs(workbook.getWorksheet("결과").getCell("H6").value - (5 / 1440)) < 1e-10);
  assert.equal(workbook.getWorksheet("결과").getCell("E2").value.toISOString(), "2026-09-07T02:30:00.000Z");
  assert.equal(workbook.getWorksheet("결과").getCell("F6").value.toISOString(), "2026-09-07T02:32:00.000Z");
  const buffer = await workbook.xlsx.writeBuffer();
  const ExcelJS = require("exceljs");
  const loaded = await new ExcelJS.Workbook().xlsx.load(buffer);
  const sheet = loaded.getWorksheet("결과");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A4").value, "학생 정보");
  assert.equal(sheet.getCell("C4").value, "결과");
  assert.equal(sheet.getCell("D4").value, "1번");
  assert.deepEqual(sheet.getRow(5).values.slice(1), ["학번", "이름", "총 정답", "정오답", "최초 해결", "첫 제출 시각", "최초 정답 시각", "소요시간", "시도 횟수"]);
  assert.equal(sheet.getCell("A6").value, "1201");
  assert.equal(sheet.getCell("D6").value, "정답");
  assert.equal(sheet.getCell("E6").value, "최초 해결");
  assert.ok(sheet.getCell("F6").value instanceof Date);
  assert.equal(sheet.getCell("E2").value.toISOString(), "2026-09-07T02:30:00.000Z");
  assert.equal(sheet.getCell("F6").value.toISOString(), "2026-09-07T02:32:00.000Z");
  assert.equal(sheet.getCell("H6").numFmt, "[m]:ss");
  assert.equal(sheet.getCell("I6").value, 2);
  assert.equal(sheet.getCell("D7").value, "미제출");
  assert.ok(sheet.getColumn(6).width >= 23);
  assert.equal(sheet.getCell("I4").master.address, "D4");
  assert.equal(sheet.getCell("F2").master.address, "E2");
  assert.equal(loaded.getWorksheet("문항 정보").getCell("B2").value, "더하기");
});
test("student responses hide all pre-start problems, entry codes and hidden test cases", () => {
  const waiting = publicChallenge({ ...challenge, started_at: null });
  assert.equal(waiting.entry_code, undefined);
  assert.deepEqual(waiting.problem_snapshots, []);
  const running = publicChallenge(challenge, Date.parse(challenge.started_at));
  assert.deepEqual(running.problem_snapshots[0].testCases, []);
  assert.deepEqual(running.problem_snapshots[0].examples, problem.examples);
  assert.equal(challenge.problem_snapshots[0].testCases.length, 2);
  const noSamples = publicChallenge({ ...challenge, problem_snapshots: [{ ...problem, testCases: [{ input: "secret", output: "secret" }] }] }, Date.parse(challenge.started_at));
  assert.deepEqual(noSamples.problem_snapshots[0].examples, []);
});
test("first solver uses first accepted receipt rather than grading order or earlier failures", () => {
  const rows = [
    { id: "3", participant_id: "b", problem_id: "p1", status: "accepted", received_at: "2026-09-06T01:10:00Z" },
    { id: "1", participant_id: "b", problem_id: "p1", status: "wrong_answer", received_at: "2026-09-06T01:01:00Z" },
    { id: "2", participant_id: "a", problem_id: "p1", status: "accepted", received_at: "2026-09-06T01:05:00Z" }
  ];
  assert.equal(firstSolvers(rows).get("p1").participant_id, "a");
  assert.equal(firstSolvers([...rows].reverse()).get("p1").participant_id, "a");
});
test("server judge runs real Python against every test and ignores client scoring", async () => {
  const result = await judgeChallenge(problem, "a = int(input())\nb = int(input())\nprint(a + b)");
  assert.equal(result.status, "accepted"); assert.equal(result.passed_count, 2);
  assert.equal((await judgeChallenge(problem, "print(5)")).status, "wrong_answer");
  assert.equal((await judgeChallenge(problem, "print(1 / 0)")).status, "runtime_error");
});
test("server judge enforces code requirements and rejects empty test suites", async () => {
  const constrained = { ...problem, codeRequirements: [{ type: "for_range" }] };
  const result = await judgeChallenge(constrained, "a = int(input())\nb = int(input())\nprint(a + b)");
  assert.equal(result.status, "code_requirement_failed");
  await assert.rejects(judgeChallenge({ ...problem, testCases: [] }, "print(1)"), /테스트/);
});
test("separate workers isolate simultaneous submissions", async () => {
  const result = await Promise.all([judgeChallenge(problem, "print(int(input()) + int(input()))"), judgeChallenge(problem, "print('different')")]);
  assert.deepEqual(result.map(r => r.status), ["accepted", "wrong_answer"]);
});
test("infinite Python loops are bounded", { timeout: 16000 }, async () => {
  const result = await judgeChallenge({ ...problem, testCases: [problem.testCases[0]] }, "while True:\n    pass");
  assert.equal(result.status, "runtime_error");
});
test("challenge endpoints reject unauthenticated access before database or grading", async () => {
  const { NextRequest } = require("next/server");
  const deniedDb = () => { throw new Error("database must not be called"); };
  const { GET, POST } = load("app/api/challenges/route.ts", {
    "@/lib/teacher-auth": { isTeacherRequestAuthenticated: () => false },
    "@/lib/curriculum-server": {},
    "@/lib/challenge-server": { challengeDb: deniedDb, fail: (e, status) => Response.json({ message: e.message }, { status }) }
  });
  assert.equal((await GET(new NextRequest("http://localhost/api/challenges"))).status, 401);
  assert.equal((await POST(new NextRequest("http://localhost/api/challenges", { method: "POST" }))).status, 401);
  const submit = load("app/api/challenges/submit/route.ts", {
    "@/lib/challenge-server": { participantFor: async () => null, challengeDb: deniedDb, fail: (e, status = 400) => Response.json({ message: e.message }, { status }) },
    "@/lib/challenge-judge": { judgeChallenge: deniedDb }
  });
  const request = new NextRequest("http://localhost/api/challenges/submit", { method: "POST", body: JSON.stringify({ challengeId: "c", problemId: "p", code: "print(1)", requestId: "00000000-0000-4000-8000-000000000000", status: "accepted" }) });
  assert.equal((await submit.POST(request)).status, 401);
  const exportRoute = load("app/api/challenges/export/route.ts", {
    "@/lib/teacher-auth": { isTeacherRequestAuthenticated: () => false },
    "@/lib/challenge-server": { allRows: deniedDb, challengeDb: deniedDb, fail: (e, status) => Response.json({ message: e.message }, { status }) },
    "@/lib/challenge-export": { buildChallengeResultsWorkbook: deniedDb }
  });
  assert.equal((await exportRoute.POST(new NextRequest("http://localhost/api/challenges/export", { method: "POST" }))).status, 401);
});

test("submission route uses server verdict and preserves database reception time", async () => {
  const { NextRequest } = require("next/server");
  const received = "2026-09-06T01:39:59.999Z";
  let saved, rpcArgs;
  const db = {
    rpc: async (_, args) => { rpcArgs = args; return { data: { fresh: true, problem, submission: { id: "receipt-1", received_at: received } } }; },
    from: () => ({ update: value => { saved = value; const query = { eq: () => query, select: () => query, single: async () => ({ data: { ...saved, id: "receipt-1", received_at: received } }) }; return query; } })
  };
  const route = load("app/api/challenges/submit/route.ts", {
    "@/lib/challenge-server": { participantFor: async () => ({ id: "server-participant" }), challengeDb: () => db, fail: (e, status = 400) => Response.json({ message: e.message }, { status }) },
    "@/lib/challenge-judge": { judgeChallenge: async () => ({ status: "wrong_answer", passed_count: 0, total_count: 2, feedback: "wrong" }) }
  });
  const response = await route.POST(new NextRequest("http://localhost/api/challenges/submit", { method: "POST", body: JSON.stringify({ challengeId: "c", problemId: "p1", code: "print(0)", requestId: "00000000-0000-4000-8000-000000000000", participant_id: "forged-student", status: "accepted", received_at: "2026-09-06T01:00:00Z" }) }));
  const result = await response.json();
  assert.equal(result.submission.status, "wrong_answer");
  assert.equal(result.submission.received_at, received);
  assert.equal(rpcArgs.p_participant, "server-participant");
  assert.equal(saved.received_at, undefined);
});

test("a deadline refusal never starts the judge", async () => {
  const { NextRequest } = require("next/server");
  const route = load("app/api/challenges/submit/route.ts", {
    "@/lib/challenge-server": { participantFor: async () => ({ id: "student" }), challengeDb: () => ({ rpc: async () => ({ error: new Error("제출 시간이 종료되었습니다.") }) }), fail: (e, status = 400) => Response.json({ message: e.message }, { status }) },
    "@/lib/challenge-judge": { judgeChallenge: async () => { assert.fail("expired submission must not be graded"); } }
  });
  const response = await route.POST(new NextRequest("http://localhost/api/challenges/submit", { method: "POST", body: JSON.stringify({ challengeId: "c", problemId: "p1", code: "print(1)", requestId: "00000000-0000-4000-8000-000000000000" }) }));
  assert.equal(response.status, 409);
});
