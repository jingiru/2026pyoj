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
  let interruptInput: (reason: unknown) => void = () => undefined;
  let interruptionReason: unknown;
  const inputInterruption = new Promise<never>((_, reject) => {
    interruptInput = (reason) => {
      if (interruptionReason !== undefined) return;
      interruptionReason = reason;
      reject(reason);
    };
  });
  // This promise is only consumed while input() is waiting. Mark it handled for
  // programs that finish without requesting input.
  void inputInterruption.catch(() => undefined);
  const abortRun = () => interruptInput(cancellationError);

  if (options.signal?.aborted) return;
  options.signal?.addEventListener("abort", abortRun, { once: true });
  const timeoutId = window.setTimeout(() => {
    interruptInput(new Sk.builtin.TimeLimitError(Sk.timeoutMsg()));
  }, timeLimitMs);

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
      return Promise.race([callbacks.input(prompt), inputInterruption]);
    },
    inputfunTakesPrompt: true,
    execLimit: timeLimitMs
  });

  try {
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
  } catch (error) {
    const nativeError =
      typeof error === "object" && error !== null && "nativeError" in error
        ? (error as { nativeError?: unknown }).nativeError
        : undefined;
    if (error !== cancellationError && nativeError !== cancellationError) {
      callbacks.error(error instanceof Error ? error.toString() : String(error));
    }
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortRun);
  }
}
