const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHmac } = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const Y = require('yjs');
function load(file, overrides, extras = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(extras), code)(name => name in overrides ? overrides[name] : require(name), mod, mod.exports, ...Object.values(extras));
  return mod.exports;
}
const student = { id: '00000000-0000-4000-8000-000000000001', student_no: '2301', name: '학생' };
test('live credentials reject unauthorized teachers and other student identities; scope signed tokens', async () => {
  const old = process.env.SUPABASE_JWT_SECRET;
  process.env.SUPABASE_JWT_SECRET = 'test-only-signing-secret';
  let queries = 0;
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: student }) };
  const route = load('app/api/live-code/route.ts', {
    '@/lib/supabase-admin': { createSupabaseAdmin: () => ({ from: () => { queries++; return query; } }) },
    '@/lib/teacher-auth': { isTeacherRequestAuthenticated: request => request.headers.get('x-test-teacher') === 'yes' }
  });
  const call = (body, teacher = false) => route.POST(new NextRequest('http://localhost/api/live-code', { method: 'POST', headers: teacher ? { 'x-test-teacher': 'yes' } : {}, body: JSON.stringify(body) }));
  try {
    assert.equal((await call({ role: 'teacher', studentId: student.id })).status, 401);
    assert.equal(queries, 0);
    assert.equal((await call({ studentId: student.id, studentNo: '2302', name: student.name })).status, 403);
    assert.equal((await call({ studentId: student.id, studentNo: student.student_no, name: '다른 이름' })).status, 403);
    const response = await call({ studentId: student.id, studentNo: student.student_no, name: student.name });
    assert.equal(response.status, 200);
    const { token, topic } = await response.json();
    const [header, payload, signature] = token.split('.');
    assert.equal(signature, createHmac('sha256', process.env.SUPABASE_JWT_SECRET).update(`${header}.${payload}`).digest('base64url'));
    const claims = JSON.parse(Buffer.from(payload, 'base64url'));
    assert.equal(claims.role, 'pyoj_live_code');
    assert.equal(claims.app_metadata.live_code_topic, topic);
    assert.equal(topic, `live-code:${student.id}`);
    assert.equal(claims.exp - claims.iat, 300);
    assert.equal(claims.app_metadata.live_code_role, 'student');
    const teacherResponse = await call({ role: 'teacher', studentId: student.id }, true);
    assert.equal(teacherResponse.status, 200);
    assert.equal(JSON.parse(Buffer.from((await teacherResponse.json()).token.split('.')[1], 'base64url')).app_metadata.live_code_role, 'teacher');
  } finally { if (old === undefined) delete process.env.SUPABASE_JWT_SECRET; else process.env.SUPABASE_JWT_SECRET = old; }
});

test('live provider merges simultaneous edits, repairs lost edits and rejects obsolete problem sessions', async () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test';
  const sessions = [];
  function mount(teacher, active) {
    const states = [], effects = [], timers = []; let index = 0;
    const session = { states, timers, drop: false, handler: null };
    sessions.push(session);
    const channel = {
      on: (_type, _filter, handler) => { session.handler = handler; return channel; },
      subscribe: handler => { session.connection = handler; handler('SUBSCRIBED'); },
      send: async ({ payload }) => { if (!session.drop) for (const other of sessions) if (other !== session && other.handler) other.handler({ payload }); }
    };
    const module = load('app/live-code.tsx', {
      react: { useState: initial => { const n = index++; states[n] = initial; return [initial, value => { states[n] = value; }]; }, useEffect: fn => effects.push(fn), useRef: value => ({ current: value }), useMemo: fn => fn() },
      '@supabase/supabase-js': { createClient: () => ({ realtime: { setAuth: async () => {} }, channel: () => channel, removeAllChannels: async () => { session.handler = null; } }) }
    }, { fetch: async () => ({ ok: true, json: async () => ({ token: 'test', topic: 'live-code:test' }) }), setInterval: fn => { timers.push(fn); return timers.length; }, clearInterval: () => {} });
    module.useLiveCode(student, active, teacher);
    session.cleanup = effects[0](); return session;
  }
  const tick = () => new Promise(resolve => setImmediate(resolve));
  let s, t, t2;
  try {
    s = mount(false, { key: 'p1', title: '문제 1', code: 'print(1)' }); await tick();
    t = mount(true, null); await tick();
    assert.equal(t.states[0].doc.getText('code').toString(), 'print(1)');
    s.drop = true; t.drop = true;
    s.states[0].doc.getText('code').insert(0, '# 학생\n');
    t.states[0].doc.getText('code').insert(0, '# 선생님\n');
    s.drop = false; t.drop = false; t.timers[0]();
    assert.equal(s.states[0].doc.getText('code').toString(), t.states[0].doc.getText('code').toString());
    assert.match(s.states[0].doc.getText('code').toString(), /학생/);
    assert.match(s.states[0].doc.getText('code').toString(), /선생님/);
    t2 = mount(true, null); await tick();
    assert.equal(t2.states[0].doc.getText('code').toString(), s.states[0].doc.getText('code').toString());
    t.connection('CHANNEL_ERROR');
    assert.equal(t.states[2], false);
    t.connection('SUBSCRIBED');
    assert.equal(t.states[2], true);
    const oldEpoch = t.states[0].epoch;
    const next = new Y.Doc(); next.getText('code').insert(0, 'print(2)');
    const update = Buffer.from(Y.encodeStateAsUpdate(next)).toString('base64');
    t.handler({ payload: { type: 'snapshot', key: 'p2', title: '문제 2', epoch: 'new-epoch', startedAt: Date.now() + 100, update } });
    s.timers[0]();
    assert.equal(t.states[0].key, 'p2');
    t.handler({ payload: { type: 'update', epoch: oldEpoch, update } });
    assert.equal(t.states[0].doc.getText('code').toString(), 'print(2)');
    next.destroy();
  } finally {
    s?.cleanup(); t?.cleanup(); t2?.cleanup();
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey;
  }
});
