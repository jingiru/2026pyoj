type SkulptCallbacks = {
  output: (text: string) => void;
  error: (text: string) => void;
  input: (prompt: string) => Promise<string>;
};

type SkulptRunOptions = {
  signal?: AbortSignal;
  timeLimitMs?: number;
};

const DEFAULT_TIME_LIMIT_MS = 30000;
const EXECUTION_SLICE_MS = 50;

export function formatPythonError(error: unknown): string {
  const original = String(error);
  const match = original.match(/^([A-Za-z]+Error):\s*([\s\S]*?)(?: on line (\d+|<unknown>))?$/);
  const kind = match?.[1];
  const detail = match?.[2] ?? original;
  const line = match?.[3];
  const location = line && /^\d+$/.test(line)
    ? `코드 ${line}번째 줄을 확인해 주세요.\n`
    : "";
  let explanation: string;
  switch (kind) {
    case "NameError": {
      const name = detail.match(/name ['"](.+?)['"] is not defined/)?.[1];
      explanation = name
        ? `'${name}'라는 변수 또는 함수는 정의되지 않았습니다. 먼저 정의했는지, 이름을 잘못 입력했는지 확인해 주세요.`
        : "사용하려는 이름을 찾을 수 없습니다. 변수나 함수를 먼저 정의했는지 확인해 주세요.";
      break;
    }
    case "IndentationError":
    case "TabError":
      explanation = "들여쓰기가 올바르지 않습니다. 같은 블록의 들여쓰기를 맞추고, 탭과 공백을 섞어 쓰지 않았는지 확인해 주세요.";
      break;
    case "SyntaxError":
      explanation = "문법이 올바르지 않습니다. 괄호, 따옴표, 쉼표, 콜론과 들여쓰기를 확인해 주세요.";
      break;
    case "UnboundLocalError":
      explanation = "변수에 값을 넣기 전에 사용했습니다. 함수 안에서 해당 변수에 먼저 값을 넣어 주세요.";
      break;
    case "TypeError":
      explanation = "값의 자료형이나 함수에 전달한 값이 맞지 않습니다. 숫자와 문자열을 함께 계산했는지, 함수에 필요한 값을 올바르게 넣었는지 확인해 주세요.";
      break;
    case "ValueError":
      explanation = "처리할 수 없는 값입니다. 입력한 값이 올바른지 확인해 주세요. 숫자로 바꿀 때는 숫자로 된 문자열을 사용해야 합니다.";
      break;
    case "ZeroDivisionError":
      explanation = "0으로 나눌 수 없습니다. 나누는 값이 0인지 확인해 주세요.";
      break;
    case "IndexError":
      explanation = "리스트나 문자열의 범위를 벗어난 위치를 사용했습니다. 위치 번호는 0부터 시작하며, 항목 수보다 작아야 합니다.";
      break;
    case "KeyError":
      explanation = "딕셔너리에 없는 키를 사용했습니다. 해당 키가 있는지, 이름을 올바르게 입력했는지 확인해 주세요.";
      break;
    case "AttributeError":
      explanation = "이 값에서 사용할 수 없는 속성이나 기능입니다. 이름과 값의 자료형을 확인해 주세요.";
      break;
    case "ImportError":
    case "ModuleNotFoundError":
      explanation = "불러오려는 모듈이나 기능을 찾을 수 없습니다. 이름이 올바른지, 이 실행 환경에서 지원하는지 확인해 주세요.";
      break;
    case "TimeLimitError":
      explanation = "실행 시간이 너무 길어 중단되었습니다. 반복문이 끝나는지 확인해 주세요. 입력을 기다리고 있었다면 값을 입력한 뒤 다시 실행해 주세요.";
      break;
    case "RecursionError":
      explanation = "함수가 자신을 너무 많이 호출했습니다. 재귀 호출이 끝나는 조건을 확인해 주세요.";
      break;
    case "OverflowError":
      explanation = "계산 결과가 처리할 수 있는 범위를 넘었습니다. 계산에 사용하는 값을 확인해 주세요.";
      break;
    case "AssertionError":
      explanation = "assert에 적은 조건이 참이 아닙니다. 조건과 변수의 값을 확인해 주세요.";
      break;
    default:
      // Preserve diagnostic details for errors without a reliable translation.
      explanation = `코드를 실행하는 중 오류가 발생했습니다.\n오류 상세: ${original}`;
  }
  return location + explanation;
}

type SkulptSuspension = {
  data: { promise: Promise<unknown>; result?: unknown; error?: unknown };
  resume: () => unknown;
};

export async function runPythonWithSkulpt(
  code: string,
  callbacks: SkulptCallbacks,
  options: SkulptRunOptions = {}
) {
  const module = await import("skulpt");
  await import("skulpt/dist/skulpt-stdlib.js");
  const Sk = (module as any).default ?? module;
  const timeLimitMs = options.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS;
  const cancellationError = new Error("PYOJ_SKULPT_RUN_CANCELLED");
  let interruptRun: (reason: unknown) => void = () => undefined;
  let interruptionReason: unknown;
  const runInterruption = new Promise<never>((_, reject) => {
    interruptRun = (reason) => {
      if (interruptionReason !== undefined) return;
      interruptionReason = reason;
      reject(reason);
    };
  });
  // Some programs finish without ever suspending on a promise.
  void runInterruption.catch(() => undefined);
  const abortRun = () => interruptRun(cancellationError);

  if (options.signal?.aborted) return;
  options.signal?.addEventListener("abort", abortRun, { once: true });
  const timeoutId = globalThis.setTimeout(() => {
    interruptRun(new Sk.builtin.TimeLimitError(Sk.timeoutMsg()));
  }, timeLimitMs);

  const resumeUnlessCancelled = (suspension: SkulptSuspension) => {
    if (options.signal?.aborted) throw cancellationError;
    return suspension.resume();
  };

  const yieldToBrowser = (suspension: SkulptSuspension) =>
    new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0)).then(() =>
      resumeUnlessCancelled(suspension)
    );

  Sk.configure({
    __future__: Sk.python3,
    output: callbacks.output,
    read: (file: string) => {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[file] === undefined) {
        throw new Error(`File not found: ${file}`);
      }
      return Sk.builtinFiles.files[file];
    },
    inputfun: (prompt: string) => {
      if (interruptionReason !== undefined) return Promise.reject(interruptionReason);
      return callbacks.input(prompt);
    },
    inputfunTakesPrompt: true,
    execLimit: timeLimitMs,
    // Let the browser paint the stop button and receive clicks during loops.
    yieldLimit: EXECUTION_SLICE_MS
  });

  try {
    await Sk.misceval.asyncToPromise(
      () => Sk.importMainWithBody("<stdin>", false, code, true),
      {
        "Sk.promise": (suspension: SkulptSuspension) =>
          Promise.race([suspension.data.promise, runInterruption]).then(
            (value) => {
              suspension.data.result = value;
              return resumeUnlessCancelled(suspension);
            },
            (error) => {
              // Cancellation must not resume Python, even inside try/except.
              // TimeLimitError still resumes through Skulpt to retain its line number.
              suspension.data.error = error;
              return resumeUnlessCancelled(suspension);
            }
          ),
        "Sk.yield": yieldToBrowser,
        "Sk.delay": yieldToBrowser
      }
    );
  } catch (error) {
    const nativeError =
      typeof error === "object" && error !== null && "nativeError" in error
        ? (error as { nativeError?: unknown }).nativeError
        : undefined;
    if (error !== cancellationError && nativeError !== cancellationError) {
      callbacks.error(formatPythonError(error));
    }
  } finally {
    globalThis.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortRun);
  }
}
