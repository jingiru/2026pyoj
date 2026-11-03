const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function load(relative, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const nativeRequire = createRequire(filename);
  const localRequire = name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("./")) {
      return load(
        path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".ts")),
        overrides
      );
    }
    return nativeRequire(name);
  };
  localRequire.resolve = nativeRequire.resolve;
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(localRequire, mod, mod.exports);
  return mod.exports;
}


const { NextRequest } = require("next/server");
function harness(initial = [], race = false) {
  const rows = structuredClone(initial);
  const scores = [{ participant_id: "p1", score: 9 }];
  let serial = 0;
  const db = { from(table) {
    let filters = [], patch;
    const q = {
      select() { return q; },
      eq(key, value) { filters.push([key, value]); return q; },
      update(value) { patch = value; return q; },
      async maybeSingle() {
        if (table === "challenges") return { data: { id: "c1" }, error: null };
        const row = rows.find(r => filters.every(([k,v]) => r[k] === v));
        if (row && patch) Object.assign(row, patch);
        return { data: row ? {...row} : null, error: null };
      },
      async insert(value) {
        if (race) { race = false; rows.push({ id: "p1", ...value, token_hash: "racing-token" }); return { error: { code: "23505" } }; }
        rows.push({ id: "p" + (rows.length + 1), ...value }); return { error: null };
      }
    }; return q;
  }};
  const { POST } = load("app/api/challenges/session/route.ts", {
    "@/lib/challenge-server": {
      challengeDb: () => db, newIdentity: () => "new-token-" + (++serial), tokenHash: x => "hash:" + x,
      setIdentity: (response, token) => response.cookies.set("pyoj_challenge_identity", token),
      fail: (error, status = 400) => Response.json({ ok: false, message: error.message }, { status })
    },
    "@/lib/challenge-types": {}
  });
  return { rows, scores, enter: (studentNo = "3225", name = "최다솜", cookie = "") => POST(new NextRequest("https://example.test/api/challenges/session", {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ entryCode: "LLF359LM", studentNo, name })
  })) };
}
const participant = { id: "p1", challenge_id: "c1", student_no: "3225", name: "최다솜", token_hash: "old-token" };
for (const [label, cookie] of [["lost cookie after restart", ""], ["different browser or domain", "pyoj_challenge_identity=unrelated"], ["same browser", "pyoj_challenge_identity=old-token"]]) {
  test(label + " reconnects without losing participant or scores", async () => {
    const h = harness([participant]);
    const response = await h.enter("3225", " 최다솜 ", cookie);
    assert.equal(response.status, 200);
    assert.equal(h.rows.length, 1); assert.equal(h.rows[0].id, "p1");
    assert.equal(h.rows[0].token_hash, "hash:new-token-1");
    assert.deepEqual(h.scores, [{ participant_id: "p1", score: 9 }]);
    assert.match(response.headers.get("set-cookie"), /new-token-1/);
  });
}
test("same browser can enter as a different student without changing previous student", async () => {
  const h = harness([participant]);
  assert.equal((await h.enter("3226", "다른학생", "pyoj_challenge_identity=old-token")).status, 200);
  assert.deepEqual(h.rows[0], participant); assert.equal(h.rows.length, 2);
  assert.notEqual(h.rows[0].token_hash, h.rows[1].token_hash);
});
test("wrong name cannot replace an existing student's session", async () => {
  const h = harness([participant]);
  const response = await h.enter("3225", "다른이름");
  assert.equal(response.status, 409); assert.deepEqual(h.rows[0], participant);
  assert.equal(response.headers.get("set-cookie"), null);
});
test("concurrent first registration recovers using the existing participant", async () => {
  const h = harness([], true);
  assert.equal((await h.enter()).status, 200);
  assert.equal(h.rows.length, 1); assert.equal(h.rows[0].token_hash, "hash:new-token-1");
});
