"use client";

import {
  BookOpen,
  CheckCircle2,
  CircleUserRound,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Play,
  Send,
  Sparkles
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { judgePythonSubmission } from "@/lib/judge";
import { problems } from "@/lib/problems";
import {
  findOrCreateStudent,
  isSupabaseConfigured,
  listSubmissions,
  saveSubmission
} from "@/lib/supabase";
import type { Student, Submission } from "@/lib/types";

type View = "student" | "teacher";

export default function Home() {
  const [view, setView] = useState<View>("student");
  const [student, setStudent] = useState<Student | null>(null);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState(problems[0].id);
  const selectedProblem = problems.find((problem) => problem.id === selectedProblemId) ?? problems[0];
  const [code, setCode] = useState(selectedProblem.starterCode);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ReturnType<typeof judgePythonSubmission> | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dashboard = useMemo(() => {
    const accepted = submissions.filter((submission) => submission.status === "accepted").length;
    const triedStudents = new Set(submissions.map((submission) => submission.student_id)).size;
    const total = submissions.length;
    const rate = total === 0 ? 0 : Math.round((accepted / total) * 100);
    return { accepted, total, rate, triedStudents };
  }, [submissions]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(studentNo)) {
      setNotice("학번은 4자리 숫자로 입력해주세요.");
      return;
    }
    if (name.trim().length < 2) {
      setNotice("이름을 2글자 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const signedIn = await findOrCreateStudent(studentNo, name);
      setStudent(signedIn);
      setNotice(`${signedIn.name}님, 오늘도 한 문제씩 차근차근 가볼까요?`);
    } catch {
      setNotice("로그인 중 문제가 생겼어요. Supabase 설정과 테이블을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function changeProblem(problemId: string) {
    const problem = problems.find((item) => item.id === problemId) ?? problems[0];
    setSelectedProblemId(problem.id);
    setCode(problem.starterCode);
    setResult(null);
  }

  async function submitCode() {
    if (!student) {
      setNotice("먼저 학번과 이름으로 로그인해주세요.");
      return;
    }

    const judged = judgePythonSubmission(selectedProblem, code);
    setResult(judged);

    try {
      await saveSubmission({
        student_id: student.id,
        problem_id: selectedProblem.id,
        code,
        status: judged.status,
        passed_count: judged.passedCount,
        total_count: judged.totalCount,
        feedback: judged.feedback
      });
      setNotice("제출 기록이 저장됐어요.");
    } catch {
      setNotice("채점은 완료됐지만 제출 기록 저장에 실패했어요.");
    }
  }

  async function refreshDashboard() {
    setLoading(true);
    try {
      setSubmissions(await listSubmissions());
    } catch {
      setNotice("대시보드를 불러오지 못했어요. Supabase 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark">
            <Code2 size={24} />
          </div>
          <div>
            <strong>PyOJ Classroom</strong>
            <span>파이썬 첫걸음을 위한 수업형 Online Judge</span>
          </div>
        </div>
        <div className="modeSwitch" aria-label="화면 선택">
          <button className={view === "student" ? "active" : ""} onClick={() => setView("student")}>
            <GraduationCap size={18} />
            학생
          </button>
          <button
            className={view === "teacher" ? "active" : ""}
            onClick={() => {
              setView("teacher");
              void refreshDashboard();
            }}
          >
            <LayoutDashboard size={18} />
            교사
          </button>
        </div>
      </header>

      {notice && <div className="notice">{notice}</div>}

      {view === "student" ? (
        <section className="studentGrid">
          <aside className="sidebar">
            <form className="loginPanel" onSubmit={handleLogin}>
              <div className="sectionTitle">
                <CircleUserRound size={18} />
                로그인
              </div>
              <label>
                학번
                <input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="예: 1203"
                  value={studentNo}
                  onChange={(event) => setStudentNo(event.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label>
                이름
                <input
                  placeholder="예: 민수"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button className="primaryButton" disabled={loading}>
                <CheckCircle2 size={18} />
                {student ? "다시 확인" : "시작하기"}
              </button>
              <p className="helperText">
                최초 로그인 시 자동 등록되고, 다음부터 같은 학번과 이름으로 이어서 사용할 수 있어요.
              </p>
            </form>

            <div className="problemList">
              <div className="sectionTitle">
                <BookOpen size={18} />
                오늘의 문제
              </div>
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  className={problem.id === selectedProblem.id ? "problemItem active" : "problemItem"}
                  onClick={() => changeProblem(problem.id)}
                >
                  <span>{String(problem.order).padStart(2, "0")}</span>
                  <strong>{problem.title}</strong>
                  <em>{problem.unit}</em>
                </button>
              ))}
            </div>
          </aside>

          <section className="workspace">
            <article className="problemPane">
              <div className="problemHeader">
                <div>
                  <span className="pill">{selectedProblem.unit}</span>
                  <h1>{selectedProblem.title}</h1>
                </div>
                <span className={`level ${selectedProblem.level}`}>
                  {selectedProblem.level === "start"
                    ? "입문"
                    : selectedProblem.level === "practice"
                      ? "연습"
                      : "도전"}
                </span>
              </div>

              <ProblemBlock title="문제" body={selectedProblem.statement} />
              <ProblemBlock title="입력" body={selectedProblem.inputDescription} />
              <ProblemBlock title="출력" body={selectedProblem.outputDescription} />

              <div className="exampleBox">
                <h2>예시</h2>
                <div className="ioGrid">
                  <div>
                    <strong>입력</strong>
                    <pre>{selectedProblem.examples[0].input || "입력 없음"}</pre>
                  </div>
                  <div>
                    <strong>출력</strong>
                    <pre>{selectedProblem.examples[0].output}</pre>
                  </div>
                </div>
              </div>

              <div className="hint">
                <Lightbulb size={18} />
                {selectedProblem.hint}
              </div>
            </article>

            <article className="idePane">
              <div className="ideHeader">
                <div>
                  <strong>파이썬 IDE</strong>
                  <span>{student ? `${student.student_no} ${student.name}` : "로그인 후 제출 가능"}</span>
                </div>
                <div className="ideActions">
                  <button className="ghostButton" onClick={() => setCode(selectedProblem.starterCode)}>
                    <Play size={17} />
                    초기 코드
                  </button>
                  <button className="primaryButton" onClick={submitCode}>
                    <Send size={17} />
                    제출
                  </button>
                </div>
              </div>
              <textarea
                className="codeEditor"
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />

              <div className={result?.status === "accepted" ? "result accepted" : "result"}>
                <strong>{result ? result.feedback : "코드를 제출하면 결과가 여기에 표시됩니다."}</strong>
                {result && (
                  <div className="caseList">
                    {result.cases.map((testCase, index) => (
                      <div key={`${testCase.input}-${index}`} className="caseRow">
                        <span>{index + 1}</span>
                        <code>{testCase.input || "입력 없음"}</code>
                        <code>{testCase.actual || "출력 없음"}</code>
                        <b>{testCase.passed ? "통과" : "확인"}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>
        </section>
      ) : (
        <section className="teacherView">
          <div className="dashboardHeader">
            <div>
              <span className="pill">교사 수업 지원</span>
              <h1>학급 대시보드</h1>
            </div>
            <button className="primaryButton" onClick={refreshDashboard} disabled={loading}>
              <Sparkles size={18} />
              새로고침
            </button>
          </div>

          <div className="metrics">
            <Metric label="총 제출" value={`${dashboard.total}`} />
            <Metric label="정답 제출" value={`${dashboard.accepted}`} />
            <Metric label="정답률" value={`${dashboard.rate}%`} />
            <Metric label="참여 학생" value={`${dashboard.triedStudents}`} />
          </div>

          <div className="teacherGrid">
            <section className="panel">
              <h2>문제 생성 흐름</h2>
              <div className="roadmap">
                <span>문제 설명</span>
                <span>예제 입출력</span>
                <span>테스트케이스</span>
                <span>학급 배정</span>
              </div>
              <p>
                초급 수업에서는 문제, 입력, 출력, 예시를 한 화면에서 작성하고 테스트케이스는 표처럼
                추가하는 방식이 가장 덜 부담스럽습니다.
              </p>
            </section>

            <section className="panel">
              <h2>최근 제출 기록</h2>
              <div className="submissionTable">
                {submissions.length === 0 ? (
                  <p className="empty">아직 제출 기록이 없습니다.</p>
                ) : (
                  submissions.slice(0, 8).map((submission) => (
                    <div key={submission.id} className="submissionRow">
                      <strong>
                        {submission.students?.student_no ?? "----"} {submission.students?.name ?? "학생"}
                      </strong>
                      <span>{problemTitle(submission.problem_id)}</span>
                      <b className={submission.status === "accepted" ? "ok" : "wait"}>
                        {submission.passed_count}/{submission.total_count}
                      </b>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="supabaseNote">
            Supabase 상태: {isSupabaseConfigured ? "연결 환경변수 감지됨" : "미설정, 현재 브라우저 저장소로 데모 동작 중"}
          </div>
        </section>
      )}
    </main>
  );
}

function ProblemBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="problemBlock">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function problemTitle(problemId: string) {
  return problems.find((problem) => problem.id === problemId)?.title ?? problemId;
}
