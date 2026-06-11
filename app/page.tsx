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
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorSelection, EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Send,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { judgePythonSubmission } from "@/lib/judge";
import { problemBooks, problems } from "@/lib/problems";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";
import {
  findOrCreateStudent,
  getDataErrorMessage,
  saveSubmission
} from "@/lib/supabase";
import type { Student, SubmissionWithStudent } from "@/lib/types";

type Screen = "home" | "practice" | "solve" | "teacher";
type ColorMode = "light" | "dark";

const PRACTICE_CODE_STORAGE_KEY = "pyoj:practice-code";
const SELECTED_PROBLEM_STORAGE_KEY = "pyoj:selected-problem";
const PROBLEM_CODE_STORAGE_PREFIX = "pyoj:problem-code:";
const DEFAULT_PROBLEM = problems.find((problem) => problem.bookId === problemBooks[0].id) ?? problems[0];

const sublimeDarkHighlight = HighlightStyle.define([
  { tag: tags.comment, color: "#75715e", fontStyle: "italic" },
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: "#f92672" },
  { tag: [tags.bool, tags.null], color: "#ae81ff" },
  { tag: [tags.number, tags.integer, tags.float], color: "#ae81ff" },
  { tag: [tags.string, tags.special(tags.string)], color: "#e6db74" },
  { tag: [tags.function(tags.variableName), tags.labelName], color: "#a6e22e" },
  { tag: [tags.className, tags.typeName], color: "#a6e22e", fontStyle: "italic" },
  { tag: [tags.definition(tags.variableName), tags.variableName], color: "#f8f8f2" },
  { tag: [tags.propertyName, tags.attributeName], color: "#66d9ef" },
  { tag: [tags.operator, tags.punctuation], color: "#f8f8f2" },
  { tag: tags.meta, color: "#66d9ef" }
]);

