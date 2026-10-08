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
const { challengeScoreBreakdown, challengeBonusMax, challengePhase, challengeProblemMax, completedAllChallengeProblems, earnedProblemScore, elapsedLabel, firstSolvers, publicChallenge } = load("lib/challenge-types.ts");
const { judgeChallenge } = load("lib/challenge-judge.ts");
const { CHALLENGE_CODE_ALPHABET, generateChallengeEntryCode } = load("lib/challenge-server.ts");
const { buildChallengeResultsWorkbook } = load("lib/challenge-export.ts");
const problem = { id: "p1", title: "더하기", hint: "힌트", testCases: [{ input: "2\n3", output: "5", isSample: true }, { input: "-1\n4", output: "3", isSample: false }], examples: [{ input: "2\n3", output: "5", isSample: true }] };
const challenge = { id: "c", entry_code: "1234ABCD", started_at: "2026-09-06T01:00:00Z", ends_at: "2026-09-06T01:40:00Z", problem_snapshots: [problem] };

test("score tooltip includes each configured group and bonus and agrees with totals", () => {
  const grouped = { problem_snapshots: Array.from({ length: 10 }, (_, i) => ({ id: `p${i}` })), scoring: { mode: "grouped_correct_count", groups: [
    { id: "g1", label: "1점 짜리", problem_ids: ["p0", "p1", "p2", "p3", "p4"], base_score: 4, free_correct_count: 1, points_per_additional: 1 },
    { id: "g2", label: "2점 짜리", problem_ids: ["p5", "p6", "p7", "p8", "p9"], base_score: 4, free_correct_count: 1, points_per_additional: 2 }
  ] }, bonus_criteria: [{ id: "b1", label: "코드 이해도", max_score: 10 }, { id: "b2", label: "미평가 항목", max_score: 2.5 }] };
  const records = ["p0", "p1", "p5", "p6", "p7", "p7", "unknown"].map(problem_id => ({ problem_id, status: "accepted" }));
  const rows = challengeScoreBreakdown(grouped, records, [{ criterion_id: "b1", score: 7 }, { criterion_id: "removed", score: 100 }]);
  assert.deepEqual(rows.map(({ label, earned, max }) => ({ label, earned, max })), [
    { label: "1점 짜리", earned: 5, max: 8 }, { label: "2점 짜리", earned: 8, max: 12 },
    { label: "코드 이해도", earned: 7, max: 10 }, { label: "미평가 항목", earned: 0, max: 2.5 }
  ]);
  assert.equal(rows.reduce((sum, row) => sum + row.earned, 0), earnedProblemScore(grouped, records) + 7);
  assert.equal(rows.reduce((sum, row) => sum + row.max, 0), challengeProblemMax(grouped) + challengeBonusMax(grouped));
});

test("score tooltip supports ordinary points and correct-count scoring", () => {
  const plain = { problem_snapshots: [{ id: "p1", points: 2.5 }, { id: "p2", points: 1 }] };
  const records = [{ problem_id: "p1", status: "accepted" }, { problem_id: "p2", status: "wrong_answer" }];
  assert.deepEqual(challengeScoreBreakdown(plain, records, []), [{ id: "problems", label: "문제 점수", earned: 2.5, max: 3.5 }]);
  const counted = { ...plain, scoring: { mode: "correct_count", base_score: 4, free_correct_count: 1, points_per_additional: 2 } };
  assert.deepEqual(challengeScoreBreakdown(counted, records, []), [{ id: "problems", label: "문제 점수", earned: 4, max: 6 }]);
});

test("challenge timing: pre-start, exact deadline, extended deadline and elapsed time", () => {
  assert.equal(challengePhase({ ...challenge, started_at: null }), "waiting");
  assert.equal(challengePhase(challenge, Date.parse(challenge.ends_at) - 1), "running");
  assert.equal(challengePhase(challenge, Date.parse(challenge.ends_at)), "ended");
  assert.equal(challengePhase({ ...challenge, ends_at: "2026-09-06T01:45:00Z" }, Date.parse(challenge.ends_at)), "running");
  assert.equal(elapsedLabel(challenge.started_at, "2026-09-06T01:12:34Z"), "12:34");
});

