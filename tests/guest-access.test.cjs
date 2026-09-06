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

function queryReturning(data, error = null) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data, error }),
    single: async () => ({ data, error })
  };
  return query;
}

test("valid guests receive the full curriculum, including unpublished and class-scoped problems", async () => {
  const { NextRequest } = require("next/server");
  const calls = [];
  const db = { from: table => {
    assert.equal(table, "students");
    return queryReturning({ id: "guest-1" });
  } };
  const { GET } = load("app/api/curriculum/route.ts", {
    "@/lib/curriculum-server": {
      loadCurriculum: async (...args) => {
        calls.push(args);
        return { books: [{ id: "book" }], problems: [{ id: "private-problem" }] };
      }
    },
    "@/lib/supabase-admin": { createSupabaseAdmin: () => db },
    "@/lib/student-class": { getStudentClassId: () => "1-1" }
  });

  const response = await GET(new NextRequest("http://localhost/api/curriculum", {
    headers: { "x-pyoj-guest-token": "g".repeat(32) }
  }));

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], false);
  assert.equal(calls[0][2], null);
});

test("logged-in students receive only problems published to their class", async () => {
  const { NextRequest } = require("next/server");
  const calls = [];
  const db = { from: () => queryReturning({ student_no: "1203", is_guest: false }) };
  const { GET } = load("app/api/curriculum/route.ts", {
    "@/lib/curriculum-server": {
      loadCurriculum: async (...args) => {
        calls.push(args);
        return { books: [{ id: "book" }], problems: [{ id: "assigned-problem" }] };
      }
    },
    "@/lib/supabase-admin": { createSupabaseAdmin: () => db },
    "@/lib/student-class": { getStudentClassId: () => "1-2" }
  });

  const response = await GET(new NextRequest("http://localhost/api/curriculum", {
    headers: { "x-pyoj-student-id": "student-1" }
  }));

  assert.equal(response.status, 200);
  assert.equal(calls[0][1], true);
  assert.equal(calls[0][2], "1-2");
});

test("guests can solve unpublished and class-scoped problems", () => {
  const { canAccessPracticeProblem } = load("lib/problem-access.ts", {
    "./student-class": { getStudentClassId: () => null }
  });

  assert.equal(canAccessPracticeProblem(
    { student_no: "비로그인-ABC123", is_guest: true },
    { is_published: false, visibility_scope: "classes", visible_class_ids: ["1-1"] }
  ), true);
});

test("logged-in students cannot solve unpublished or other-class problems", () => {
  const { canAccessPracticeProblem } = load("lib/problem-access.ts", {
    "./student-class": { getStudentClassId: () => "1-2" }
  });
  const student = { student_no: "1203", is_guest: false };

  assert.equal(canAccessPracticeProblem(
    student,
    { is_published: false, visibility_scope: "all", visible_class_ids: [] }
  ), false);
  assert.equal(canAccessPracticeProblem(
    student,
    { is_published: true, visibility_scope: "classes", visible_class_ids: ["1-1"] }
  ), false);
  assert.equal(canAccessPracticeProblem(
    student,
    { is_published: true, visibility_scope: "classes", visible_class_ids: ["1-2"] }
  ), true);
});
