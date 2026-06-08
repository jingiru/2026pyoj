import type { Problem, TestCase } from "./types";

type JudgeResult = {
  status: "accepted" | "wrong_answer" | "runtime_error";
  passedCount: number;
  totalCount: number;
  feedback: string;
  cases: Array<TestCase & { actual: string; passed: boolean }>;
};

export function judgePythonSubmission(problem: Problem, code: string): JudgeResult {
  const cases = problem.testCases.map((testCase) => {
    const actual = runSupportedBeginnerPattern(problem.id, code, testCase.input);
    return {
      ...testCase,
      actual,
      passed: normalize(actual) === normalize(testCase.output)
    };
  });

  const passedCount = cases.filter((testCase) => testCase.passed).length;
  const accepted = passedCount === cases.length;

  return {
    status: accepted ? "accepted" : "wrong_answer",
    passedCount,
    totalCount: cases.length,
    feedback: accepted
      ? "좋아요. 모든 테스트케이스를 통과했어요."
      : "아직 맞지 않는 테스트케이스가 있어요. 입력을 바꿔도 같은 규칙으로 동작하는지 확인해보세요.",
    cases
  };
}

function runSupportedBeginnerPattern(problemId: string, code: string, input: string) {
  const trimmed = code.replace(/\r\n/g, "\n").trim();

  if (problemId === "print-int-01") {
    if (/print\s*\(\s*1\s*\)/.test(trimmed)) return "1";
    return extractSimplePrint(trimmed);
  }

  if (problemId === "repeat-char-02") {
    if (/input\s*\(\s*\)/.test(trimmed) && /\*\s*10|10\s*\*/.test(trimmed)) {
      return input.repeat(10);
    }
    return extractSimplePrint(trimmed);
  }

  if (problemId === "sum-two-03") {
    const nums = input.split(/\s+/).map(Number);
    if (/int\s*\(\s*input\s*\(\s*\)\s*\)/.test(trimmed) && /\+/.test(trimmed)) {
      return String(nums[0] + nums[1]);
    }
    return extractSimplePrint(trimmed);
  }

  if (problemId === "even-odd-04") {
    const n = Number(input.trim());
    if (/%\s*2/.test(trimmed) && /even/.test(trimmed) && /odd/.test(trimmed)) {
      return n % 2 === 0 ? "even" : "odd";
    }
    return extractSimplePrint(trimmed);
  }

  return "";
}

function extractSimplePrint(code: string) {
  const match = code.match(/print\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
  return match?.[1]?.trim() ?? "";
}

function normalize(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}