test("mini games unlock only after every problem is completed under the challenge requirement policy", () => {
  const twoProblems = { problem_snapshots: [{ id: "p1" }, { id: "p2" }], allow_requirement_failure: false };
  const submissions = [
    { problem_id: "p1", status: "accepted", requirement_passed: true },
    { problem_id: "p2", status: "code_requirement_failed", requirement_passed: false }
  ];
  assert.equal(completedAllChallengeProblems(twoProblems, submissions), false);
  assert.equal(completedAllChallengeProblems({ ...twoProblems, allow_requirement_failure: true }, submissions), true);
  assert.equal(completedAllChallengeProblems(twoProblems, [...submissions, { problem_id: "p2", status: "accepted", requirement_passed: true }]), true);
  assert.equal(completedAllChallengeProblems({ problem_snapshots: [], allow_requirement_failure: true }, []), false);
});

test("challenge scores support problem weights, count rules and decimal bonus maxima", () => {
  const weighted = { problem_snapshots: [{ id: "p1", points: 1.5 }, { id: "p2", points: 2.5 }], scoring: { mode: "problem_points" }, bonus_criteria: [{ id: "code", label: "코드 이해도", max_score: 2.5, score_options: [0, 1.5, 2.5] }] };
  const accepted = [{ problem_id: "p2", status: "accepted" }];
  assert.equal(challengeProblemMax(weighted), 4);
  assert.equal(challengeBonusMax(weighted), 2.5);
  assert.equal(earnedProblemScore(weighted, accepted), 2.5);
  const countBased = { ...weighted, problem_snapshots: [...weighted.problem_snapshots, { id: "p3", points: 10 }, { id: "p4", points: 10 }, { id: "p5", points: 10 }], scoring: { mode: "correct_count", base_score: 4, free_correct_count: 1, points_per_additional: 1 } };
  assert.equal(challengeProblemMax(countBased), 8);
  assert.equal(earnedProblemScore(countBased, []), 4);
  assert.equal(earnedProblemScore(countBased, [{ problem_id: "p1", status: "accepted" }]), 4);
  assert.equal(earnedProblemScore(countBased, [{ problem_id: "p1", status: "accepted" }, { problem_id: "p2", status: "accepted" }]), 5);
  const grouped = { ...countBased, problem_snapshots: Array.from({ length: 10 }, (_, index) => ({ id: `p${index + 1}`, points: index < 5 ? 1 : 2 })), scoring: { mode: "grouped_correct_count", groups: [
    { id: "easy", label: "쉬운 문제", problem_ids: ["p1", "p2", "p3", "p4", "p5"], base_score: 4, free_correct_count: 1, points_per_additional: 1 },
    { id: "hard", label: "어려운 문제", problem_ids: ["p6", "p7", "p8", "p9", "p10"], base_score: 4, free_correct_count: 1, points_per_additional: 2 }
  ] } };
  assert.equal(challengeProblemMax(grouped), 20);
  assert.equal(earnedProblemScore(grouped, []), 8);
  assert.equal(earnedProblemScore(grouped, [
    { problem_id: "p1", status: "accepted" }, { problem_id: "p2", status: "accepted" }, { problem_id: "p6", status: "accepted" }, { problem_id: "p7", status: "accepted" }, { problem_id: "p8", status: "accepted" }
  ]), 13);
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
  assert.ok(Math.abs(workbook.getWorksheet("결과").getCell("L6").value - (5 / 1440)) < 1e-10);
  assert.equal(workbook.getWorksheet("결과").getCell("E2").value.toISOString(), "2026-09-07T02:30:00.000Z");
  assert.equal(workbook.getWorksheet("결과").getCell("J6").value.toISOString(), "2026-09-07T02:32:00.000Z");
  const buffer = await workbook.xlsx.writeBuffer();
  const ExcelJS = require("exceljs");
  const loaded = await new ExcelJS.Workbook().xlsx.load(buffer);
  const sheet = loaded.getWorksheet("결과");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A4").value, "학생 정보");
  assert.equal(sheet.getCell("C4").value, "결과");
  assert.equal(sheet.getCell("H4").value, "1번");
  assert.deepEqual(sheet.getRow(5).values.slice(1), ["학번", "이름", "총 정답", "총점", "만점", "문제 점수", "부가점수", "정오답", "최초 해결", "첫 제출 시각", "최초 정답 시각", "소요시간", "시도 횟수"]);
  assert.equal(sheet.getCell("A6").value, "1201");
  assert.equal(sheet.getCell("H6").value, "정답");
  assert.equal(sheet.getCell("I6").value, "최초 해결");
  assert.ok(sheet.getCell("J6").value instanceof Date);
  assert.equal(sheet.getCell("E2").value.toISOString(), "2026-09-07T02:30:00.000Z");
  assert.equal(sheet.getCell("J6").value.toISOString(), "2026-09-07T02:32:00.000Z");
  assert.equal(sheet.getCell("L6").numFmt, "[m]:ss");
  assert.equal(sheet.getCell("M6").value, 2);
  assert.equal(sheet.getCell("H7").value, "미제출");
  assert.ok(sheet.getColumn(10).width >= 23);
  assert.equal(sheet.getCell("M4").master.address, "H4");
  assert.equal(sheet.getCell("F2").master.address, "E2");
  assert.equal(loaded.getWorksheet("문항 정보").getCell("B2").value, "더하기");
});
test("exported scores include decimal bonuses and all scoring modes", async () => {
  const participants = [{ id: "a", student_no: "001", name: "학생" }, { id: "b", student_no: "002", name: "미제출" }];
  const submissions = [
    { id: "s1", participant_id: "a", problem_id: "p1", status: "accepted", received_at: challenge.started_at },
    { id: "s2", participant_id: "a", problem_id: "p1", status: "accepted", received_at: challenge.started_at },
    { id: "s3", participant_id: "a", problem_id: "p2", status: "wrong_answer", received_at: challenge.started_at }
  ];
  const bonusScores = [{ participant_id: "a", criterion_id: "code", score: 2.5 }, { participant_id: "b", criterion_id: "code", score: 0 }];
  const base = { ...challenge, title: "점수", problem_snapshots: [{ ...problem, points: 1.5 }, { ...problem, id: "p2", points: 2.5 }], bonus_criteria: [{ id: "code", label: "코드 이해도", max_score: 2.5 }] };
  const options = { includeFirstSolver: false, includeSubmissionTimes: false, includeAttemptCounts: false };
  for (const [scoring, expected, unsolved, maximum] of [
    [{ mode: "problem_points" }, 1.5, 0, 6.5],
    [{ mode: "correct_count", base_score: 4, free_correct_count: 1, points_per_additional: 2 }, 4, 4, 8.5],
    [{ mode: "grouped_correct_count", groups: [{ id: "g", problem_ids: ["p1", "p2"], base_score: 3, free_correct_count: 0, points_per_additional: 1.5 }] }, 4.5, 3, 8.5]
  ]) {
    const workbook = await buildChallengeResultsWorkbook({ ...base, scoring }, participants, submissions, options, bonusScores);
    const ExcelJS = require("exceljs");
    const loaded = await new ExcelJS.Workbook().xlsx.load(await workbook.xlsx.writeBuffer());
    const sheet = loaded.getWorksheet("결과");
    assert.deepEqual(sheet.getRow(6).values.slice(1), ["001", "학생", 1, expected + 2.5, maximum, expected, 2.5, "정답", "오답", 2.5]);
    assert.deepEqual(sheet.getRow(7).values.slice(1), ["002", "미제출", 0, unsolved, maximum, unsolved, 0, "미제출", "미제출", 0]);
    assert.equal(sheet.getCell("J5").value, "코드 이해도");
    assert.equal(loaded.getWorksheet("문항 정보").getCell("D2").value, 1.5);
  }
  const noBonus = await buildChallengeResultsWorkbook(base, participants, [], options);
  assert.equal(noBonus.getWorksheet("결과").getCell("J6").value, null);
});