const sublimeLightHighlight = HighlightStyle.define([
  { tag: tags.comment, color: "#6a737d", fontStyle: "italic" },
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], color: "#d73a49" },
  { tag: [tags.bool, tags.null], color: "#6f42c1" },
  { tag: [tags.number, tags.integer, tags.float], color: "#6f42c1" },
  { tag: [tags.string, tags.special(tags.string)], color: "#8a6d00" },
  { tag: [tags.function(tags.variableName), tags.labelName], color: "#5a7d00" },
  { tag: [tags.className, tags.typeName], color: "#5a7d00", fontStyle: "italic" },
  { tag: [tags.definition(tags.variableName), tags.variableName], color: "#24292f" },
  { tag: [tags.propertyName, tags.attributeName], color: "#007a8a" },
  { tag: [tags.operator, tags.punctuation], color: "#24292f" },
  { tag: tags.meta, color: "#007a8a" }
]);

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [loginOpen, setLoginOpen] = useState(false);
  const [teacherLoginOpen, setTeacherLoginOpen] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherLoginError, setTeacherLoginError] = useState("");
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [teacherAuthReady, setTeacherAuthReady] = useState(false);
  const [teacherLoginLoading, setTeacherLoginLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(problemBooks[0].id);
  const selectedProblems = problems.filter((problem) => problem.bookId === selectedBookId);
  const fallbackProblem = selectedProblems[0] ?? DEFAULT_PROBLEM;
  const [selectedProblemId, setSelectedProblemId] = useState(DEFAULT_PROBLEM.id);
  const selectedProblem = problems.find((problem) => problem.id === selectedProblemId) ?? DEFAULT_PROBLEM;
  const [code, setCode] = useState(DEFAULT_PROBLEM.starterCode);
  const [practiceCode, setPracticeCode] = useState("print()");
  const [codeFontSize, setCodeFontSize] = useState(15);
  const [consoleFontSize, setConsoleFontSize] = useState(15);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    "Shift + Enter로 실행하세요.",
    "input()이 있으면 IDLE처럼 프롬프트 옆에 입력할 수 있어요."
  ]);
  const [consoleInput, setConsoleInput] = useState("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isPracticeRunning, setIsPracticeRunning] = useState(false);
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const queuedConsoleInputsRef = useRef<string[]>([]);
  const consoleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ReturnType<typeof judgePythonSubmission> | null>(null);
  const [solveConsoleLines, setSolveConsoleLines] = useState<string[]>([
    "실행 버튼 또는 Shift + Enter로 실행하세요."
  ]);
  const [solveConsoleInput, setSolveConsoleInput] = useState("");
  const [solveInputHistory, setSolveInputHistory] = useState<string[]>([]);
  const [solvePendingPrompt, setSolvePendingPrompt] = useState<string | null>(null);
  const [isSolveRunning, setIsSolveRunning] = useState(false);
  const solveInputResolverRef = useRef<((value: string) => void) | null>(null);
  const solveQueuedInputsRef = useRef<string[]>([]);
  const solveConsoleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [bookSidebarOpen, setBookSidebarOpen] = useState(true);
  const [problemListOpen, setProblemListOpen] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorStorageReady, setEditorStorageReady] = useState(false);

  const dashboard = useMemo(() => {
    const accepted = submissions.filter((submission) => submission.status === "accepted").length;
    const triedStudents = new Set(submissions.map((submission) => submission.student_id)).size;
    const total = submissions.length;
    const rate = total === 0 ? 0 : Math.round((accepted / total) * 100);
    return { accepted, total, rate, triedStudents };
  }, [submissions]);

  useEffect(() => {
    if (pendingPrompt !== null) consoleInputRef.current?.focus();
  }, [pendingPrompt]);

  useEffect(() => {
    if (solvePendingPrompt !== null) solveConsoleInputRef.current?.focus();
  }, [solvePendingPrompt]);

  useEffect(() => {
    if (!loginOpen && !teacherLoginOpen) return;

    function closeModalWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (teacherLoginOpen) {
        closeTeacherLogin();
      } else {
        setLoginOpen(false);
      }
    }

    window.addEventListener("keydown", closeModalWithEscape);
    return () => window.removeEventListener("keydown", closeModalWithEscape);
  }, [loginOpen, teacherLoginOpen]);

  useEffect(() => {
    let cancelled = false;

    async function restoreScreen() {
      const nextScreen = getScreenFromUrl();

      try {
        const response = await fetch("/api/teacher-session", { cache: "no-store" });
        const data = (await response.json()) as { ok?: boolean; message?: string };
        if (cancelled) return;

        if (!response.ok || !data.ok) {
          setIsTeacherAuthenticated(false);
          if (nextScreen === "teacher") {
            setScreen("home");
            setTeacherLoginError(data.message ?? "");
            setTeacherLoginOpen(true);
          } else {
            setScreen(nextScreen);
          }
          return;
        }

        setIsTeacherAuthenticated(true);
        setScreen(nextScreen);
        if (nextScreen === "teacher") void refreshDashboard();
      } catch {
        if (cancelled) return;
        setIsTeacherAuthenticated(false);
        setScreen(nextScreen === "teacher" ? "home" : nextScreen);
        if (nextScreen === "teacher") {
          setTeacherLoginError("교사 로그인 상태를 확인하지 못했습니다.");
          setTeacherLoginOpen(true);
        }
      } finally {
        if (!cancelled) setTeacherAuthReady(true);
      }
    }

    async function syncScreenFromUrl() {
      const nextScreen = getScreenFromUrl();
      if (nextScreen !== "teacher") {
        setScreen(nextScreen);
        return;
      }

      try {
        const response = await fetch("/api/teacher-session", { cache: "no-store" });
        const data = (await response.json()) as { ok?: boolean };
        if (!response.ok || !data.ok) {
          setIsTeacherAuthenticated(false);
          setScreen("home");
          setTeacherLoginOpen(true);
          return;
        }

        setIsTeacherAuthenticated(true);
        setScreen("teacher");
        void refreshDashboard();
      } catch {
        setIsTeacherAuthenticated(false);
        setScreen("home");
        setTeacherLoginError("교사 로그인 상태를 확인하지 못했습니다.");
        setTeacherLoginOpen(true);
      }
    }

    void restoreScreen();
    const handlePopState = () => void syncScreenFromUrl();
    window.addEventListener("popstate", handlePopState);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const savedPracticeCode = getStoredValue(PRACTICE_CODE_STORAGE_KEY);
    if (savedPracticeCode !== null) setPracticeCode(savedPracticeCode);

    const savedProblemId = getStoredValue(SELECTED_PROBLEM_STORAGE_KEY);
    const savedProblem = problems.find((problem) => problem.id === savedProblemId);
    if (savedProblem) {
      setSelectedProblemId(savedProblem.id);
      setSelectedBookId(savedProblem.bookId);
      setCode(getSavedProblemCode(savedProblem.id) ?? savedProblem.starterCode);
    } else {
      setCode(getSavedProblemCode(DEFAULT_PROBLEM.id) ?? DEFAULT_PROBLEM.starterCode);
    }
    setEditorStorageReady(true);
  }, []);

  useEffect(() => {
    if (!editorStorageReady) return;
    setStoredValue(PRACTICE_CODE_STORAGE_KEY, practiceCode);
  }, [editorStorageReady, practiceCode]);

  useEffect(() => {
    if (!editorStorageReady) return;
    setStoredValue(SELECTED_PROBLEM_STORAGE_KEY, selectedProblemId);
    setStoredValue(`${PROBLEM_CODE_STORAGE_PREFIX}${selectedProblemId}`, code);
  }, [code, editorStorageReady, selectedProblemId]);

  function navigateTo(nextScreen: Screen) {
    const url = new URL(window.location.href);
    if (nextScreen === "home") {
      url.searchParams.delete("screen");
    } else {
      url.searchParams.set("screen", nextScreen);
    }
    window.history.pushState({}, "", url);
    setScreen(nextScreen);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(studentNo.trim())) {
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
      navigateTo("solve");
      setNotice(`${signedIn.name}님, 문제 풀이를 시작해볼까요?`);
    } catch (error) {
      setNotice(getDataErrorMessage(error, "로그인 중 문제가 생겼어요. Supabase 연결을 확인해주세요."));
    } finally {
      setLoading(false);
    }
  }

  function enterSolveMode() {
    if (student || isTeacherAuthenticated) {
      navigateTo("solve");
      return;
    }
    setLoginOpen(true);
  }

  function enterTeacherMode() {
    if (isTeacherAuthenticated) {
      navigateTo("teacher");
      void refreshDashboard();
      return;
    }

    setTeacherPassword("");
    setTeacherLoginError("");
    setTeacherLoginOpen(true);
  }

  async function handleTeacherLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeacherLoginError("");
    setTeacherLoginLoading(true);

    try {
      const response = await fetch("/api/teacher-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: teacherPassword })
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        setTeacherLoginError(data.message ?? "교사 로그인에 실패했습니다.");
        return;
      }

      setIsTeacherAuthenticated(true);
      setTeacherPassword("");
      setTeacherLoginOpen(false);
      navigateTo("teacher");
      void refreshDashboard();
    } catch {
      setTeacherLoginError("교사 로그인 요청을 처리하지 못했습니다.");
    } finally {
      setTeacherLoginLoading(false);
    }
  }

  function closeTeacherLogin() {
    setTeacherLoginOpen(false);
    setTeacherPassword("");
    setTeacherLoginError("");
    if (getScreenFromUrl() === "teacher" && !isTeacherAuthenticated) navigateTo("home");
  }

  async function logoutTeacher() {
    try {
      await fetch("/api/teacher-logout", { method: "POST" });
    } finally {
      setIsTeacherAuthenticated(false);
      setSubmissions([]);
      setNotice("");
      navigateTo("home");
    }
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
    setCode(getSavedProblemCode(problem.id) ?? problem.starterCode);
    setResult(null);
    resetSolveConsole();
  }

  function resetPracticeCode() {
    if (!window.confirm("코드 에디터의 모든 코드를 삭제할까요?")) return;
    setPracticeCode("");
  }

  function resetConsole() {
    setConsoleLines([]);
    setInputHistory([]);
    setConsoleInput("");
  }

  async function runPractice() {
    if (isPracticeRunning) return;
    setIsPracticeRunning(true);
    setPendingPrompt(null);
    setConsoleInput("");
    setInputHistory([]);
    queuedConsoleInputsRef.current = [];
    setConsoleLines(["$ python main.py", ""]);

    try {
      await runPythonWithSkulpt(practiceCode, {
        output: (text) => {
          setConsoleLines((lines) => appendConsoleText(lines, text));
        },
        error: (text) => {
          setConsoleLines((lines) => [...lines, text]);
        },
        input: requestConsoleInput
      });
    } finally {
      inputResolverRef.current = null;
      setPendingPrompt(null);
      setIsPracticeRunning(false);
    }
  }

  function requestConsoleInput(prompt: string) {
    const queuedValue = queuedConsoleInputsRef.current.shift();
    if (queuedValue !== undefined) {
      setInputHistory((items) => [...items, queuedValue]);
      return Promise.resolve(queuedValue);
    }

    return new Promise<string>((resolve) => {
      inputResolverRef.current = resolve;
      setPendingPrompt(prompt);
    });
  }

  function submitConsoleInput(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || !inputResolverRef.current) return;
    if (event.shiftKey) return;
    event.preventDefault();
    const resolver = inputResolverRef.current;
    inputResolverRef.current = null;
    const normalized = consoleInput.replace(/\r\n/g, "\n");
    const [currentValue, ...queuedValues] = normalized.split("\n");
    queuedConsoleInputsRef.current.push(...queuedValues);
    setInputHistory((items) => [...items, currentValue]);
    setPendingPrompt(null);
    setConsoleInput("");
    resolver(currentValue);
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
    } catch (error) {
      setNotice(getDataErrorMessage(error, "채점은 완료됐지만 제출 기록 저장에 실패했어요."));
    }
  }

  async function runSolveCode() {
    if (isSolveRunning) return;
    setIsSolveRunning(true);
    setResult(null);
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    setSolveInputHistory([]);
    solveQueuedInputsRef.current = [];
    setSolveConsoleLines(["$ python main.py", ""]);

    try {
      await runPythonWithSkulpt(code, {
        output: (text) => {
          setSolveConsoleLines((lines) => appendConsoleText(lines, text));
        },
        error: (text) => {
          setSolveConsoleLines((lines) => [...lines, text]);
        },
        input: requestSolveConsoleInput
      });
    } finally {
      solveInputResolverRef.current = null;
      setSolvePendingPrompt(null);
      setIsSolveRunning(false);
    }
  }

  function requestSolveConsoleInput(prompt: string) {
    const queuedValue = solveQueuedInputsRef.current.shift();
    if (queuedValue !== undefined) {
      setSolveInputHistory((items) => [...items, queuedValue]);
      return Promise.resolve(queuedValue);
    }

    return new Promise<string>((resolve) => {
      solveInputResolverRef.current = resolve;
      setSolvePendingPrompt(prompt);
    });
  }

  function submitSolveConsoleInput(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || !solveInputResolverRef.current) return;
    if (event.shiftKey) return;
    event.preventDefault();
    const resolver = solveInputResolverRef.current;
    solveInputResolverRef.current = null;
    const normalized = solveConsoleInput.replace(/\r\n/g, "\n");
    const [currentValue, ...queuedValues] = normalized.split("\n");
    solveQueuedInputsRef.current.push(...queuedValues);
    setSolveInputHistory((items) => [...items, currentValue]);
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    resolver(currentValue);
  }

  function resetSolveConsole() {
    setSolveConsoleLines([]);
    setSolveInputHistory([]);
    setSolveConsoleInput("");
  }

  async function refreshDashboard() {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/teacher-dashboard", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        submissions?: SubmissionWithStudent[];
        message?: string;
        code?: string;
      };

      if (response.status === 401) {
        setIsTeacherAuthenticated(false);
        setSubmissions([]);
        setTeacherLoginError("교사 로그인이 필요합니다.");
        setTeacherLoginOpen(true);
        navigateTo("home");
        return;
      }

      if (!response.ok || !data.ok) {
        const suffix = data.code ? ` (${data.code})` : "";
        setNotice(`${data.message ?? "대시보드를 불러오지 못했습니다."}${suffix}`);
        return;
      }

      setSubmissions(data.submissions ?? []);
    } catch {
      setNotice("대시보드 데이터를 불러오지 못했습니다.");
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
        onHome={() => navigateTo("home")}
        onPractice={() => navigateTo("practice")}
        onSolve={enterSolveMode}
        onTeacher={enterTeacherMode}
        onToggleColorMode={() => setColorMode((mode) => (mode === "dark" ? "light" : "dark"))}
      />

      {notice && <div className="notice">{notice}</div>}

      {screen === "home" && <HomeChoice onPractice={() => navigateTo("practice")} onSolve={enterSolveMode} />}

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
                  <strong>코드 에디터</strong>
                </div>
                <div className="ideActions">
                  <FontSizeControl
                    label="코드 글자 크기"
                    value={codeFontSize}
                    onDecreaseLarge={() => setCodeFontSize((size) => Math.max(12, size - 10))}
                    onDecrease={() => setCodeFontSize((size) => Math.max(12, size - 1))}
                    onIncrease={() => setCodeFontSize((size) => Math.min(60, size + 1))}
                    onIncreaseLarge={() => setCodeFontSize((size) => Math.min(60, size + 10))}
                  />
                  <button className="resetCodeButton" onClick={resetPracticeCode}>
                    <Trash2 size={17} />
                    코드 초기화
                  </button>
                  <button className="primaryButton" onClick={runPractice}>
                    <Play size={17} />
                    실행
                    <kbd>Shift + Enter</kbd>
                  </button>
                </div>
              </div>
              <CodeEditor
                value={practiceCode}
                onChange={setPracticeCode}
                onRun={runPractice}
                colorMode={colorMode}
                fontSize={codeFontSize}
              />
            </article>
            <aside className="consolePane">
              <div className="consoleHeader">
                <strong>콘솔</strong>
                <div className="consoleActions">
                  <button className="consoleResetButton" onClick={resetConsole}>
                    <Trash2 size={16} />
                    콘솔 초기화
                  </button>
                  <FontSizeControl
                    label="콘솔 글자 크기"
                    value={consoleFontSize}
                    onDecreaseLarge={() => setConsoleFontSize((size) => Math.max(12, size - 10))}
                    onDecrease={() => setConsoleFontSize((size) => Math.max(12, size - 1))}
                    onIncrease={() => setConsoleFontSize((size) => Math.min(60, size + 1))}
                    onIncreaseLarge={() => setConsoleFontSize((size) => Math.min(60, size + 10))}
                  />
                  <span>{pendingPrompt !== null ? "입력 대기 중" : isPracticeRunning ? "실행 중" : "실행 결과"}</span>
                </div>
              </div>
              <div className="terminal" aria-live="polite" style={{ fontSize: `${consoleFontSize}px` }}>
                <div className="terminalScroll">
                  <pre>{consoleLines.join("\n")}</pre>
                  {pendingPrompt !== null ? (
                    <div className="terminalInputRow active">
                      <span>{pendingPrompt}</span>
                      <textarea
                        value={consoleInput}
                        ref={consoleInputRef}
                        onChange={(event) => setConsoleInput(event.target.value)}
                        onKeyDown={submitConsoleInput}
                        placeholder="값을 입력하고 Enter"
                        aria-label="콘솔 입력"
                        rows={1}
                      />
                    </div>
                  ) : (
                    <div className="terminalHint">
                      <strong>입력값</strong>
                      {inputHistory.length === 0 ? (
                        <span>아직 입력한 값이 없습니다.</span>
                      ) : (
                        inputHistory.map((item, index) => (
                          <code key={`${item}-${index}`}>
                            {index + 1}. {item || "(빈 값)"}
                          </code>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {screen === "solve" && (
        <section
          className={`solveGrid ${bookSidebarOpen ? "" : "bookSidebarCollapsed"} ${
            problemListOpen ? "" : "problemListCollapsed"
          }`}
        >
          {bookSidebarOpen ? (
            <aside className="bookSidebar">
              <div className="sectionTitle collapsibleTitle">
                <span>
                  <BookOpen size={18} />
                  문제집
                </span>
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => setBookSidebarOpen(false)}
                  aria-label="문제집 목록 접기"
                  title="문제집 목록 접기"
                >
                  <PanelLeftClose size={18} />
                </button>
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
          ) : (
            <button
              type="button"
              className="collapsedSidebarButton"
              onClick={() => setBookSidebarOpen(true)}
              aria-label="문제집 목록 펼치기"
              title="문제집 목록 펼치기"
            >
              <PanelLeftOpen size={19} />
              <span>문제집</span>
            </button>
          )}

          {problemListOpen ? (
            <aside className="problemList">
              <div className="sectionTitle collapsibleTitle">
                <span>문항</span>
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => setProblemListOpen(false)}
                  aria-label="문항 목록 접기"
                  title="문항 목록 접기"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
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
          ) : (
            <button
              type="button"
              className="collapsedSidebarButton"
              onClick={() => setProblemListOpen(true)}
              aria-label="문항 목록 펼치기"
              title="문항 목록 펼치기"
            >
              <PanelLeftOpen size={19} />
              <span>문항</span>
            </button>
          )}

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
                  <button className="runButton" onClick={() => void runSolveCode()} disabled={isSolveRunning}>
                    <Play size={17} />
                    {isSolveRunning ? "실행 중" : "실행"}
                  </button>
                  <button className="primaryButton" onClick={submitCode}>
                    <Send size={17} />
                    제출
                  </button>
                </div>
              </div>
              <div className="solveIdeBody">
                <div className="solveEditorSection">
                  <div className="solveSectionHeader">
                    <strong>코드 에디터</strong>
                    <FontSizeControl
                      label="문제 코드 글자 크기"
                      value={codeFontSize}
                      onDecreaseLarge={() => setCodeFontSize((size) => Math.max(12, size - 10))}
                      onDecrease={() => setCodeFontSize((size) => Math.max(12, size - 1))}
                      onIncrease={() => setCodeFontSize((size) => Math.min(60, size + 1))}
                      onIncreaseLarge={() => setCodeFontSize((size) => Math.min(60, size + 10))}
                    />
                  </div>
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    onRun={runSolveCode}
                    colorMode={colorMode}
                    fontSize={codeFontSize}
                  />
                </div>
                <div className="solveConsoleSection">
                  <div className="solveSectionHeader">
                    <strong>출력 콘솔</strong>
                    <div className="consoleActions">
                      <button className="consoleResetButton" onClick={resetSolveConsole}>
                        <Trash2 size={16} />
                        콘솔 초기화
                      </button>
                      <FontSizeControl
                        label="문제 콘솔 글자 크기"
                        value={consoleFontSize}
                        onDecreaseLarge={() => setConsoleFontSize((size) => Math.max(12, size - 10))}
                        onDecrease={() => setConsoleFontSize((size) => Math.max(12, size - 1))}
                        onIncrease={() => setConsoleFontSize((size) => Math.min(60, size + 1))}
                        onIncreaseLarge={() => setConsoleFontSize((size) => Math.min(60, size + 10))}
                      />
                      <span>
                        {solvePendingPrompt !== null ? "입력 대기 중" : isSolveRunning ? "실행 중" : "실행 결과"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="terminal solveTerminal"
                    aria-live="polite"
                    style={{ fontSize: `${consoleFontSize}px` }}
                  >
                    <div className="terminalScroll">
                      <pre>{solveConsoleLines.join("\n")}</pre>
                      {solvePendingPrompt !== null ? (
                        <div className="terminalInputRow active">
                          <span>{solvePendingPrompt}</span>
                          <textarea
                            value={solveConsoleInput}
                            ref={solveConsoleInputRef}
                            onChange={(event) => setSolveConsoleInput(event.target.value)}
                            onKeyDown={submitSolveConsoleInput}
                            placeholder="값을 입력하고 Enter"
                            aria-label="문제 풀이 콘솔 입력"
                            rows={1}
                          />
                        </div>
                      ) : (
                        <div className="terminalHint">
                          <strong>입력값</strong>
                          {solveInputHistory.length === 0 ? (
                            <span>아직 입력한 값이 없습니다.</span>
                          ) : (
                            solveInputHistory.map((item, index) => (
                              <code key={`${item}-${index}`}>
                                {index + 1}. {item || "(빈 값)"}
                              </code>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <ResultPanel result={result} />
            </article>
          </section>
        </section>
      )}

      {teacherAuthReady && screen === "teacher" && isTeacherAuthenticated && (
        <TeacherDashboard
          dashboard={dashboard}
          loading={loading}
          submissions={submissions}
          onRefresh={refreshDashboard}
          onLogout={() => void logoutTeacher()}
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

      {teacherLoginOpen && (
        <div className="modalBackdrop" role="presentation">
          <div className="loginModal" role="dialog" aria-modal="true" aria-labelledby="teacher-login-title">
            <button className="iconButton closeButton" onClick={closeTeacherLogin} aria-label="닫기">
              <X size={18} />
            </button>
            <div className="sectionTitle" id="teacher-login-title">
              <LogIn size={18} />
              교사 모드 로그인
            </div>
            <form onSubmit={handleTeacherLogin}>
              <label>
                비밀번호
                <input
                  autoFocus
                  type="password"
                  autoComplete="current-password"
                  value={teacherPassword}
                  onChange={(event) => setTeacherPassword(event.target.value)}
                />
              </label>
              {teacherLoginError && (
                <p className="modalError" role="alert">
                  {teacherLoginError}
                </p>
              )}
              <div className="modalActions">
                <button type="button" className="ghostButton" onClick={closeTeacherLogin}>
                  취소
                </button>
                <button className="primaryButton" disabled={teacherLoginLoading || !teacherPassword}>
                  <LogIn size={18} />
                  로그인
                </button>
              </div>
            </form>
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

function FontSizeControl({
  label,
  value,
  onDecreaseLarge,
  onDecrease,
  onIncrease,
  onIncreaseLarge
}: {
  label: string;
  value: number;
  onDecreaseLarge: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onIncreaseLarge: () => void;
}) {
  return (
    <div className="fontSizeControl" aria-label={label}>
      <button
        type="button"
        className="fontSizeStepButton"
        onClick={onDecreaseLarge}
        disabled={value <= 12}
        aria-label={`${label} 10 줄이기`}
        title={`${label} 10px 줄이기`}
      >
        -10
      </button>
      <button
        type="button"
        className="fontSizeFineButton"
        onClick={onDecrease}
        disabled={value <= 12}
        aria-label={`${label} 1 줄이기`}
        title={`${label} 1px 줄이기`}
      >
        -1
      </button>
      <span aria-live="polite">{value}px</span>
      <button
        type="button"
        className="fontSizeFineButton"
        onClick={onIncrease}
        disabled={value >= 60}
        aria-label={`${label} 1 키우기`}
        title={`${label} 1px 키우기`}
      >
        +1
      </button>
      <button
        type="button"
        className="fontSizeStepButton"
        onClick={onIncreaseLarge}
        disabled={value >= 60}
        aria-label={`${label} 10 키우기`}
        title={`${label} 10px 키우기`}
      >
        +10
      </button>
    </div>
  );
}

function CodeEditor({
  value,
  onChange,
  onRun,
  colorMode,
  fontSize
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  colorMode: ColorMode;
  fontSize: number;
}) {
  const extensions = useMemo(
    () => [
      lineNumbers(),
      history(),
      python(),
      EditorState.allowMultipleSelections.of(true),
      pythonLanguage.data.of({ autocomplete: pythonCompletionSource }),
      autocompletion(),
      closeBrackets(),
      EditorView.lineWrapping,
      syntaxHighlighting(colorMode === "dark" ? sublimeDarkHighlight : sublimeLightHighlight),
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
          fontSize: `${fontSize}px`,
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
    [colorMode, fontSize, onRun]
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
  const selectedRanges = state.selection.ranges;
  const isAlreadySelected = (start: number) =>
    selectedRanges.some((range) => range.from === start && range.to === start + query.length);
  let next = findNextUnselectedOccurrence(doc, query, from, isAlreadySelected);
  if (next === -1) next = findNextUnselectedOccurrence(doc, query, 0, isAlreadySelected, from);
  if (next === -1) return false;

  const range = EditorSelection.range(next, next + query.length);
  const ranges = [...selectedRanges, range].sort((left, right) => left.from - right.from);
  view.dispatch({
    selection: EditorSelection.create(ranges, ranges.indexOf(range)),
    scrollIntoView: true
  });
  return true;
}

function findNextUnselectedOccurrence(
  doc: string,
  query: string,
  from: number,
  isAlreadySelected: (start: number) => boolean,
  before = doc.length
) {
  let next = doc.indexOf(query, from);
  while (next !== -1 && next < before) {
    if (!isAlreadySelected(next)) return next;
    next = doc.indexOf(query, next + query.length);
  }
  return -1;
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
      <div className="descriptionGrid">
        <ProblemBlock title="입력" body={selectedProblem.inputDescription} />
        <ProblemBlock title="출력" body={selectedProblem.outputDescription} />
      </div>
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
  onRefresh,
  onLogout
}: {
  dashboard: { accepted: number; total: number; rate: number; triedStudents: number };
  loading: boolean;
  submissions: SubmissionWithStudent[];
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <section className="teacherView">
      <div className="dashboardHeader">
        <div>
          <span className="pill">교사 수업 지원</span>
          <h1>학급 대시보드</h1>
        </div>
        <div className="dashboardActions">
          <button className="ghostButton" onClick={onLogout}>
            <LogOut size={18} />
            로그아웃
          </button>
          <button className="primaryButton" onClick={onRefresh} disabled={loading}>
            <Sparkles size={18} />
            새로고침
          </button>
        </div>
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
      <div className="supabaseNote">교사 대시보드 데이터는 인증된 서버 API를 통해 조회됩니다.</div>
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

function getScreenFromUrl(): Screen {
  const screen = new URL(window.location.href).searchParams.get("screen");
  return screen === "practice" || screen === "solve" || screen === "teacher" ? screen : "home";
}

function getSavedProblemCode(problemId: string) {
  return getStoredValue(`${PROBLEM_CODE_STORAGE_PREFIX}${problemId}`);
}

function getStoredValue(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The editor remains usable when browser storage is unavailable.
  }
}
