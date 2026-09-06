import { Worker } from "node:worker_threads";
import { join } from "node:path";
import { checkCodeRequirements } from "./code-requirements";
import type { Problem, SubmissionStatus } from "./types";

type Result = { status: SubmissionStatus; passed_count: number; total_count: number; feedback: string };

// Each submission gets a separate interpreter. Student Python cannot access Node's
// require, filesystem or network. Parent termination also bounds uncooperative code.
export async function judgeChallenge(problem: Problem, code: string): Promise<Result> {
  if (!problem.testCases.length) throw new Error("채점 테스트가 없는 문제입니다.");
  // Webpack's require.resolve returns module IDs; a worker needs native file paths.
  const skulptDirectory = join(process.cwd(), "node_modules", "skulpt");
  const result = await new Promise<Result>((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      var Sk = require(workerData.skulptPath);
      require(workerData.stdlibPath);
      (async () => {
        let passed = 0, runtimeError = false;
        for (const test of workerData.tests) {
          let output = '', inputs = test.input.replace(/\\r\\n/g, '\\n').split('\\n');
          Sk.configure({
            output: text => { output += text; if (output.length > 65536) throw Error('출력 제한 초과'); },
            read: name => { if (!Sk.builtinFiles.files[name]) throw Error('지원하지 않는 모듈'); return Sk.builtinFiles.files[name]; },
            inputfun: () => Promise.resolve(inputs.shift() ?? ''), inputfunTakesPrompt: true,
            __future__: Sk.python3, execLimit: 1500, yieldLimit: 50,
            killableWhile: true, killableFor: true
          });
          Sk.execStart = undefined;
          try {
            await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, workerData.code, true));
            if (output.replace(/\\r\\n/g, '\\n').trim() === test.output.replace(/\\r\\n/g, '\\n').trim()) passed++;
          } catch { runtimeError = true; }
        }
        parentPort.postMessage({ status: runtimeError ? 'runtime_error' : passed === workerData.tests.length ? 'accepted' : 'wrong_answer', passed_count: passed, total_count: workerData.tests.length, feedback: runtimeError ? '실행 오류 또는 실행 시간 제한을 확인해주세요.' : passed === workerData.tests.length ? '모든 테스트를 통과했습니다.' : '통과하지 못한 테스트가 있습니다.' });
      })().catch(error => { throw error; });
    `, {
      eval: true,
      workerData: { code, tests: problem.testCases, skulptPath: join(skulptDirectory, "main.js"), stdlibPath: join(skulptDirectory, "dist", "skulpt-stdlib.js") },
      resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 }
    });
    const timer = setTimeout(() => {
      void worker.terminate();
      resolve({ status: "runtime_error", passed_count: 0, total_count: problem.testCases.length, feedback: "실행 시간 또는 메모리 제한을 초과했습니다." });
    }, 12000);
    worker.once("message", (value: Result) => { clearTimeout(timer); void worker.terminate(); resolve(value); });
    worker.once("error", (error) => { clearTimeout(timer); reject(error); });
    worker.once("exit", () => { clearTimeout(timer); reject(new Error("채점 실행이 중단되었습니다.")); });
  });
  const requirements = checkCodeRequirements(code, problem.codeRequirements);
  if (result.status === "accepted" && !requirements.passed) return { ...result, status: "code_requirement_failed", feedback: requirements.feedback };
  return result;
}
