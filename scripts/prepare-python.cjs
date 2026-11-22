// Serve a pinned runtime locally: classroom execution must not depend on a CDN.
const { cpSync, mkdirSync, existsSync } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.dirname(require.resolve('pyodide/package.json'));
const target = path.resolve(__dirname, '../public/pyodide');
const version = require('pyodide/package.json').version;
const lock = require(path.join(source, 'pyodide-lock.json'));

async function main() {
  mkdirSync(target, { recursive: true });
  for (const name of ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
    cpSync(path.join(source, name), path.join(target, name));
  }
  const visited = new Set();
  async function download(name) {
    if (visited.has(name)) return;
    visited.add(name);
    const pkg = lock.packages[name];
    await Promise.all(pkg.depends.map(download));
    const file = path.join(target, pkg.file_name);
    if (existsSync(file) && crypto.createHash('sha256').update(require('node:fs').readFileSync(file)).digest('hex') === pkg.sha256) return;
    const response = await fetch(`https://cdn.jsdelivr.net/pyodide/v${version}/full/${pkg.file_name}`, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw Error(`Python package download failed: ${response.status} ${name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== pkg.sha256) throw Error(`Python package checksum mismatch: ${name}`);
    await writeFile(file, bytes);
  }
  await download('numpy');
  console.log(`Prepared Pyodide ${version} and NumPy`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
