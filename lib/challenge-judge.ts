import { fork } from "node:child_process";
import { join } from "node:path";
import { checkCodeRequirements } from "./code-requirements";
import type { Problem, SubmissionStatus } from "./types";

type Result = { status: SubmissionStatus; passed_count: number; total_count: number; feedback: string; requirement_passed?: boolean | null; requirement_feedback?: string };

// Each submission gets a separate interpreter and a parent-enforced time limit.
export async function judgeChallenge(problem: Problem, code: string, checkRequirements = true): Promise<Result> {
  if (!problem.testCases.length) throw new Error("채점 테스트가 없는 문제입니다.");
  const result = await new Promise<Result>((resolve, reject) => {
    const root = process.cwd();
    // Run untrusted Python in a disposable Node process with no application env
    // and filesystem permission only for the runtime assets (never .env/source).
    const worker = fork(join(root, "public", "python-worker.mjs"), [], {
      execArgv: ["--permission", `--allow-fs-read=${join(root, "node_modules")}`, `--allow-fs-read=${join(root, "public", "pyodide")}`, `--allow-fs-read=${join(root, "public", "python-worker.mjs")}`, `--allow-fs-read=${join(root, "package.json")}`, "--max-old-space-size=96"],
      env: { NODE_ENV: "production", ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}), TZ: "UTC" },
      stdio: ["ignore", "ignore", "pipe", "ipc"]
    });
    let settled = false, passed = 0, runtimeError = false, output = "", diagnostic = "";
    let caseTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = (result?: Result, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(caseTimer);
      worker.kill();
      if (error) reject(error); else resolve(result!);
    };
    const failure = () => finish({ status: "runtime_error", passed_count: passed, total_count: problem.testCases.length, feedback: "실행 오류 또는 실행 시간/메모리 제한을 확인해주세요." });
    // Preserve the existing whole-submission limit, including initialization.
    const timer = setTimeout(failure, 12000);
    worker.stderr?.on("data", data => { diagnostic = (diagnostic + String(data)).slice(-4096); });
    worker.on("message", (message: any) => {
      if (settled) return;
      switch (message.type) {
        case "case-start":
          output = "";
          caseTimer = setTimeout(failure, 1500);
          break;
        case "output":
          output += message.text;
          if (output.length > 65536) failure();
          break;
        case "case-end":
          clearTimeout(caseTimer);
          if (message.error) runtimeError = true;
          else if (output.replace(/\r\n/g, "\n").trim() === problem.testCases[message.index].output.replace(/\r\n/g, "\n").trim()) passed++;
          break;
        case "done":
          finish({ status: runtimeError ? "runtime_error" : passed === problem.testCases.length ? "accepted" : "wrong_answer", passed_count: passed, total_count: problem.testCases.length, feedback: runtimeError ? "실행 오류 또는 실행 시간 제한을 확인해주세요." : passed === problem.testCases.length ? "모든 테스트를 통과했습니다." : "통과하지 못한 테스트가 있습니다." });
          break;
        case "fatal": finish(undefined, new Error(message.text)); break;
      }
    });
    worker.once("error", error => finish(undefined, error));
    worker.once("exit", () => finish(undefined, new Error(`채점 실행이 중단되었습니다. ${diagnostic}`)));
    worker.send({ code, tests: problem.testCases });
  });
  if (!checkRequirements) return { ...result, requirement_passed: null, requirement_feedback: "" };
  const requirements = checkCodeRequirements(code, problem.codeRequirements);
  return { ...result, requirement_passed: requirements.passed, requirement_feedback: requirements.feedback };
}
