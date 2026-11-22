// One interpreter per execution/submission. UI stop always terminates this worker.
const isNode = typeof process !== 'undefined' && !!process.versions?.node;
// Install the browser listener before the first await: module loading yields to
// messages, and a start message without a listener would otherwise be lost.
let firstJob;
if (!isNode) firstJob = new Promise(resolve => { globalThis.onmessage = event => resolve(event.data); });
let send, listen, loadPyodide, indexURL;
if (isNode) {
  if (process.send) {
    // CPython/NumPy allocations live outside V8's heap. Bound Emscripten's
    // JS-driven WASM memory growth as well as the child's V8 heap limit.
    const grow = WebAssembly.Memory.prototype.grow;
    WebAssembly.Memory.prototype.grow = function (pages) {
      if (this.buffer.byteLength + pages * 65536 > 128 * 1024 * 1024) throw new RangeError('Python memory limit exceeded');
      return grow.call(this, pages);
    };
    // Emscripten's NODEFS startup uses the private process.binding('constants').
    // Node permission mode blocks that API; supply only public fs constants,
    // without granting the runtime any additional filesystem permissions.
    const { constants } = await import('node:fs');
    process.binding = name => {
      if (name === 'constants') return { fs: constants };
      throw Error('Native process bindings are unavailable in the Python judge');
    };
    send = value => process.send(value);
    listen = handler => process.once('message', handler);
  } else {
    const { parentPort } = await import('node:worker_threads');
    send = value => parentPort.postMessage(value);
    listen = handler => parentPort.once('message', handler);
  }
  ({ loadPyodide } = await import('pyodide'));
  indexURL = new URL('./pyodide/', import.meta.url).pathname;
  if (process.platform === 'win32') indexURL = (await import('node:url')).fileURLToPath(new URL('./pyodide/', import.meta.url));
} else {
  send = value => postMessage(value);
  ({ loadPyodide } = await import('./pyodide/pyodide.mjs'));
  indexURL = new URL('./pyodide/', import.meta.url).href;
}

if (isNode) firstJob = new Promise(resolve => listen(resolve));
const runJob = async job => {
  try {
    const py = await loadPyodide({ indexURL, jsglobals: Object.create(null),
      stdout: () => {}, stderr: () => {}, enableRunUntilComplete: false });
    // Install the same bundled packages in every interpreter. This also supports
    // imports via importlib/__import__, without rewriting or scanning user code.
    await py.loadPackage('numpy', { messageCallback: () => {}, errorCallback: () => {} });
    const control = job.inputBuffer && new Int32Array(job.inputBuffer, 0, 3);
    const bytes = job.inputBuffer && new Uint8Array(job.inputBuffer, 12);
    const decoder = new TextDecoder();
    function readInput(prompt) {
      Atomics.store(control, 0, 0);
      send({ type: 'input', prompt });
      let text = '';
      do {
        while (Atomics.load(control, 0) === 0) Atomics.wait(control, 0, 0);
        const state = Atomics.load(control, 0);
        // Browsers reject SharedArrayBuffer-backed views in TextDecoder.
        text += decoder.decode(new Uint8Array(bytes.subarray(0, Atomics.load(control, 1))), { stream: state === 1 });
        Atomics.store(control, 0, 0);
        Atomics.notify(control, 0);
        if (state === 2) return text;
        send({ type: 'input-next' });
      } while (true);
    }
    // Python-level streams preserve partial prints and Unicode exactly.
    py.registerJsModule('_pyoj_io', {
      output: text => send({ type: 'output', text }),
      input: readInput,
      line: line => { if (control) Atomics.store(control, 2, line); }
    });
    const setup = py.runPython(`
import builtins as _b, sys as _sys, io as _io, traceback as _tb, json as _json
from _pyoj_io import output as _output, input as _input, line as _line
class _Output(_io.TextIOBase):
    def write(self, text):
        _output(text)
        return len(text)
    def flush(self): pass
    def isatty(self): return True
def _run(code, inputs):
    old_input, old_in, old_out, old_err = _b.input, _sys.stdin, _sys.stdout, _sys.stderr
    queue = iter(inputs) if inputs is not None else None
    def read(prompt=''):
        prompt = str(prompt)
        if queue is not None:
            if prompt: _output(prompt)
            return next(queue, '')
        return _input(prompt)
    class _Input(_io.TextIOBase):
        def readline(self, size=-1):
            value = read() + '\\n'
            return value if size < 0 else value[:size]
        def readable(self): return True
        def isatty(self): return True
    _b.input, _sys.stdin = read, _Input()
    _sys.stdout = _sys.stderr = _Output()
    def trace(frame, event, arg):
        if frame.f_code.co_filename == '<stdin>': _line(frame.f_lineno)
        return trace
    if inputs is None: _sys.settrace(trace)
    try:
        scope = {'__name__': '__main__', '__file__': '<stdin>', '__builtins__': _b}
        exec(compile(code, '<stdin>', 'exec'), scope, scope)
        return None
    except BaseException as error:
        line = getattr(error, 'lineno', None)
        for frame in _tb.extract_tb(error.__traceback__):
            if frame.filename == '<stdin>': line = frame.lineno
        return _json.dumps({'kind': type(error).__name__, 'detail': str(error), 'line': line})
    finally:
        _sys.settrace(None)
        _b.input, _sys.stdin, _sys.stdout, _sys.stderr = old_input, old_in, old_out, old_err
_run
`);
    const tests = job.tests ?? [null];
    send({ type: 'ready' });
    for (let i = 0; i < tests.length; i++) {
      send({ type: 'case-start', index: i });
      const inputs = tests[i] === null ? undefined : py.toPy(tests[i].input.replace(/\r\n/g, '\n').split('\n'));
      try {
        const error = setup(job.code, inputs);
        send({ type: 'case-end', index: i, error: error ? JSON.parse(error) : null });
      } finally { inputs?.destroy(); }
    }
    setup.destroy();
    send({ type: 'done' });
  } catch (error) {
    send({ type: 'fatal', text: String(error) });
  }
};
await runJob(await firstJob);
