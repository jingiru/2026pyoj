// Run after npm run build. Exercises the production Next bundle and real worker,
// replacing only the database transport with an isolated localhost fixture.
const assert = require("node:assert/strict");
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { once } = require("node:events");
const path = require("node:path");

async function main() {
  const participant = { id: "00000000-0000-4000-8000-000000000001", challenge_id: "00000000-0000-4000-8000-000000000002", student_no: "9991", name: "검증학생" };
  const receiptTime = new Date().toISOString();
  let saved;
  const database = http.createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const url = new URL(request.url, "http://localhost");
    response.setHeader("Content-Type", "application/json");
    if (url.pathname === "/rest/v1/challenge_participants") return response.end(JSON.stringify([participant]));
    if (url.pathname === "/rest/v1/rpc/challenge_receive_submission") {
      assert.equal(body.p_participant, participant.id);
      if (body.p_code === "# expired") { response.statusCode = 400; return response.end(JSON.stringify({ message: "제출 시간이 종료되었습니다." })); }
      return response.end(JSON.stringify({ fresh: true, submission: { id: randomUUID(), received_at: receiptTime }, problem: { id: "sum", testCases: [{ input: "2\n3", output: "5" }, { input: "-1\n4", output: "3" }] } }));
    }
    if (url.pathname === "/rest/v1/challenge_submissions" && request.method === "PATCH") {
      saved = body;
      return response.end(JSON.stringify({ ...body, id: randomUUID(), received_at: receiptTime }));
    }
    response.statusCode = 404; response.end(JSON.stringify({ message: "Unexpected fixture request" }));
  });
  database.listen(0, "127.0.0.1"); await once(database, "listening");
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${database.address().port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "local-fixture-only";
  const next = require("next");
  const app = next({ dev: false, dir: path.resolve(__dirname, "..") });
  let server;
  try {
    await app.prepare();
    server = http.createServer(app.getRequestHandler()); server.listen(0, "127.0.0.1"); await once(server, "listening");
    const url = `http://127.0.0.1:${server.address().port}/api/challenges/submit`;
    async function submit(code, authenticated = true) {
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(authenticated ? { cookie: `pyoj_challenge_identity=${"a".repeat(64)}` } : {}) }, body: JSON.stringify({ challengeId: participant.challenge_id, problemId: "sum", code, requestId: randomUUID(), status: "accepted" }) });
    }
    let response = await submit("print(int(input()) + int(input()))");
    let result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.submission.status, "accepted", JSON.stringify(result));
    assert.equal(result.submission.passed_count, 2);
    assert.equal(result.submission.received_at, receiptTime);
    response = await submit("print(5)"); result = await response.json();
    assert.equal(result.submission.status, "wrong_answer", JSON.stringify(result));
    assert.equal(saved.status, "wrong_answer");
    assert.equal((await submit("# expired")).status, 409);
    assert.equal((await submit("print(1)", false)).status, 401);
    process.stdout.write("Production bundle: real worker grading, forged score rejection, deadline refusal and participant authentication passed.\n");
  } finally {
    server?.closeAllConnections(); await new Promise(resolve => server ? server.close(resolve) : resolve());
    await app.close(); database.closeAllConnections(); await new Promise(resolve => database.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
