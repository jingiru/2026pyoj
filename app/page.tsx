"use client";

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type CompletionContext
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  insertBlankLine,
  copyLineDown
} from "@codemirror/commands";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { EditorSelection, Prec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  Play,
  Send,
  Sparkles,
  X
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { judgePythonSubmission } from "@/lib/judge";
import { problemBooks, problems } from "@/lib/problems";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";
import {
  findOrCreateStudent,
  isSupabaseConfigured,
  listSubmissions,
  saveSubmission
} from "@/lib/supabase";
import type { Student } from "@/lib/types";

type Screen = "home" | "practice" | "solve" | "teacher";
type ColorMode = "light" | "dark";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(problemBooks[0].id);
  const selectedProblems = problems.filter((problem) => problem.bookId === selectedBookId);
  const fallbackProblem = selectedProblems[0] ?? problems[0];
  const [selectedProblemId, setSelectedProblemId] = useState(fallbackProblem.id);
  const selectedProblem = problems.find((problem) => problem.id === selectedProblemId) ?? fallbackProblem;
  const [code, setCode] = useState(selectedProblem.starterCode);
  const [practiceCode, setPracticeCode] = useState("name = input()\nprint('안녕, ' + name)");
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "Shift + Enter로 실행하세요.",
    "input()이 있으면 IDLE처럼 프롬프트 옆에 입력할 수 있어요."
  ]);
  const [consoleInput, setConsoleInput] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [isPracticeRunning, setIsPracticeRunning] = useState(false);
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const consoleInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    if (pendingPrompt) consoleInputRef.current?.focus();
  }, [pendingPrompt]);

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
      setLoginOpen(false);
      setScreen("solve");
      setNotice(`${signedIn.name}님, 문제 풀이를 시작해볼까요?`);
    } catch {
      setNotice("로그인 중 문제가 생겼어요. Supabase 설정과 테이블을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function enterSolveMode() {
    if (student) {
      setScreen("solve");
      return;
    }
    setLoginOpen(true);
  }

  function changeBook(bookId: string) {
    const nextProblem = problems.find((problem) => problem.bookId === bookId);
    setSelectedBookId(bookId);
    if (nextProblem) changeProblem(nextProblem.id);
  }

  function changeProblem(problemId: string) {
    const problem = problems.find((item) => item.id === problemId) ?? problems[0];
    setSelectedProblemId(problem.id);
    setSelectedBookId(problem.bookId);
    setCode(problem.starterCode);
    setResult(null);
  }

  async function runPractice() {
    if (isPracticeRunning) return;
    setIsPracticeRunning(true);
    setPendingPrompt("");
    setConsoleInput("");
    setConsoleLines(["$ python main.py"]);

    await runPythonWithSkulpt(practiceCode, {
      output: (text) => {
        setConsoleLines((lines) => appendConsoleText(lines, text));
      },
      error: (text) => {
        setConsoleLines((lines) => [...lines, text]);
      },
      input: (prompt) =>
        new Promise((resolve) => {
          inputResolverRef.current = resolve;
          setPendingPrompt(prompt);
        })
    });

    setPendingPrompt("");
    setIsPracticeRunning(false);
  }

  function submitConsoleInput(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !inputResolverRef.current) return;
    event.preventDefault();
    const resolver = inputResolverRef.current;
    inputResolverRef.current = null;
    setConsoleLines((lines) => [...lines, `${pendingPrompt}${consoleInput}`]);
    setPendingPrompt("");
    setConsoleInput("");
    resolver(consoleInput);
  }

  async function submitCode() {
    if (!student) {
      setLoginOpen(true);
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
    <main className={`shell ${colorMode}Mode`}>
      <Header
        screen={screen}
        student={student}
        colorMode={colorMode}
        onHome={() => setScreen("home")}
        onPractice={() => setScreen("practice")}
        onSolve={enterSolveMode}
        onTeacher={() => {
          setScreen("teacher");
          void refreshDashboard();
        }}
        onToggleColorMode={() => setColorMode((mode) => (mode === "dark" ? "light" : "dark"))}
      />

      {notice && <div className="notice">{notice}</div>}

      {screen === "home" && <HomeChoice onPractice={() => setScreen("practice")} onSolve={enterSolveMode} />}

      {screen === "practice" && (
        <section className="practiceView">
          <div className="practiceIntro">
            <span className="pill">코딩 연습</span>
            <h1>파이썬 연습을 위한 통합 개발 환경(IDE)</h1>
          </div>
          <div className="practiceGrid">
            <article className="idePane">
              <div className="ideHeader">
                <div>
                  <strong>파이썬 코드를 작성해보세요!</strong>
                  <span>Ctrl+D, Ctrl+Enter, Ctrl+Shift+D 단축키를 사용할 수 있어요.</span>
                </div>
                <button className="primaryButton" onClick={runPractice}>
                  <Play size={17} />
                  실행
                  <kbd>Shift + Enter</kbd>
                </button>
              </div>
              <CodeEditor
                value={practiceCode}
                onChange={setPracticeCode}
                onRun={runPractice}
                colorMode={colorMode}
              />
            </article>
            <aside className="consolePane">
              <div className="consoleHeader">
                <strong>콘솔</strong>
                <span>{pendingPrompt ? "입력 대기 중" : isPracticeRunning ? "실행 중" : "실행 결과"}</span>
              </div>
              <div className="terminal" aria-live="polite">
                <pre>{consoleLines.join("\n")}</pre>
                <div className={pendingPrompt ? "terminalInputRow active" : "terminalInputRow"}>
                  <span>{pendingPrompt}</span>
                  <input
                    value={consoleInput}
                    ref={consoleInputRef}
                    onChange={(event) => setConsoleInput(event.target.value)}
                    onKeyDown={submitConsoleInput}
                    disabled={!pendingPrompt}
                    placeholder={pendingPrompt ? "" : "input() 실행 시 여기에 커서가 나타납니다"}
                    aria-label="콘솔 입력"
                    autoFocus={Boolean(pendingPrompt)}
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {screen === "solve" && (
        <section className="solveGrid">
          <aside className="bookSidebar">
            <div className="sectionTitle">
              <BookOpen size={18} />
              문제집
            </div>
            {problemBooks.map((book) => {
              const count = problems.filter((problem) => problem.bookId === book.id).length;
              return (
                <button
                  key={book.id}
                  className={book.id === selectedBookId ? "bookItem active" : "bookItem"}
                  onClick={() => changeBook(book.id)}
                >
                  <span>{String(book.order).padStart(2, "0")}</span>
                  <strong>{book.title}</strong>
                  <em>{count > 0 ? `${count}문제` : "준비 중"}</em>
                </button>
              );
            })}
          </aside>

          <aside className="problemList">
            <div className="sectionTitle">문항</div>
            {selectedProblems.length === 0 ? (
              <p className="empty">이 문제집의 문항은 곧 추가됩니다.</p>
            ) : (
              selectedProblems.map((problem) => (
                <button
                  key={problem.id}
                  className={problem.id === selectedProblem.id ? "problemItem active" : "problemItem"}
                  onClick={() => changeProblem(problem.id)}
                >
                  <span>{String(problem.order).padStart(2, "0")}</span>
                  <strong>{problem.title}</strong>
                  <em>{problem.unit}</em>
                </button>
              ))
            )}
          </aside>

          <section className="workspace">
            <ProblemPane selectedProblem={selectedProblem} />
            <article className="idePane">
              <div className="ideHeader">
                <div>
                  <strong>문제 풀이 IDE</strong>
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
              <ResultPanel result={result} />
            </article>
          </section>
        </section>
      )}

      {screen === "teacher" && (
        <TeacherDashboard
          dashboard={dashboard}
          loading={loading}
          submissions={submissions}
          onRefresh={refreshDashboard}
        />
      )}

      {loginOpen && (
        <div className="modalBackdrop" role="presentation">
          <div className="loginModal" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button className="iconButton closeButton" onClick={() => setLoginOpen(false)} aria-label="닫기">
              <X size={18} />
            </button>
            <div className="sectionTitle" id="login-title">
              <LogIn size={18} />
              문제 풀이 로그인
            </div>
            <form onSubmit={handleLogin}>
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
                <input placeholder="예: 민수" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <button className="primaryButton wideButton" disabled={loading}>
                <CheckCircle2 size={18} />
                시작하기
              </button>
            </form>
            <p className="helperText">
              처음이면 자동 등록되고, 다음부터 같은 학번과 이름으로 이어서 풀 수 있어요.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function Header({
  screen,
  student,
  colorMode,
  onHome,
  onPractice,
  onSolve,
  onTeacher,
  onToggleColorMode
}: {
  screen: Screen;
  student: Student | null;
  colorMode: ColorMode;
  onHome: () => void;
  onPractice: () => void;
  onSolve: () => void;
  onTeacher: () => void;
  onToggleColorMode: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand brandButton" onClick={onHome}>
        <div className="brandMark">
          <Code2 size={24} />
        </div>
        <div>
          <strong>Jingiru Python Beginner Lab</strong>
          <span>{student ? `${student.student_no} ${student.name}` : "초보자를 위한 파이썬 첫걸음 by 진기루T"}</span>
        </div>
      </button>
      <div className="modeSwitch" aria-label="화면 선택">
        <button className={screen === "practice" ? "active" : ""} onClick={onPractice}>
          <Code2 size={18} />
          연습
        </button>
        <button className={screen === "solve" ? "active" : ""} onClick={onSolve}>
          <GraduationCap size={18} />
          문제
        </button>
        <button className={screen === "teacher" ? "active" : ""} onClick={onTeacher}>
          <LayoutDashboard size={18} />
          교사
        </button>
        <button onClick={onToggleColorMode}>
          {colorMode === "dark" ? "화이트" : "다크"}
        </button>
      </div>
    </header>
  );
}

function HomeChoice({ onPractice, onSolve }: { onPractice: () => void; onSolve: () => void }) {
  return (
    <section className="choiceView">
      <div className="choiceHeader">
        <span className="pill">Jingiru Python Beginner Lab</span>
        <h1>오늘은 어떻게 시작할까요?</h1>
      </div>
      <div className="choiceGrid">
        <button className="choiceButton" onClick={onPractice}>
          <Code2 size={34} />
          <strong>코딩 연습</strong>
          <span>로그인 없이 코드를 써보고 바로 실행 결과를 확인합니다.</span>
        </button>
        <button className="choiceButton solve" onClick={onSolve}>
          <GraduationCap size={34} />
          <strong>문제 풀기</strong>
          <span>학번과 이름으로 로그인하고 문제집을 차근차근 풉니다.</span>
        </button>
      </div>
    </section>
  );
}

function CodeEditor({
  value,
  onChange,
  onRun,
  colorMode
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  colorMode: ColorMode;
}) {
  const extensions = useMemo(
    () => [
      lineNumbers(),
      history(),
      python(),
      pythonLanguage.data.of({ autocomplete: pythonCompletionSource }),
      autocompletion(),
      closeBrackets(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          backgroundColor: colorMode === "dark" ? "#111827" : "#ffffff",
          color: colorMode === "dark" ? "#e5e7eb" : "#1f2937",
          height: "100%"
        },
        ".cm-editor": {
          backgroundColor: colorMode === "dark" ? "#111827" : "#ffffff"
        },
        ".cm-scroller": {
          backgroundColor: colorMode === "dark" ? "#111827" : "#ffffff"
        },
        ".cm-content": {
          caretColor: colorMode === "dark" ? "#ffffff" : "#111827",
          fontFamily: "Consolas, 'Courier New', monospace",
          fontSize: "15px",
          lineHeight: "1.6",
          minHeight: "340px",
          padding: "18px"
        },
        ".cm-gutters": {
          backgroundColor: colorMode === "dark" ? "#0b1220" : "#f1f5f9",
          borderRight: `1px solid ${colorMode === "dark" ? "#1f2937" : "#d9dee8"}`,
          color: colorMode === "dark" ? "#64748b" : "#667085"
        },
        ".cm-activeLine": {
          backgroundColor: colorMode === "dark" ? "rgba(96, 165, 250, 0.12)" : "rgba(37, 99, 235, 0.08)"
        },
        ".cm-activeLineGutter": {
          backgroundColor: colorMode === "dark" ? "rgba(96, 165, 250, 0.12)" : "rgba(37, 99, 235, 0.08)"
        },
        ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
          backgroundColor: "rgba(59, 130, 246, 0.45)"
        },
        ".cm-tooltip": {
          borderRadius: "7px",
          overflow: "hidden"
        }
      }),
      Prec.highest(
        keymap.of([
          {
            key: "Shift-Enter",
            run: () => {
              onRun();
              return true;
            }
          },
          { key: "Ctrl-Enter", mac: "Cmd-Enter", run: insertBlankLine },
          { key: "Ctrl-Shift-d", mac: "Cmd-Shift-d", run: copyLineDown },
          { key: "Ctrl-d", mac: "Cmd-d", run: selectNextWordOccurrence },
          indentWithTab,
          ...closeBracketsKeymap,
          ...completionKeymap
        ])
      ),
      keymap.of([...defaultKeymap, ...historyKeymap])
    ],
    [colorMode, onRun]
  );

  return (
    <CodeMirror
      value={value}
      height="100%"
      basicSetup={false}
      extensions={extensions}
      onChange={onChange}
      theme={colorMode}
    />
  );
}

function pythonCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: [
      { label: "print", type: "function", apply: "print()" },
      { label: "input", type: "function", apply: "input()" },
      { label: "int", type: "function", apply: "int()" },
      { label: "str", type: "function", apply: "str()" },
      { label: "len", type: "function", apply: "len()" },
      { label: "range", type: "function", apply: "range()" },
      { label: "list", type: "function", apply: "list()" },
      { label: "append", type: "method", apply: "append()" },
      { label: "if", type: "keyword", apply: "if :\n    " },
      { label: "else", type: "keyword", apply: "else:\n    " },
      { label: "elif", type: "keyword", apply: "elif :\n    " },
      { label: "for", type: "keyword", apply: "for i in range():\n    " },
      { label: "while", type: "keyword", apply: "while :\n    " },
      { label: "def", type: "keyword", apply: "def name():\n    " },
      { label: "True", type: "constant" },
      { label: "False", type: "constant" }
    ]
  };
}

function selectNextWordOccurrence(view: EditorView) {
  const { state } = view;
  const main = state.selection.main;
  let query = state.sliceDoc(main.from, main.to);
  let from = main.to;

  if (!query) {
    const line = state.doc.lineAt(main.head);
    const before = state.sliceDoc(line.from, main.head);
    const after = state.sliceDoc(main.head, line.to);
    const beforeMatch = before.match(/[A-Za-z_][A-Za-z0-9_]*$/);
    const afterMatch = after.match(/^[A-Za-z0-9_]*/);
    if (!beforeMatch && !afterMatch?.[0]) return false;
    query = `${beforeMatch?.[0] ?? ""}${afterMatch?.[0] ?? ""}`;
    from = line.from + before.length + (afterMatch?.[0]?.length ?? 0);
  }

  if (!query.trim()) return false;

  const doc = state.doc.toString();
  let next = doc.indexOf(query, from);
  if (next === -1) next = doc.indexOf(query, 0);
  if (next === -1) return false;

  const range = EditorSelection.range(next, next + query.length);
  view.dispatch({
    selection: EditorSelection.create([...state.selection.ranges, range], state.selection.ranges.length),
    scrollIntoView: true
  });
  return true;
}

function appendConsoleText(lines: string[], text: string) {
  const chunks = text.replace(/\r\n/g, "\n").split("\n");
  const next = [...lines];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (chunk === "" && chunks.length === 1) continue;
    if (next.length === 0) {
      next.push(chunk);
    } else {
      next[next.length - 1] = `${next[next.length - 1]}${chunk}`;
    }
    if (index !== chunks.length - 1) next.push("");
  }

  return next;
}

