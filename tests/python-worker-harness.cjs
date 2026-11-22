// Exercise the exact browser runner/worker protocol with real CPython in Node.
const { Worker } = require('node:worker_threads');
const path = require('node:path');
global.Worker = class BrowserWorker {
  constructor(url) {
    this.worker = new Worker(path.resolve(__dirname, '..', 'public', url.slice(1)));
    this.worker.on('message', data => this.onmessage?.({ data }));
    this.worker.on('error', error => this.onerror?.({ message: error.message, preventDefault() {} }));
  }
  postMessage(message) { this.worker.postMessage(message); }
  terminate() { void this.worker.terminate(); }
};