test("optional group columns use configured group rules and appear next to total score", async () => {
  const grouped = { ...challenge, title: "그룹 평가", problem_snapshots: [problem, { ...problem, id: "p2" }, { ...problem, id: "p3" }], scoring: {
    mode: "grouped_correct_count", groups: [
      { id: "g1", label: "1점 문제", problem_ids: ["p1"], base_score: 4, free_correct_count: 1, points_per_additional: 1 },
      { id: "g2", label: "3점 문제", problem_ids: ["p2", "p3"], base_score: 4, free_correct_count: 1, points_per_additional: 3 }
    ]
  }, bonus_criteria: [{ id: "code", label: "코드 이해도", max_score: 2.5 }] };
  const participants = [{ id: "a", student_no: "001", name: "학생" }, { id: "b", student_no: "002", name: "미제출" }];
  const submissions = ["p2", "p3", "p3"].map((problem_id, index) => ({ id: String(index), participant_id: "a", problem_id, status: "accepted", received_at: challenge.started_at }));
  const options = { includeGroupScores: true, includeFirstSolver: true, includeSubmissionTimes: true, includeAttemptCounts: true };
  const workbook = await buildChallengeResultsWorkbook(grouped, participants, submissions, options, [{ participant_id: "a", criterion_id: "code", score: 2.5 }]);
  const ExcelJS = require("exceljs");
  const sheet = (await new ExcelJS.Workbook().xlsx.load(await workbook.xlsx.writeBuffer())).getWorksheet("결과");
  assert.deepEqual(sheet.getRow(5).values.slice(1, 8), ["학번", "이름", "총점", "1점 문제", "3점 문제", "코드 이해도", "총 정답"]);
  assert.deepEqual(sheet.getRow(6).values.slice(1, 8), ["001", "학생", 13.5, 4, 7, 2.5, 2]);
  assert.deepEqual(Array.from(sheet.getRow(7).values.slice(1, 8), value => value ?? null), ["002", "미제출", 8, 4, 4, null, 0]);
  assert.equal(sheet.getCell("H4").value, "1번");
  assert.equal(sheet.getCell("H6").value, "미제출");
  const disabled = await buildChallengeResultsWorkbook(grouped, participants, submissions, { ...options, includeGroupScores: false });
  assert.ok(!disabled.getWorksheet("결과").getRow(5).values.includes("1점 문제"));
  const ungrouped = await buildChallengeResultsWorkbook({ ...grouped, scoring: { mode: "problem_points" } }, participants, submissions, options);
  assert.ok(!ungrouped.getWorksheet("결과").getRow(5).values.includes("1점 문제"));
});

