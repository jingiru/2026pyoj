/* One Skulpt interpreter per execution; never share builtins between students/runs. */
var Sk;
const isNode = typeof process !== 'undefined' && !!process.versions?.node;
let send, listen;
if (isNode) {
  if (process.send) {
    send = value => process.send(value);
    listen = handler => process.on('message', handler);
  } else {
    const { parentPort } = require('node:worker_threads');
    send = value => parentPort.postMessage(value);
    listen = handler => parentPort.on('message', handler);
  }
  Sk = require('skulpt');
  require('skulpt/dist/skulpt-stdlib.js');
} else {
  send = value => postMessage(value);
  listen = handler => { onmessage = event => handler(event.data); };
  importScripts('/skulpt/skulpt.min.js', '/skulpt/skulpt-stdlib.js');
  Sk = self.Sk;
}
// Python classroom programs have no reason to execute host JavaScript.
delete Sk.builtins.jseval;

let started = false, inputId = 0;
const pendingInputs = new Map();
listen(message => {
  if (message.type === 'input-result') {
    const resolve = pendingInputs.get(message.id);
    pendingInputs.delete(message.id);
    resolve?.(message.value);
    return;
  }
  if (started) return;
  started = true;
  void run(message).catch(error => send({ type: 'fatal', text: String(error) }));
});

async function run(job) {
  const tests = job.tests ?? [null];
  send({ type: 'ready' });
  for (let index = 0; index < tests.length; index++) {
    const test = tests[index];
    const inputs = test && test.input.replace(/\r\n/g, '\n').split('\n');
    let outputLength = 0;
    Sk.configure({
      __future__: Sk.python3,
      output: text => {
        outputLength += text.length;
        if (outputLength > 65536) throw Error('출력 제한을 초과해 실행을 중단했습니다.');
        send({ type: 'output', text });
      },
      read: file => {
        if (!Sk.builtinFiles?.files[file]) throw Error(`File not found: ${file}`);
        return Sk.builtinFiles.files[file];
      },
      inputfun: prompt => {
        if (inputs) {
          if (prompt) send({ type: 'output', text: prompt });
          return Promise.resolve(inputs.shift() ?? '');
        }
        return new Promise(resolve => {
          const id = ++inputId;
          pendingInputs.set(id, resolve);
          send({ type: 'input', prompt, id });
        });
      },
      inputfunTakesPrompt: true,
      execLimit: job.timeLimitMs ?? (job.tests ? 1500 : 30000),
      yieldLimit: 50,
      killableWhile: true, killableFor: true
    });
    Sk.execStart = undefined;
    const reportLine = suspension => {
      for (let item = suspension; item; item = item.child) {
        if (item.$filename === '<stdin>.py' && item.$lineno) {
          send({ type: 'line', line: item.$lineno });
          return;
        }
      }
    };
    const yieldExecution = suspension => {
      reportLine(suspension);
      return new Promise(resolve => setTimeout(resolve, 0)).then(() => suspension.resume());
    };
    send({ type: 'case-start', index });
    try {
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, job.code, true), {
        'Sk.yield': yieldExecution, 'Sk.delay': yieldExecution,
        'Sk.promise': suspension => {
          reportLine(suspension);
          return suspension.data.promise.then(
            value => { suspension.data.result = value; return suspension.resume(); },
            error => { suspension.data.error = error; return suspension.resume(); }
          );
        }
      });
      send({ type: 'case-end', index, error: null });
    } catch (error) {
      send({ type: 'case-end', index, error: String(error) });
    }
  }
  send({ type: 'done' });
}
