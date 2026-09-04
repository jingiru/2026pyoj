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
      callbacks.error(error instanceof Error ? error.toString() : String(error));
    }
  } finally {
    globalThis.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortRun);
  }
}