function ProblemPane({ selectedProblem }: { selectedProblem: (typeof problems)[number] }) {
  return (
    <article className="problemPane">
      <div className="problemHeader">
        <div>
          <span className="pill">{selectedProblem.unit}</span>
          <h1>{selectedProblem.title}</h1>
        </div>
        <span className={`level ${selectedProblem.level}`}>
          {selectedProblem.level === "start" ? "입문" : selectedProblem.level === "practice" ? "연습" : "도전"}
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
  );
}

function ResultPanel({ result }: { result: ReturnType<typeof judgePythonSubmission> | null }) {
  return (
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
  );
}

function TeacherDashboard({
  dashboard,
  loading,
  submissions,
  onRefresh
}: {
  dashboard: { accepted: number; total: number; rate: number; triedStudents: number };
  loading: boolean;
  submissions: any[];
  onRefresh: () => void;
}) {
  return (
    <section className="teacherView">
      <div className="dashboardHeader">
        <div>
          <span className="pill">교사 수업 지원</span>
          <h1>학급 대시보드</h1>
        </div>
        <button className="primaryButton" onClick={onRefresh} disabled={loading}>
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
      <section className="panel">
        <h2>최근 제출 기록</h2>
        <div className="submissionTable">
          {submissions.length === 0 ? (
            <p className="empty">아직 제출 기록이 없습니다.</p>
          ) : (
            submissions.slice(0, 10).map((submission) => (
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
      <div className="supabaseNote">
        Supabase 상태: {isSupabaseConfigured ? "연결 환경변수 감지됨" : "미설정, 현재 브라우저 저장소로 데모 동작 중"}
      </div>
    </section>
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