test("export endpoint queries bonus scores for the selected challenge and passes them to the workbook", async () => {
  const { NextRequest } = require("next/server");
  const bonusScores = [{ challenge_id: "c", participant_id: "a", criterion_id: "code", score: 2.5 }];
  const tables = [];
  const route = load("app/api/challenges/export/route.ts", {
    "@/lib/teacher-auth": { isTeacherRequestAuthenticated: () => true },
    "@/lib/challenge-server": {
      challengeDb: () => ({ from: table => {
        tables.push(table);
        const query = {
          select: () => query,
          eq: (key, value) => { assert.equal(key, table === "challenges" ? "id" : "challenge_id"); assert.equal(value, "c"); return query; },
          order: () => query,
          range: async () => ({ data: table === "challenge_bonus_scores" ? bonusScores : [] }),
          single: async () => ({ data: { ...challenge, title: "평가" } })
        };
        return query;
      } }),
      allRows: async fetch => (await fetch(0, 999)).data,
      fail: (error, status = 400) => Response.json({ message: error.message }, { status })
    },
    "@/lib/challenge-export": { buildChallengeResultsWorkbook: async (_challenge, _participants, _submissions, _options, scores) => {
      assert.equal(_options.includeGroupScores, true);
      assert.deepEqual(scores, bonusScores);
      return { xlsx: { writeBuffer: async () => Buffer.from("workbook") } };
    } }
  });
  const response = await route.POST(new NextRequest("http://localhost/api/challenges/export", { method: "POST", body: JSON.stringify({ challengeId: "c", includeGroupScores: true }) }));
  assert.equal(response.status, 200);
  assert.ok(tables.includes("challenge_bonus_scores"));
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
  assert.equal(result.status, "accepted");
  assert.equal(result.requirement_passed, false);
  assert.match(result.requirement_feedback, /for/);
  assert.equal((await judgeChallenge(constrained, "a = int(input())\nb = int(input())\nprint(a + b)", false)).requirement_passed, null);
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
    from: table => table === "challenges"
      ? { select: () => { const query = { eq: () => query, single: async () => ({ data: { allow_requirement_failure: false } }) }; return query; } }
      : { update: value => { saved = value; const query = { eq: () => query, select: () => query, single: async () => ({ data: { ...saved, id: "receipt-1", received_at: received } }) }; return query; } }
  };
  const route = load("app/api/challenges/submit/route.ts", {
    "@/lib/challenge-server": { participantFor: async () => ({ id: "server-participant" }), challengeDb: () => db, fail: (e, status = 400) => Response.json({ message: e.message }, { status }) },
    "@/lib/challenge-judge": { judgeChallenge: async (_problem, _code, checkRequirements) => { assert.equal(checkRequirements, true); return { status: "wrong_answer", passed_count: 0, total_count: 2, feedback: "wrong", requirement_passed: false, requirement_feedback: "for문 필요" }; } }
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
