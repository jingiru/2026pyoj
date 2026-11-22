const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
module.exports = function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const nativeRequire = createRequire(filename);
  const localRequire = name => name.startsWith('./')
    ? module.exports(path.resolve(path.dirname(filename), name + '.ts'))
    : nativeRequire(name);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(localRequire, mod, mod.exports);
  return mod.exports;
};
