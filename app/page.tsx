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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  LogOut,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Send,
  Sparkles,
  Trophy,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  problemBooks as fallbackProblemBooks,
  problems as fallbackProblems
} from "@/lib/problems";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";
import {
  findOrCreateStudent,
  getDataErrorMessage,
  saveSubmission
} from "@/lib/supabase";
import type { Problem, ProblemBook, Student, SubmissionWithStudent } from "@/lib/types";
import type { ProblemImportResult } from "@/lib/problem-import-types";

type Screen = "home" | "practice" | "solve" | "teacher";
type ColorMode = "light" | "dark";
type JudgeResult = {
  status: "accepted" | "wrong_answer" | "runtime_error";
  passedCount: number;
  totalCount: number;
  feedback: string;
  cases: Array<{ input: string; output: string; actual: string; passed: boolean }>;
};

const PROBLEM_GROUP_TITLES: Record<number, string[]> = {
  1: ["기본 출력(정수)", "기본 출력(실수)", "기본 출력(문자)", "기본 출력(문자열)"],
  2: [
    "여러 요소 출력(띄어쓰기)",
    "여러 요소 출력(개행)",
    "계산 결과 출력(사칙연산)",
    "연산자 활용 출력(곱하기, 더하기)"
  ],
  3: ["변수 기초", "변수 활용", "변수와 입력"],
  4: ["순차 구조 기초", "순차 구조 응용(문자/문자열)", "순차 구조 응용(정수)"],
  5: ["선택 구조 기초 (if)", "선택 구조 응용 (if else)", "선택 구조 응용 (if elif else)"],
  6: ["반복 구조 기초", "반복 구조 응용"],
  7: ["리스트 인덱싱(기초)", "리스트 인덱싱(복수, 개행)"],
  8: ["문자열 인덱싱(기초)", "문자열 인덱싱(복수, 개행)"],
  9: ["리스트 슬라이싱", "문자열 슬라이싱"],
  10: ["리스트 통계 함수 활용", "리스트 통계 함수 응용", "문자열 함수 활용", "리스트 및 문자열 정렬"]
};

