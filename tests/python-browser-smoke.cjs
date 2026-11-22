// Run after npm run build. Uses the production page, real module Worker and WASM.
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { existsSync } = require('node:fs');
const { chromium } = require('@playwright/test');
const next = require('next');

async function main() {
  const app = next({ dev: false });
  let server, browser;
  try {
    await app.prepare();
    server = http.createServer(app.getRequestHandler());
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    ].find(existsSync);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const page = await browser.newPage();
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    page.setDefaultTimeout(30000);
    page.on('pageerror', error => console.error('Browser page error:', error.message));
    // Prove the runtime/NumPy do not require a third-party host during execution.
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.goto(origin);
    console.log('Browser loaded production page');
    assert.equal(await page.evaluate(() => crossOriginIsolated), true);
    await page.getByRole('link', { name: /로그인 없이 코딩 연습/ }).click();
    console.log('Opened practice IDE');
    const editor = page.locator('.cm-content');
    const terminal = page.locator('.terminal pre');
    const input = page.getByRole('textbox', { name: '콘솔 입력', exact: true });
    const run = () => page.getByRole('button', { name: /^실행\s/ }).click();
    async function waitIdle() {
      await page.getByRole('button', { name: /^실행\s/ }).waitFor({ timeout: 30000 });
    }
    const basicTimes = [];
    for (let index = 0; index < 3; index++) {
      await editor.fill("print('빠른 실행')");
      const started = Date.now();
      await run(); await waitIdle();
      basicTimes.push(Date.now() - started);
      assert.equal((await terminal.textContent()).trimEnd(), '빠른 실행');
    }
    assert.ok(requests.some(url => url.endsWith('/skulpt-worker.js')));
    assert.ok(!requests.some(url => /\/pyodide\/|\/python-worker\.mjs/.test(url)), 'basic code must not load CPython/NumPy');
    console.log(`Basic browser execution (ms): ${basicTimes.join(', ')}`);
    await editor.fill("print('시작', end='!')\na = eval(input('첫 값: '))\nb = int(input('둘째 값: '))\nprint(a + b)");
    await run();
    console.log('Started interactive Python');
    assert.equal(await page.getByRole('combobox', { name: 'Python 실행 환경' }).count(), 0);
    await input.waitFor({ timeout: 30000 });
    assert.equal(await terminal.textContent(), '시작!');
    assert.match(await page.locator('.terminalInputRow').innerText(), /첫 값:/);
    await input.fill('2\n3'); await input.press('Enter');
    await waitIdle();
    assert.equal((await terminal.textContent()).trimEnd(), '시작!5');
    assert.deepEqual(await page.locator('.terminalHint code').allTextContents(), ['2', '3']);

    await editor.fill("a = input('빈 값: ')\nb = input('한글: ')\nprint(repr(a), len(b), b[-2:])");
    await run(); await input.waitFor();
    await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('.terminalInputRow span')?.textContent === '한글: ');
    await input.fill('가🙂'.repeat(20000)); await input.press('Enter');
    await waitIdle();
    assert.equal((await terminal.textContent()).trimEnd(), "'' 40000 가🙂");

    await editor.fill("try:\n    input('대기: ')\nexcept:\n    print('caught')\nprint('취소된 실행')");
    await run(); await input.waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: /실행중지/ }).click();
    await waitIdle(); assert.equal(await input.count(), 0);
    await editor.fill("print('새 실행')\nwhile True:\n    pass");
    await run();
    await page.waitForFunction(() => document.querySelector('.terminal pre')?.textContent.trimEnd() === '새 실행');
    await page.getByRole('button', { name: /실행중지/ }).click();
    await waitIdle(); assert.equal((await terminal.textContent()).trimEnd(), '새 실행');

    await editor.fill("import numpy as np\nprint(np.array([1, 2, 3]).sum())\nprint(eval('1 / 2'))");
    await run(); await waitIdle();
    assert.equal((await terminal.textContent()).trimEnd(), '6\n0.5');
    await editor.fill("print(1)\nprint(1 / 0)");
    await run(); await waitIdle();
    assert.match(await terminal.textContent(), /코드 2번째 줄/);
    assert.match(await terminal.textContent(), /0으로 나눌 수 없습니다/);
    await editor.fill("# pyoj: engine=pyodide\nprint('명시적 선택')");
    await run(); await waitIdle();
    assert.equal((await terminal.textContent()).trimEnd(), '명시적 선택');
    assert.ok(requests.some(url => url.endsWith('/python-worker.mjs')));
    console.log('Production browser: isolated Worker, partial output, prompts, multiline queued input, input/loop cancellation, rerun, eval, NumPy and Korean errors passed.');
  } finally {
    await browser?.close();
    server?.closeAllConnections();
    await new Promise(resolve => server ? server.close(resolve) : resolve());
    await app.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
