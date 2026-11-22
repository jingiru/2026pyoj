type PythonCallbacks = {
  output: (text: string) => void;
  error: (text: string) => void;
  input: (prompt: string) => Promise<string>;
};

type PythonRunOptions = {
  signal?: AbortSignal;
  timeLimitMs?: number;
};

const DEFAULT_TIME_LIMIT_MS = 30000;
const INITIALIZATION_LIMIT_MS = 60000;

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

/** Each run owns its worker and input buffer, including while an input is pending. */
export async function runPython(
  code: string,
  callbacks: PythonCallbacks,
  options: PythonRunOptions = {}
): Promise<void> {
  if (options.signal?.aborted) return;
  if (typeof SharedArrayBuffer === "undefined") {
    callbacks.error("Python 실행에 필요한 브라우저 격리 기능을 사용할 수 없습니다. 페이지를 새로고침하거나 최신 브라우저를 사용해 주세요.");
    return;
  }
  await new Promise<void>(resolve => {
    const buffer = new SharedArrayBuffer(12 + 65536);
    const control = new Int32Array(buffer, 0, 3);
    const bytes = new Uint8Array(buffer, 12);
    let worker: Worker;
    let finished = false;
    let pending: Uint8Array | null = null;
    let offset = 0;
    let outputLength = 0;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      worker?.terminate();
      pending = null;
      try { if (error) callbacks.error(error); } finally { resolve(); }
    };
    const abort = () => finish();
    const writeInputChunk = () => {
      if (finished || !pending) return;
      const chunk = pending.subarray(offset, offset + bytes.length);
      bytes.set(chunk);
      offset += chunk.length;
      Atomics.store(control, 1, chunk.length);
      Atomics.store(control, 0, offset < pending.length ? 1 : 2);
      Atomics.notify(control, 0);
      if (offset === pending.length) pending = null;
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish("Python 실행 환경을 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 실행해 주세요."), INITIALIZATION_LIMIT_MS);
    try {
      worker = new Worker("/python-worker.mjs", { type: "module" });
      worker.onerror = event => { event.preventDefault(); finish(`Python 실행 환경 오류: ${event.message}`); };
      worker.onmessage = event => {
        if (finished) return;
        const message = event.data;
        switch (message.type) {
          case "ready":
            clearTimeout(timer);
            timer = setTimeout(() => {
              const line = Atomics.load(control, 2);
              finish(formatPythonError(`TimeLimitError: execution timed out${line ? ` on line ${line}` : ""}`));
            }, options.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS);
            break;
          case "output":
            outputLength += message.text.length;
            if (outputLength > 65536) finish("출력 제한을 초과해 실행을 중단했습니다.");
            else callbacks.output(message.text);
            break;
          case "input":
            Promise.resolve().then(() => callbacks.input(message.prompt)).then(value => {
              if (finished) return;
              pending = new TextEncoder().encode(value);
              offset = 0;
              writeInputChunk();
            }).catch(error => finish(formatPythonError(error)));
            break;
          case "input-next": writeInputChunk(); break;
          case "case-end":
            if (message.error) {
              const { kind, detail, line } = message.error;
              finish(formatPythonError(`${kind}: ${detail}${line ? ` on line ${line}` : ""}`));
            }
            break;
          case "done": finish(); break;
          case "fatal": finish(`Python 실행 환경 오류: ${message.text}`); break;
        }
      };
      worker.postMessage({ code, inputBuffer: buffer });
    } catch (error) { finish(`Python 실행 환경 오류: ${String(error)}`); }
  });
}