const PRACTICE_CODE_STORAGE_KEY = "pyoj:practice-code";
const SELECTED_PROBLEM_STORAGE_KEY = "pyoj:selected-problem";
const PROBLEM_CODE_STORAGE_PREFIX = "pyoj:problem-code:";
const AUTO_ADVANCE_STORAGE_KEY = "pyoj:auto-advance-on-accepted";
const DEFAULT_PROBLEM =
  fallbackProblems.find((problem) => problem.bookId === fallbackProblemBooks[0].id) ??
  fallbackProblems[0];

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
  const [availableBooks, setAvailableBooks] = useState<ProblemBook[]>(fallbackProblemBooks);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>(fallbackProblems);
  const [selectedBookId, setSelectedBookId] = useState(fallbackProblemBooks[0].id);
  const selectedProblems = availableProblems
    .filter((problem) => problem.bookId === selectedBookId)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, "ko"));
  const problemGroups = groupProblems(selectedProblems, availableBooks.find((book) => book.id === selectedBookId));
  const fallbackProblem = selectedProblems[0] ?? DEFAULT_PROBLEM;
  const [selectedProblemId, setSelectedProblemId] = useState(DEFAULT_PROBLEM.id);
  const selectedProblem =
    availableProblems.find((problem) => problem.id === selectedProblemId) ?? fallbackProblem;
  const orderedProblems = useMemo(() => {
    const bookOrder = new Map(
      [...availableBooks]
        .sort((left, right) => left.order - right.order)
        .map((book, index) => [book.id, index])
    );
    return [...availableProblems].sort(
      (left, right) =>
        (bookOrder.get(left.bookId) ?? Number.MAX_SAFE_INTEGER) -
          (bookOrder.get(right.bookId) ?? Number.MAX_SAFE_INTEGER) ||
        left.order - right.order ||
        left.id.localeCompare(right.id, "ko")
    );
  }, [availableBooks, availableProblems]);
  const selectedProblemIndex = orderedProblems.findIndex(
    (problem) => problem.id === selectedProblem.id
  );
  const previousProblem =
    selectedProblemIndex > 0 ? orderedProblems[selectedProblemIndex - 1] : undefined;
  const nextProblem =
    selectedProblemIndex >= 0 && selectedProblemIndex < orderedProblems.length - 1
      ? orderedProblems[selectedProblemIndex + 1]
      : undefined;
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
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isResultToastClosing, setIsResultToastClosing] = useState(false);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoAdvanceOnAccepted, setAutoAdvanceOnAccepted] = useState(false);
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
  const solveRunInputsRef = useRef<string[]>([]);
  const solveRunOutputsRef = useRef<string[]>([]);
  const solveRunErrorsRef = useRef<string[]>([]);
  const [bookSidebarOpen, setBookSidebarOpen] = useState(true);
  const [problemListOpen, setProblemListOpen] = useState(true);
  const [expandedProblemGroups, setExpandedProblemGroups] = useState<Set<string>>(() => new Set());
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<Student[]>([]);
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
    if (!result) return;

    setIsResultToastClosing(false);
    const startClosing = window.setTimeout(() => setIsResultToastClosing(true), 2700);
    const removeToast = window.setTimeout(() => setResult(null), 3000);
    return () => {
      window.clearTimeout(startClosing);
      window.clearTimeout(removeToast);
    };
  }, [result]);

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
    void refreshCurriculum();
  }, []);

  useEffect(() => {
    const savedPracticeCode = getStoredValue(PRACTICE_CODE_STORAGE_KEY);
    if (savedPracticeCode !== null) setPracticeCode(savedPracticeCode);
    setAutoAdvanceOnAccepted(getStoredValue(AUTO_ADVANCE_STORAGE_KEY) === "true");

    const savedProblemId = getStoredValue(SELECTED_PROBLEM_STORAGE_KEY);
    const savedProblem = fallbackProblems.find((problem) => problem.id === savedProblemId);
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

  useEffect(() => {
    if (!editorStorageReady) return;
    setStoredValue(AUTO_ADVANCE_STORAGE_KEY, String(autoAdvanceOnAccepted));
  }, [autoAdvanceOnAccepted, editorStorageReady]);

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
      void refreshSolvedProblems(signedIn.id);
      setLoginOpen(false);
      navigateTo("solve");
      setNotice("");
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
    const nextProblem = availableProblems.find((problem) => problem.bookId === bookId);
    setSelectedBookId(bookId);
    setExpandedProblemGroups(new Set());
    if (nextProblem) changeProblem(nextProblem.id);
  }

  function logoutStudent() {
    setStudent(null);
    setSolvedProblemIds(new Set());
    setResult(null);
    setNotice("");
    navigateTo("home");
  }

  function dismissResultToast() {
    setIsResultToastClosing(true);
    window.setTimeout(() => setResult(null), 300);
  }

  async function refreshSolvedProblems(studentId: string) {
    try {
      const response = await fetch(`/api/submissions?studentId=${encodeURIComponent(studentId)}`, {
        cache: "no-store"
      });
      const data = (await response.json()) as { ok?: boolean; problemIds?: string[] };
      if (response.ok && data.ok) setSolvedProblemIds(new Set(data.problemIds ?? []));
    } catch {
      setSolvedProblemIds(new Set());
    }
  }

  function toggleProblemGroup(groupId: string) {
    setExpandedProblemGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function changeProblem(problemId: string) {
    const problem = availableProblems.find((item) => item.id === problemId) ?? availableProblems[0];
    if (!problem) return;
    setSelectedProblemId(problem.id);
    setSelectedBookId(problem.bookId);
    setCode(getSavedProblemCode(problem.id) ?? problem.starterCode);
    setResult(null);
    resetSolveConsole();
  }

  async function refreshCurriculum() {
    try {
      const response = await fetch("/api/curriculum", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        books?: ProblemBook[];
        problems?: Problem[];
      };
      if (!response.ok || !data.ok || !data.books?.length || !data.problems?.length) return;

      setAvailableBooks(data.books);
      setAvailableProblems(data.problems);
      const savedProblemId = getStoredValue(SELECTED_PROBLEM_STORAGE_KEY);
      const nextProblem =
        data.problems.find((problem) => problem.id === savedProblemId) ??
        data.problems.find((problem) => problem.id === selectedProblemId) ??
        data.problems[0];
      setSelectedBookId(nextProblem.bookId);
      setSelectedProblemId(nextProblem.id);
      setCode(getSavedProblemCode(nextProblem.id) ?? nextProblem.starterCode);
    } catch {
      // Bundled curriculum remains available when the DB cannot be reached.
    }
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
    setConsoleLines([]);

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
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const judged = await judgeProblemSubmission(selectedProblem, code);
      setResult(judged);
      await saveSubmission({
        student_id: student.id,
        problem_id: selectedProblem.id,
        code,
        status: judged.status,
        passed_count: judged.passedCount,
        total_count: judged.totalCount,
        feedback: judged.feedback
      });
      if (judged.status === "accepted") {
        setSolvedProblemIds((current) => new Set(current).add(selectedProblem.id));
        if (autoAdvanceOnAccepted && nextProblem) {
          window.setTimeout(() => changeProblem(nextProblem.id), 800);
        }
      }
      setNotice("");
    } catch (error) {
      setNotice(getDataErrorMessage(error, "채점 또는 제출 기록 저장에 실패했어요."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runSolveCode() {
    if (isSolveRunning) return;
    const startedAt = performance.now();
    const codeSnapshot = code;
    setIsSolveRunning(true);
    setResult(null);
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    setSolveInputHistory([]);
    solveQueuedInputsRef.current = [];
    solveRunInputsRef.current = [];
    solveRunOutputsRef.current = [];
    solveRunErrorsRef.current = [];
    setSolveConsoleLines([]);

    try {
      await runPythonWithSkulpt(codeSnapshot, {
        output: (text) => {
          solveRunOutputsRef.current.push(text);
          setSolveConsoleLines((lines) => appendConsoleText(lines, text));
        },
        error: (text) => {
          solveRunErrorsRef.current.push(text);
          setSolveConsoleLines((lines) => [...lines, text]);
        },
        input: requestSolveConsoleInput
      });
    } finally {
      solveInputResolverRef.current = null;
      setSolvePendingPrompt(null);
      setIsSolveRunning(false);
      if (student) {
        await saveCodeRunLog({
          studentId: student.id,
          problemId: selectedProblem.id,
          code: codeSnapshot,
          stdin: solveRunInputsRef.current.join("\n"),
          stdout: solveRunOutputsRef.current.join(""),
          stderr: solveRunErrorsRef.current.join("\n"),
          status: solveRunErrorsRef.current.length > 0 ? "runtime_error" : "success",
          executionTimeMs: performance.now() - startedAt
        });
      }
    }
  }

  function requestSolveConsoleInput(prompt: string) {
    const queuedValue = solveQueuedInputsRef.current.shift();
    if (queuedValue !== undefined) {
      solveRunInputsRef.current.push(queuedValue);
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
    solveRunInputsRef.current.push(currentValue);
    setSolveInputHistory((items) => [...items, currentValue]);
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    resolver(currentValue);
  }

  async function saveCodeRunLog(payload: {
    studentId: string;
    problemId: string;
    code: string;
    stdin: string;
    stdout: string;
    stderr: string;
    status: "success" | "runtime_error";
    executionTimeMs: number;
  }) {
    try {
      const response = await fetch("/api/code-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; code?: string };
      if (!response.ok || !data.ok) {
        const suffix = data.code ? ` (${data.code})` : "";
        setNotice(`${data.message ?? "실행 로그를 저장하지 못했습니다."}${suffix}`);
      }
    } catch {
      setNotice("코드는 실행됐지만 실행 로그를 저장하지 못했습니다.");
    }
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
        students?: Student[];
        message?: string;
        code?: string;
      };

      if (response.status === 401) {
        setIsTeacherAuthenticated(false);
        setSubmissions([]);
        setTeacherStudents([]);
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
      setTeacherStudents(data.students ?? []);
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
        onLogout={logoutStudent}
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
            {availableBooks.map((book) => {
              const bookProblems = availableProblems.filter((problem) => problem.bookId === book.id);
              const count = bookProblems.length;
              const solvedCount = bookProblems.filter((problem) => solvedProblemIds.has(problem.id)).length;
              return (
                <button
                  key={book.id}
                  className={book.id === selectedBookId ? "bookItem active" : "bookItem"}
                  onClick={() => changeBook(book.id)}
                  style={
                    {
                      "--progress": `${count === 0 ? 0 : (solvedCount / count) * 100}%`
                    } as CSSProperties
                  }
                >
                  <span>{String(book.order).padStart(2, "0")}</span>
                  <strong>{book.title}</strong>
                  <em>{count > 0 ? `${solvedCount}문제 / ${count}문제` : "준비 중"}</em>
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
              <div className="problemGroups">
                {problemGroups.map((group) => {
                  const isExpanded = expandedProblemGroups.has(group.id);
                  const containsSelected = group.problems.some((problem) => problem.id === selectedProblem.id);
                  const solvedGroupCount = group.problems.filter((problem) =>
                    solvedProblemIds.has(problem.id)
                  ).length;
                  return (
                    <section className={`problemGroup ${containsSelected ? "containsSelected" : ""}`} key={group.id}>
                      <button
                        type="button"
                        className="problemGroupHeader"
                        onClick={() => toggleProblemGroup(group.id)}
                        aria-expanded={isExpanded}
                        style={
                          {
                            "--progress": `${(solvedGroupCount / group.problems.length) * 100}%`
                          } as CSSProperties
                        }
                      >
                        <span>{group.code}</span>
                        <div>
                          <strong>{group.title}</strong>
                          <em>
                            {solvedGroupCount}문제 / {group.problems.length}문제
                          </em>
                        </div>
                        <ChevronDown size={17} />
                      </button>
                      {isExpanded && (
                        <div className="problemGroupItems">
                          {group.problems.map((problem) => (
                            <button
                              key={problem.id}
                              className={[
                                "problemItem",
                                problem.id === selectedProblem.id ? "active" : "",
                                solvedProblemIds.has(problem.id) ? "solved" : ""
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => changeProblem(problem.id)}
                            >
                              <span>{formatProblemNumber(problem)}</span>
                              <strong>{problem.title}</strong>
                            </button>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
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
            <ProblemPane
              selectedProblem={selectedProblem}
              previousProblem={previousProblem}
              nextProblem={nextProblem}
              autoAdvanceOnAccepted={autoAdvanceOnAccepted}
              onPrevious={() => previousProblem && changeProblem(previousProblem.id)}
              onNext={() => nextProblem && changeProblem(nextProblem.id)}
              onAutoAdvanceChange={setAutoAdvanceOnAccepted}
            />
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
                  <button className="primaryButton" onClick={() => void submitCode()} disabled={isSubmitting}>
                    <Send size={17} />
                    {isSubmitting ? "채점 중" : "제출"}
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
            </article>
          </section>
        </section>
      )}

      {teacherAuthReady && screen === "teacher" && isTeacherAuthenticated && (
        <TeacherDashboard
          dashboard={dashboard}
          loading={loading}
          submissions={submissions}
          students={teacherStudents}
          books={availableBooks}
          problems={availableProblems}
          onRefresh={refreshDashboard}
          onCurriculumChanged={refreshCurriculum}
          onLogout={() => void logoutTeacher()}
        />
      )}

      {result && (
        <aside
          className={[
            "submissionToast",
            result.status === "accepted" ? "accepted" : "failed",
            isResultToastClosing ? "closing" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            className="submissionToastClose"
            onClick={dismissResultToast}
            aria-label="채점 결과 닫기"
          >
            <X size={17} />
          </button>
          <div className="submissionToastTitle">
            {result.status === "accepted" && <CheckCircle2 size={21} />}
            <strong>{result.status === "accepted" ? "성공" : "채점 결과"}</strong>
          </div>
          <p>
            총 {result.totalCount}개의 테스트 케이스 중 <b>{result.passedCount}개</b>를 통과했습니다.
          </p>
          <button type="button" className="submissionToastConfirm" onClick={dismissResultToast}>
            확인
          </button>
        </aside>
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
  onLogout,
  onToggleColorMode
}: {
  screen: Screen;
  student: Student | null;
  colorMode: ColorMode;
  onHome: () => void;
  onPractice: () => void;
  onSolve: () => void;
  onTeacher: () => void;
  onLogout: () => void;
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
        {student && (
          <button className="logoutNavButton" onClick={onLogout}>
            <LogOut size={18} />
            로그아웃
          </button>
        )}
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

function ProblemPane({
  selectedProblem,
  previousProblem,
  nextProblem,
  autoAdvanceOnAccepted,
  onPrevious,
  onNext,
  onAutoAdvanceChange
}: {
  selectedProblem: Problem;
  previousProblem?: Problem;
  nextProblem?: Problem;
  autoAdvanceOnAccepted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onAutoAdvanceChange: (enabled: boolean) => void;
}) {
  return (
    <article className="problemPane">
      <div className="problemHeader">
        <h1>{selectedProblem.title}</h1>
        <div className="problemNavigation">
          <div className="problemNavigationButtons">
            <button
              type="button"
              className="ghostButton"
              disabled={!previousProblem}
              onClick={onPrevious}
              title={previousProblem?.title ?? "첫 문제입니다."}
            >
              <ChevronLeft size={17} />
              이전
            </button>
            <button
              type="button"
              className="ghostButton"
              disabled={!nextProblem}
              onClick={onNext}
              title={nextProblem?.title ?? "마지막 문제입니다."}
            >
              다음
              <ChevronRight size={17} />
            </button>
          </div>
          <label className="autoAdvanceOption">
            <input
              type="checkbox"
              checked={autoAdvanceOnAccepted}
              onChange={(event) => onAutoAdvanceChange(event.target.checked)}
            />
            정답 시 자동 다음
          </label>
        </div>
      </div>
      <ProblemBlock title="문제" body={selectedProblem.statement} />
      <div className="descriptionGrid">
        <ProblemBlock title="입력" body={selectedProblem.inputDescription} />
        <ProblemBlock title="출력" body={selectedProblem.outputDescription} />
      </div>
      {selectedProblem.showExample !== false && selectedProblem.examples[0] && (
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
      )}
      {selectedProblem.hint.trim() && (
        <div className="hint">
          <Lightbulb size={18} />
          {selectedProblem.hint}
        </div>
      )}
    </article>
  );
}

async function judgeProblemSubmission(problem: Problem, code: string): Promise<JudgeResult> {
  const cases: JudgeResult["cases"] = [];
  let hasRuntimeError = false;

  for (const testCase of problem.testCases) {
    const inputQueue = testCase.input.replace(/\r\n/g, "\n").split("\n");
    const output: string[] = [];
    const errors: string[] = [];

    await runPythonWithSkulpt(code, {
      output: (text) => output.push(text),
      error: (text) => errors.push(text),
      input: async () => inputQueue.shift() ?? ""
    });

    const actual = errors.length > 0 ? errors.join("\n") : output.join("");
    const passed = errors.length === 0 && normalizeJudgeOutput(actual) === normalizeJudgeOutput(testCase.output);
    hasRuntimeError ||= errors.length > 0;
    cases.push({ ...testCase, actual, passed });
  }

  const passedCount = cases.filter((testCase) => testCase.passed).length;
  const status: JudgeResult["status"] = hasRuntimeError
    ? "runtime_error"
    : passedCount === cases.length
      ? "accepted"
      : "wrong_answer";

  return {
    status,
    passedCount,
    totalCount: cases.length,
    feedback:
      status === "accepted"
        ? "좋아요. 모든 테스트케이스를 통과했어요."
        : status === "runtime_error"
          ? "코드 실행 중 오류가 발생했어요. 실행 결과를 확인해주세요."
          : "아직 맞지 않는 테스트케이스가 있어요. 입력을 바꿔도 같은 규칙으로 동작하는지 확인해보세요.",
    cases
  };
}

function normalizeJudgeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function TeacherDashboard({
  dashboard,
  loading,
  submissions,
  students,
  books,
  problems,
  onRefresh,
  onCurriculumChanged,
  onLogout
}: {
  dashboard: { accepted: number; total: number; rate: number; triedStudents: number };
  loading: boolean;
  submissions: SubmissionWithStudent[];
  students: Student[];
  books: ProblemBook[];
  problems: Problem[];
  onRefresh: () => void;
  onCurriculumChanged: () => Promise<void>;
  onLogout: () => void;
}) {
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id ?? "");
  const [classFilter, setClassFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("studentNo");
  const [subgroupFilter, setSubgroupFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [overviewStudentId, setOverviewStudentId] = useState("");
  const selectedBook = books.find((book) => book.id === selectedBookId) ?? books[0];
  const bookProblems = problems
    .filter((problem) => problem.bookId === selectedBook?.id)
    .sort((left, right) => left.order - right.order);
  const bookProblemGroups = groupProblems(bookProblems, selectedBook);
  const displayedProblems =
    subgroupFilter === "all"
      ? bookProblems
      : bookProblemGroups.find((group) => group.id === subgroupFilter)?.problems ?? bookProblems;
  const latestSubmissionByStudentProblem = useMemo(() => {
    const latest = new Map<string, SubmissionWithStudent>();
    for (const submission of submissions) {
      const key = `${submission.student_id}:${submission.problem_id}`;
      if (!latest.has(key)) latest.set(key, submission);
    }
    return latest;
  }, [submissions]);
  const classes = useMemo(
    () =>
      [...new Set(students.map((item) => item.student_no.charAt(1)).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "ko")
      ),
    [students]
  );
  const studentRows = useMemo(() => {
    const rows = students.map((item) => {
      const statuses = displayedProblems.map((problem) =>
        latestSubmissionByStudentProblem.get(`${item.id}:${problem.id}`)
      );
      const submitted = statuses.filter(Boolean).length;
      const accepted = statuses.filter((submission) => submission?.status === "accepted").length;
      const rate = submitted === 0 ? 0 : accepted / submitted;
      const progress = displayedProblems.length === 0 ? 0 : submitted / displayedProblems.length;
      return { student: item, statuses, submitted, accepted, rate, progress };
    });
    const filtered = rows.filter(({ student }) => {
      const matchesClass = classFilter === "all" || student.student_no.charAt(1) === classFilter;
      return matchesClass;
    });
    return filtered.sort((left, right) => {
      if (sortBy === "name") return left.student.name.localeCompare(right.student.name, "ko");
      if (sortBy === "submissions") return right.submitted - left.submitted;
      if (sortBy === "accuracy") return right.rate - left.rate;
      if (sortBy === "progress") return right.progress - left.progress;
      return left.student.student_no.localeCompare(right.student.student_no, "ko", { numeric: true });
    });
  }, [
    students,
    displayedProblems,
    latestSubmissionByStudentProblem,
    classFilter,
    sortBy
  ]);
  const displayedStudentRows =
    studentFilter === "all"
      ? studentRows
      : studentRows.filter(({ student }) => student.id === studentFilter);
  const rankByStudent = useMemo(() => {
    const ranked = [...studentRows].sort(
      (left, right) =>
        right.accepted - left.accepted ||
        right.rate - left.rate ||
        right.submitted - left.submitted ||
        left.student.student_no.localeCompare(right.student.student_no, "ko", { numeric: true })
    );
    return new Map(ranked.map((row, index) => [row.student.id, index + 1]));
  }, [studentRows]);
  const selectedSubmissionHistory = selectedSubmission
    ? submissions.filter(
        (submission) =>
          submission.student_id === selectedSubmission.student_id &&
          submission.problem_id === selectedSubmission.problem_id
      )
    : [];
  const overviewStudent = overviewStudentId
    ? students.find((student) => student.id === overviewStudentId)
    : undefined;
  const overviewBookRows = useMemo(() => {
    if (!overviewStudent) return [];

    return books.map((book) => {
      const bookItems = problems
        .filter((problem) => problem.bookId === book.id)
        .sort((left, right) => left.order - right.order);
      const statuses = bookItems.map((problem) =>
        latestSubmissionByStudentProblem.get(`${overviewStudent.id}:${problem.id}`)
      );
      const submitted = statuses.filter(Boolean).length;
      const accepted = statuses.filter((submission) => submission?.status === "accepted").length;
      const wrongProblems = bookItems.filter((_, index) => {
        const submission = statuses[index];
        return Boolean(submission && submission.status !== "accepted");
      });
      const unsubmittedProblems = bookItems.filter((_, index) => !statuses[index]);
      const problemGroups = groupProblems(bookItems, book).map((group) => ({
        ...group,
        items: group.problems.map((problem) => ({
          problem,
          submission: latestSubmissionByStudentProblem.get(
            `${overviewStudent.id}:${problem.id}`
          )
        }))
      }));
      const latestActivity = submissions.find(
        (submission) =>
          submission.student_id === overviewStudent.id &&
          bookItems.some((problem) => problem.id === submission.problem_id)
      );

      return {
        book,
        total: bookItems.length,
        submitted,
        accepted,
        wrongProblems,
        unsubmittedProblems,
        problemGroups,
        latestActivity,
        submittedProgress:
          bookItems.length === 0 ? 0 : Math.round((submitted / bookItems.length) * 100),
        acceptedProgress:
          bookItems.length === 0 ? 0 : Math.round((accepted / bookItems.length) * 100)
      };
    });
  }, [
    overviewStudent,
    books,
    problems,
    submissions,
    latestSubmissionByStudentProblem
  ]);
  const overviewStats = useMemo(() => {
    const total = overviewBookRows.reduce((sum, row) => sum + row.total, 0);
    const submitted = overviewBookRows.reduce((sum, row) => sum + row.submitted, 0);
    const accepted = overviewBookRows.reduce((sum, row) => sum + row.accepted, 0);
    const wrong = overviewBookRows.reduce((sum, row) => sum + row.wrongProblems.length, 0);
    const currentBook =
      overviewBookRows
        .filter((row) => row.latestActivity?.created_at)
        .sort(
          (left, right) =>
            new Date(right.latestActivity!.created_at!).getTime() -
            new Date(left.latestActivity!.created_at!).getTime()
        )[0] ?? overviewBookRows.find((row) => row.submitted > 0);
    const lastActivity = submissions.find(
      (submission) => submission.student_id === overviewStudent?.id
    );

    return {
      total,
      submitted,
      accepted,
      wrong,
      progress: total === 0 ? 0 : Math.round((submitted / total) * 100),
      currentBook,
      lastActivity
    };
  }, [overviewBookRows, overviewStudent, submissions]);

  useEffect(() => {
    if (!selectedSubmission) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelectedSubmission(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSubmission]);

  useEffect(() => {
    setSubgroupFilter("all");
  }, [selectedBookId]);

  useEffect(() => {
    if (overviewStudentId && !students.some((student) => student.id === overviewStudentId)) {
      setOverviewStudentId("");
    }
  }, [students, overviewStudentId]);

  useEffect(() => {
    if (!overviewStudentId || selectedSubmission) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOverviewStudentId("");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [overviewStudentId, selectedSubmission]);

  return (
    <section className="teacherView">
      <div className="dashboardHeader">
        <strong className="dashboardTitle">대시보드</strong>
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
        <div className="submissionOverviewHeader">
          <strong className="sectionChip">제출 현황</strong>
          <div className="dashboardFilters">
            <label>
              <span>문제집</span>
              <select value={selectedBook?.id ?? ""} onChange={(event) => setSelectedBookId(event.target.value)}>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {formatBookTitle(book)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>소분류</span>
              <select
                className="subgroupSelect"
                value={subgroupFilter}
                onChange={(event) => setSubgroupFilter(event.target.value)}
              >
                <option value="all">전체</option>
                {bookProblemGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.code} {group.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>학급</span>
              <select
                value={classFilter}
                onChange={(event) => {
                  setClassFilter(event.target.value);
                  setStudentFilter("all");
                }}
              >
                <option value="all">전체 학급</option>
                {classes.map((classNo) => (
                  <option key={classNo} value={classNo}>
                    {classNo}반
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>학생</span>
              <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}>
                <option value="all">전체 학생</option>
                {students
                  .filter((item) => classFilter === "all" || item.student_no.charAt(1) === classFilter)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.student_no} {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>정렬</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="studentNo">학번순</option>
                <option value="name">가나다순</option>
                <option value="submissions">제출개수순</option>
                <option value="accuracy">정답률순</option>
                <option value="progress">진행률순</option>
              </select>
            </label>
          </div>
        </div>
        <div className="submissionMatrixWrap">
          {displayedStudentRows.length === 0 ? (
            <p className="empty">조건에 맞는 학생이 없습니다.</p>
          ) : (
            <table className="submissionMatrix">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>학번 / 이름</th>
                  <th>점수</th>
                  {displayedProblems.map((problem) => (
                    <th key={problem.id}>
                      {Number(formatProblemNumber(problem))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedStudentRows.map((row) => (
                  <tr key={row.student.id}>
                    <td className="rankCell">
                      <Trophy size={15} />
                      {rankByStudent.get(row.student.id)}
                    </td>
                    <th>
                      <button
                        className="studentOverviewLink"
                        type="button"
                        onClick={() => setOverviewStudentId(row.student.id)}
                      >
                        {row.student.student_no} {row.student.name}
                      </button>
                    </th>
                    <td>
                      <span className="scoreBadge">
                        {row.accepted}/{displayedProblems.length}
                      </span>
                    </td>
                    {row.statuses.map((submission, index) => (
                      <td key={displayedProblems[index].id}>
                        {submission ? (
                          <button
                            className={`submissionStatus ${submission.status === "accepted" ? "correct" : "incorrect"}`}
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            {submission.status === "accepted" ? "정답" : "오답"}
                          </button>
                        ) : (
                          <span className="notSubmitted">미제출</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <TeacherProblemManager
        books={books}
        problems={problems}
        onChanged={onCurriculumChanged}
      />
      {overviewStudent && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setOverviewStudentId("")}>
          <section
            className="studentOverviewModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-overview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="iconButton closeButton"
              onClick={() => setOverviewStudentId("")}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <div className="studentOverviewHeader">
              <div>
                <span className="pill">학생별 학습 현황</span>
                <h2 id="student-overview-title">
                  {overviewStudent.student_no} {overviewStudent.name}
                </h2>
              </div>
              <label>
                학생
                <select
                  value={overviewStudent.id}
                  onChange={(event) => setOverviewStudentId(event.target.value)}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.student_no} {student.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="studentOverviewMetrics">
              <Metric label="전체 진도" value={`${overviewStats.progress}%`} />
              <Metric
                label="푼 문제"
                value={`${overviewStats.submitted}/${overviewStats.total}`}
              />
              <Metric label="정답 문제" value={`${overviewStats.accepted}`} />
              <Metric label="재확인할 오답" value={`${overviewStats.wrong}`} />
            </div>
            <div className="currentLearningSummary">
              <div>
                <span>현재 학습 중</span>
                <strong>
                  {overviewStats.currentBook
                    ? formatBookTitle(overviewStats.currentBook.book)
                    : "아직 시작한 문제집이 없습니다."}
                </strong>
              </div>
              <div>
                <span>마지막 학습</span>
                <strong>
                  {overviewStats.lastActivity?.created_at
                    ? new Date(overviewStats.lastActivity.created_at).toLocaleString("ko-KR")
                    : "학습 기록 없음"}
                </strong>
              </div>
            </div>
            <div className="studentWorkbookList">
              {overviewBookRows.map((row) => {
                const status =
                  row.total > 0 && row.accepted === row.total
                    ? "완료"
                    : row.submitted > 0
                      ? "진행 중"
                      : "미시작";
                return (
                  <article className="studentWorkbookRow" key={row.book.id}>
                    <div className="studentWorkbookHeading">
                      <div className="studentWorkbookTitle">
                        <span
                          className={`workbookState ${
                            status === "완료" ? "complete" : status === "진행 중" ? "active" : ""
                          }`}
                        >
                          {status}
                        </span>
                        <strong>{formatBookTitle(row.book)}</strong>
                      </div>
                      <div className="studentWorkbookCounts">
                        <span>
                          제출 <b>{row.submitted}</b>개
                        </span>
                        <span>
                          정답 <b>{row.accepted}</b>개
                        </span>
                        <span className={row.wrongProblems.length > 0 ? "wrongCount" : ""}>
                          오답 <b>{row.wrongProblems.length}</b>개
                        </span>
                        <span>
                          미제출 <b>{row.unsubmittedProblems.length}</b>개
                        </span>
                      </div>
                    </div>
                    <div
                      className="studentWorkbookProgress"
                      aria-label={`제출률 ${row.submittedProgress}%, 정답률 ${row.acceptedProgress}%`}
                    >
                      <span
                        className="submittedProgress"
                        style={{ width: `${row.submittedProgress}%` }}
                      />
                      <span
                        className="acceptedProgress"
                        style={{ width: `${row.acceptedProgress}%` }}
                      />
                    </div>
                    <div className="studentProblemGroups">
                      {row.problemGroups.map((group) => (
                        <section className="studentProblemGroup" key={group.id}>
                          <strong>
                            {group.code} {group.title}
                          </strong>
                          <div className="studentProblemDots">
                            {group.items.map(({ problem, submission }) => {
                              const resultClass = !submission
                                ? "unsubmitted"
                                : submission.status === "accepted"
                                  ? "correct"
                                  : "incorrect";
                              const label = !submission
                                ? "미제출"
                                : submission.status === "accepted"
                                  ? "정답"
                                  : "오답";
                              return (
                                <button
                                  className={`studentProblemDot ${resultClass}`}
                                  type="button"
                                  key={problem.id}
                                  disabled={!submission}
                                  title={`${problem.title}: ${label}`}
                                  aria-label={`${problem.title} ${label}`}
                                  onClick={() => submission && setSelectedSubmission(submission)}
                                >
                                  {Number(formatProblemNumber(problem))}
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {selectedSubmission && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setSelectedSubmission(null)}>
          <div
            className="submissionCodeModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-code-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="iconButton closeButton" onClick={() => setSelectedSubmission(null)} aria-label="닫기">
              <X size={18} />
            </button>
            <span className={`submissionResultBadge ${selectedSubmission.status}`}>
              {selectedSubmission.status === "accepted" ? "정답" : "오답"}
            </span>
            <h2 id="submission-code-title">
              {selectedSubmission.students?.student_no} {selectedSubmission.students?.name} ·{" "}
              {problemTitle(selectedSubmission.problem_id, problems)}
            </h2>
            <p className="submissionCodeMeta">
              통과 {selectedSubmission.passed_count}/{selectedSubmission.total_count}
              {selectedSubmission.created_at
                ? ` · ${new Date(selectedSubmission.created_at).toLocaleString("ko-KR")}`
                : ""}
            </p>
            <div className="submissionHistoryLayout">
              <aside className="submissionHistoryList">
                <strong>과거 제출 이력</strong>
                {selectedSubmissionHistory.map((submission, index) => (
                  <button
                    type="button"
                    className={submission.id === selectedSubmission.id ? "active" : ""}
                    key={submission.id ?? `${submission.created_at}-${index}`}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <span className={`submissionResultBadge ${submission.status}`}>
                      {submission.status === "accepted" ? "정답" : "오답"}
                    </span>
                    <b>{selectedSubmissionHistory.length - index}번째 제출</b>
                    <small>
                      {submission.created_at
                        ? new Date(submission.created_at).toLocaleString("ko-KR")
                        : "시간 정보 없음"}
                    </small>
                  </button>
                ))}
              </aside>
              <pre className="submittedCode">{selectedSubmission.code}</pre>
            </div>
          </div>
        </div>
      )}
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

function TeacherProblemManager({
  books,
  problems,
  onChanged
}: {
  books: ProblemBook[];
  problems: Problem[];
  onChanged: () => Promise<void>;
}) {
  const [managedBooks, setManagedBooks] = useState<ProblemBook[]>(books);
  const [managedProblems, setManagedProblems] = useState<Problem[]>(problems);
  const emptyProblem = (): Problem => ({
    id: "",
    bookId: managedBooks[0]?.id ?? "",
    order: managedProblems.length + 1,
    title: "",
    statement: "",
    inputDescription: "",
    outputDescription: "",
    starterCode: "",
    hint: "",
    examples: [{ input: "", output: "" }],
    testCases: [{ input: "", output: "" }],
    isPublished: true
  });
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkVisibilitySaving, setBulkVisibilitySaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ProblemImportResult | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerBookId, setManagerBookId] = useState(books[0]?.id ?? "");
  const [managerSubgroupFilter, setManagerSubgroupFilter] = useState("all");
  const importFileRef = useRef<HTMLInputElement>(null);
  const selectedManagedBook =
    managedBooks.find((book) => book.id === managerBookId) ?? managedBooks[0];
  const selectedManagedProblems = managedProblems
    .filter((problem) => problem.bookId === selectedManagedBook?.id)
    .sort((left, right) => left.order - right.order);
  const managedProblemGroups = groupProblems(selectedManagedProblems, selectedManagedBook);
  const filteredManagedProblems =
    managerSubgroupFilter === "all"
      ? selectedManagedProblems
      : managedProblemGroups.find((group) => group.id === managerSubgroupFilter)?.problems ?? [];
  const publishedManagedProblemCount = selectedManagedProblems.filter(
    (problem) => problem.isPublished !== false
  ).length;

  useEffect(() => {
    void loadManagedProblems();
  }, []);

  useEffect(() => {
    if (!editingProblem) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setEditingProblem(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingProblem, saving]);

  async function loadManagedProblems() {
    try {
      const response = await fetch("/api/teacher-problems", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        books?: ProblemBook[];
        problems?: Problem[];
      };
      if (!response.ok || !data.ok || !data.books || !data.problems) {
        setManagerError(data.message ?? "문제 관리 데이터를 불러오지 못했습니다.");
        return;
      }
      const nextBooks = data.books;
      const nextProblems = data.problems;
      setManagedBooks(nextBooks);
      setManagedProblems(nextProblems);
      setManagerBookId((current) =>
        nextBooks.some((book) => book.id === current) ? current : nextBooks[0]?.id ?? ""
      );
    } catch {
      setManagerError("문제 관리 데이터를 불러오지 못했습니다.");
    }
  }

  function openCreate() {
    setEditingProblem(emptyProblem());
    setIsCreating(true);
    setManagerError("");
  }

  function openEdit(problem: Problem) {
    setEditingProblem({
      ...problem,
      testCases: problem.testCases.length > 0 ? problem.testCases : [{ input: "", output: "" }]
    });
    setIsCreating(false);
    setManagerError("");
  }

  async function saveProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProblem) return;
    setSaving(true);
    setManagerError("");
    try {
      const response = await fetch("/api/teacher-problems", {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProblem,
          testCases: editingProblem.testCases.map((testCase, index) => ({
            ...testCase,
            isSample: index === 0
          }))
        })
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; code?: string };
      if (!response.ok || !data.ok) {
        setManagerError(`${data.message ?? "문제를 저장하지 못했습니다."}${data.code ? ` (${data.code})` : ""}`);
        return;
      }
      setEditingProblem(null);
      await Promise.all([loadManagedProblems(), onChanged()]);
    } catch {
      setManagerError("문제 저장 요청을 처리하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProblem(problem: Problem) {
    if (!window.confirm(`"${problem.title}" 문제를 삭제할까요? 제출 기록이 있으면 삭제가 제한될 수 있습니다.`)) {
      return;
    }
    setManagerError("");
    const response = await fetch(`/api/teacher-problems?id=${encodeURIComponent(problem.id)}`, {
      method: "DELETE"
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; code?: string };
    if (!response.ok || !data.ok) {
      setManagerError(`${data.message ?? "문제를 삭제하지 못했습니다."}${data.code ? ` (${data.code})` : ""}`);
      return;
    }
    await Promise.all([loadManagedProblems(), onChanged()]);
  }

  async function toggleProblemVisibility(problem: Problem) {
    const isPublished = problem.isPublished === false;
    setManagerError("");
    setManagedProblems((items) =>
      items.map((item) => (item.id === problem.id ? { ...item, isPublished } : item))
    );
    try {
      const response = await fetch("/api/teacher-problems", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: problem.id, isPublished })
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; code?: string };
      if (!response.ok || !data.ok) {
        throw new Error(`${data.message ?? "공개 상태를 변경하지 못했습니다."}${data.code ? ` (${data.code})` : ""}`);
      }
      await onChanged();
    } catch (error) {
      setManagedProblems((items) =>
        items.map((item) => (item.id === problem.id ? { ...item, isPublished: problem.isPublished } : item))
      );
      setManagerError(error instanceof Error ? error.message : "공개 상태를 변경하지 못했습니다.");
    }
  }

  async function setBookVisibility(isPublished: boolean) {
    if (!selectedManagedBook || bulkVisibilitySaving) return;
    setBulkVisibilitySaving(true);
    setManagerError("");
    try {
      const response = await fetch("/api/teacher-problems", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedManagedBook.id, isPublished })
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; code?: string };
      if (!response.ok || !data.ok) {
        throw new Error(
          `${data.message ?? "문제집 공개 상태를 변경하지 못했습니다."}${
            data.code ? ` (${data.code})` : ""
          }`
        );
      }
      await Promise.all([loadManagedProblems(), onChanged()]);
    } catch (error) {
      setManagerError(
        error instanceof Error ? error.message : "문제집 공개 상태를 변경하지 못했습니다."
      );
    } finally {
      setBulkVisibilitySaving(false);
    }
  }

  async function downloadImportTemplate() {
    setManagerError("");
    try {
      const { downloadProblemImportTemplate } = await import("@/lib/problem-import-xlsx");
      await downloadProblemImportTemplate();
    } catch {
      setManagerError("일괄 업로드 서식 파일을 만들지 못했습니다.");
    }
  }

  async function importProblemFile(file: File) {
    setImporting(true);
    setManagerError("");
    try {
      const { parseProblemWorkbook } = await import("@/lib/problem-import-xlsx");
      const importedProblems = await parseProblemWorkbook(file);
      const response = await fetch("/api/teacher-problems/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problems: importedProblems })
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        result?: ProblemImportResult;
      };
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.message ?? "문제 일괄 업로드에 실패했습니다.");
      }
      setImportResult(data.result);
      await Promise.all([loadManagedProblems(), onChanged()]);
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : "문제 일괄 업로드에 실패했습니다.");
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  function updateProblem<K extends keyof Problem>(key: K, value: Problem[K]) {
    setEditingProblem((problem) => (problem ? { ...problem, [key]: value } : problem));
  }

  function updateTestCase(index: number, key: "input" | "output", value: string) {
    setEditingProblem((problem) => {
      if (!problem) return problem;
      const testCases = problem.testCases.map((testCase, caseIndex) =>
        caseIndex === index ? { ...testCase, [key]: value } : testCase
      );
      return { ...problem, testCases, examples: testCases.slice(0, 1) };
    });
  }

  return (
    <section className="panel problemManager">
      <div className="problemManagerHeader">
        <button
          type="button"
          className="problemManagerToggle"
          onClick={() => setManagerOpen((open) => !open)}
          aria-expanded={managerOpen}
        >
          <div>
          <strong className="sectionChip">문제 관리</strong>
          </div>
          <ChevronDown size={20} />
        </button>
        {managerOpen && <div className="problemManagerActions">
          <button className="ghostButton" onClick={() => void downloadImportTemplate()}>
            <Download size={17} />
            서식 다운로드
          </button>
          <button
            className="managerActionButton"
            disabled={importing}
            onClick={() => importFileRef.current?.click()}
          >
            <Upload size={17} />
            {importing ? "업로드 중" : "일괄 업로드"}
          </button>
          <input
            ref={importFileRef}
            className="visuallyHidden"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importProblemFile(file);
            }}
          />
          <button className="primaryButton" onClick={openCreate}>
            <Plus size={18} />
            문제 추가
          </button>
        </div>}
      </div>
      {managerOpen && (
        <>
          <div className="problemManagerFilters">
            <label>
              문제집
              <select
                value={selectedManagedBook?.id ?? ""}
                onChange={(event) => {
                  setManagerBookId(event.target.value);
                  setManagerSubgroupFilter("all");
                }}
              >
                {managedBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {formatBookTitle(book)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              소분류
              <select
                value={managerSubgroupFilter}
                onChange={(event) => setManagerSubgroupFilter(event.target.value)}
              >
                <option value="all">전체</option>
                {managedProblemGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.code} {group.title}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {filteredManagedProblems.length}문제 · 전체 {selectedManagedProblems.length}문제 중{" "}
              {publishedManagedProblemCount}문제 공개
            </span>
            <div className="bookVisibilityActions">
              <button
                className="managerActionButton visibilityButton published"
                type="button"
                disabled={
                  bulkVisibilitySaving ||
                  selectedManagedProblems.length === 0 ||
                  (selectedManagedBook?.isPublished !== false &&
                    publishedManagedProblemCount === selectedManagedProblems.length)
                }
                onClick={() => void setBookVisibility(true)}
              >
                <Eye size={16} />
                {bulkVisibilitySaving ? "처리 중" : "전체 공개"}
              </button>
              <button
                className="managerActionButton visibilityButton private"
                type="button"
                disabled={
                  bulkVisibilitySaving ||
                  selectedManagedProblems.length === 0 ||
                  (selectedManagedBook?.isPublished === false &&
                    publishedManagedProblemCount === 0)
                }
                onClick={() => void setBookVisibility(false)}
              >
                <EyeOff size={16} />
                {bulkVisibilitySaving ? "처리 중" : "전체 비공개"}
              </button>
            </div>
          </div>
          {managerError && <p className="modalError">{managerError}</p>}
          <div className="managedProblemList">
        {filteredManagedProblems.map((problem) => (
          <div className="managedProblemRow" key={problem.id}>
            <div>
              <strong>{problem.title}</strong>
              <span>
                {managedBooks.find((book) => book.id === problem.bookId)
                  ? formatBookTitle(managedBooks.find((book) => book.id === problem.bookId)!)
                  : problem.bookId}{" "}
                · {problem.id}
              </span>
            </div>
            <button
              className={`managerActionButton visibilityButton ${problem.isPublished === false ? "private" : "published"}`}
              onClick={() => void toggleProblemVisibility(problem)}
              title={problem.isPublished === false ? "학생에게 공개" : "비공개로 전환"}
            >
              {problem.isPublished === false ? <EyeOff size={16} /> : <Eye size={16} />}
              {problem.isPublished === false ? "비공개" : "공개"}
            </button>
            <button className="managerActionButton editButton" onClick={() => openEdit(problem)}>
              <Pencil size={16} />
              수정
            </button>
            <button className="resetCodeButton" onClick={() => void deleteProblem(problem)}>
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        ))}
          </div>
        </>
      )}

      {editingProblem && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => !saving && setEditingProblem(null)}>
          <div
            className="problemEditorModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="problem-editor-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="iconButton closeButton" onClick={() => setEditingProblem(null)} aria-label="닫기">
              <X size={18} />
            </button>
            <h2 id="problem-editor-title">{isCreating ? "문제 추가" : "문제 수정"}</h2>
            <form onSubmit={saveProblem}>
              <div className="problemFormGrid">
                <label>
                  문제 ID
                  <input
                    value={editingProblem.id}
                    disabled={!isCreating}
                    placeholder="예: 1-1-01 정수 출력"
                    onChange={(event) => updateProblem("id", event.target.value)}
                  />
                </label>
                <label>
                  문제집
                  <select
                    value={editingProblem.bookId}
                    onChange={(event) => updateProblem("bookId", event.target.value)}
                  >
                    {managedBooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {formatBookTitle(book)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  제목
                  <input value={editingProblem.title} onChange={(event) => updateProblem("title", event.target.value)} />
                </label>
                <label>
                  정렬 순서
                  <input
                    type="number"
                    min="0"
                    value={editingProblem.order}
                    onChange={(event) => updateProblem("order", Number(event.target.value))}
                  />
                </label>
              </div>
              <label>
                문제 설명
                <textarea value={editingProblem.statement} onChange={(event) => updateProblem("statement", event.target.value)} />
              </label>
              <div className="problemFormGrid">
                <label>
                  입력 설명
                  <textarea
                    value={editingProblem.inputDescription}
                    onChange={(event) => updateProblem("inputDescription", event.target.value)}
                  />
                </label>
                <label>
                  출력 설명
                  <textarea
                    value={editingProblem.outputDescription}
                    onChange={(event) => updateProblem("outputDescription", event.target.value)}
                  />
                </label>
              </div>
              <label>
                스켈레톤 코드
                <textarea
                  className="problemCodeInput"
                  value={editingProblem.starterCode}
                  onChange={(event) => updateProblem("starterCode", event.target.value)}
                />
              </label>
              <label>
                힌트
                <textarea value={editingProblem.hint} onChange={(event) => updateProblem("hint", event.target.value)} />
              </label>
              <label className="publishToggle">
                <input
                  type="checkbox"
                  checked={editingProblem.isPublished !== false}
                  onChange={(event) => updateProblem("isPublished", event.target.checked)}
                />
                학생에게 공개
              </label>
              <div className="testCaseEditor">
                <div className="problemManagerHeader">
                  <h3>테스트케이스</h3>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() =>
                      updateProblem("testCases", [...editingProblem.testCases, { input: "", output: "" }])
                    }
                  >
                    <Plus size={16} />
                    케이스 추가
                  </button>
                </div>
                {editingProblem.testCases.map((testCase, index) => (
                  <div className="testCaseRow" key={index}>
                    <strong>{index === 0 ? "예시" : `숨김 ${index}`}</strong>
                    <textarea
                      placeholder="입력"
                      value={testCase.input}
                      onChange={(event) => updateTestCase(index, "input", event.target.value)}
                    />
                    <textarea
                      placeholder="기대 출력"
                      value={testCase.output}
                      onChange={(event) => updateTestCase(index, "output", event.target.value)}
                    />
                    <button
                      type="button"
                      className="iconButton"
                      disabled={editingProblem.testCases.length === 1}
                      onClick={() =>
                        updateProblem(
                          "testCases",
                          editingProblem.testCases.filter((_, caseIndex) => caseIndex !== index)
                        )
                      }
                      aria-label="테스트케이스 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {managerError && <p className="modalError">{managerError}</p>}
              <div className="modalActions">
                <button type="button" className="ghostButton" onClick={() => setEditingProblem(null)}>
                  취소
                </button>
                <button className="primaryButton" disabled={saving}>
                  {saving ? "저장 중" : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importResult && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setImportResult(null)}>
          <div
            className="importResultModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-result-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="iconButton closeButton" onClick={() => setImportResult(null)} aria-label="닫기">
              <X size={18} />
            </button>
            <FileSpreadsheet size={34} className="importResultIcon" />
            <h2 id="import-result-title">일괄 업로드 완료</h2>
            <p>업로드 후 DB에서 문제와 테스트케이스를 다시 확인했습니다.</p>
            <div className="importResultGrid">
              <ImportResultItem label="전체 문제" value={importResult.total} />
              <ImportResultItem label="신규 등록" value={importResult.inserted} />
              <ImportResultItem label="기존 수정" value={importResult.updated} />
              <ImportResultItem label="문제집" value={importResult.books} />
              <ImportResultItem label="테스트케이스" value={importResult.testCases} />
              <ImportResultItem label="모범답안" value={importResult.solutions} />
            </div>
            <div className="importVerification">
              <CheckCircle2 size={18} />
              DB 확인: 문제 {importResult.verifiedProblems}개 · 테스트케이스{" "}
              {importResult.verifiedTestCases}개 · 모범답안 {importResult.verifiedSolutions}개
            </div>
            {importResult.warnings.length > 0 && (
              <ul className="importWarnings">
                {importResult.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
            <button className="primaryButton wideButton" onClick={() => setImportResult(null)}>
              확인
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ImportResultItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function problemTitle(problemId: string, problems: Problem[]) {
  return problems.find((problem) => problem.id === problemId)?.title ?? problemId;
}

function formatBookTitle(book: ProblemBook) {
  return `${String(book.order).padStart(2, "0")} ${book.title}`;
}

function formatProblemNumber(problem: Problem) {
  const code = problem.id.match(/^(\d+(?:-\d+)+)/)?.[1];
  const lastNumber = code?.split("-").at(-1);
  return lastNumber ?? String(problem.order).padStart(2, "0");
}

function groupProblems(problems: Problem[], book?: ProblemBook) {
  const groups = new Map<string, Problem[]>();
  for (const problem of problems) {
    const code = problem.id.match(/^(\d+)-(\d+)-\d+/);
    const subgroup = code?.[2] ?? String(Math.floor(problem.order / 100) || 1);
    const key = `${book?.id ?? problem.bookId}:${subgroup}`;
    const items = groups.get(key) ?? [];
    items.push(problem);
    groups.set(key, items);
  }

  return [...groups.entries()].map(([id, groupedProblems], index) => {
    const firstProblem = groupedProblems[0];
    const subgroup = Number(firstProblem.id.match(/^\d+-(\d+)-\d+/)?.[1] ?? index + 1);
    const bookOrder = book?.order ?? Number(firstProblem.id.match(/^(\d+)-/)?.[1] ?? 0);
    return {
      id,
      code: `${bookOrder}-${subgroup}`,
      title: PROBLEM_GROUP_TITLES[bookOrder]?.[subgroup - 1] ?? `문항 묶음 ${subgroup}`,
      problems: groupedProblems
    };
  });
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
