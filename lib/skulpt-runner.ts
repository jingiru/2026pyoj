type SkulptCallbacks = {
  output: (text: string) => void;
  error: (text: string) => void;
  input: (prompt: string) => Promise<string>;
};

export async function runPythonWithSkulpt(code: string, callbacks: SkulptCallbacks) {
  const module = await import("skulpt");
  await import("skulpt/dist/skulpt-stdlib.js");
  const Sk = (module as any).default ?? module;

  Sk.configure({
    __future__: Sk.python3,
    output: callbacks.output,
    read: (file: string) => {
      if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[file] === undefined) {
        throw new Error(`File not found: ${file}`);
      }
      return Sk.builtinFiles.files[file];
    },
    inputfun: (prompt: string) => callbacks.input(prompt),
    inputfunTakesPrompt: true,
    execLimit: 5000
  });

  try {
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
  } catch (error) {
    callbacks.error(error instanceof Error ? error.toString() : String(error));
  }
}
