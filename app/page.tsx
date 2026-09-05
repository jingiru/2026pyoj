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
  ChevronUp,
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
  Square,
  Trophy,
  Trash2,
  Upload,
  X
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent
} from "react";
import {
  problemBooks as fallbackProblemBooks,
  problems as fallbackProblems
} from "@/lib/problems";
import {
  CLASS_VISIBILITY_OPTIONS,
  formatClassLabel,
  getStudentGradeClassId,
  isStudentGradeClassId
} from "@/lib/student-class";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";
import { checkCodeRequirements } from "@/lib/code-requirements";
import {
  findOrCreateGuest,
  findOrCreateStudent,
  getLocalSubmissions,
  getDataErrorMessage,
  saveSubmission
} from "@/lib/supabase";
import type {
  Problem,
  ProblemBook,
  Student,
  SubmissionStatus,
  SubmissionWithStudent,
  TestCase
} from "@/lib/types";
import type { ProblemImportResult } from "@/lib/problem-import-types";

type Screen = "home" | "practice" | "solve" | "teacher";
type ColorMode = "light" | "dark";
type TeacherDashboardScope = { bookId: string; classId: string };
type TeacherDashboardCacheEntry = {
  submissions: SubmissionWithStudent[];
  after: string;
};
type JudgeResult = {
  status: SubmissionStatus;
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
const SOLVE_EDITOR_HEIGHT_STORAGE_KEY = "pyoj:solve-editor-height";
const SOLVE_CODE_FONT_SIZE_STORAGE_KEY = "pyoj:solve-code-font-size";
const SOLVE_CONSOLE_FONT_SIZE_STORAGE_KEY = "pyoj:solve-console-font-size";
const STUDENT_STORAGE_KEY = "pyoj:student";
const GUEST_TOKEN_STORAGE_KEY = "pyoj:guest-token";
const TEACHER_DASHBOARD_BOOK_STORAGE_KEY = "pyoj:teacher-dashboard-book";
const TEACHER_DASHBOARD_CLASS_STORAGE_KEY = "pyoj:teacher-dashboard-class";
const DEFAULT_TEACHER_DASHBOARD_CLASS_ID = "2-1";
const DASHBOARD_CACHE_MAX_ENTRIES = 20;
const DASHBOARD_EMPTY_CACHE_SYNC_OVERLAP_MS = 5 * 60 * 1000;
const DASHBOARD_POLL_INTERVAL_MS = 7000;
const DASHBOARD_BACKGROUND_POLL_INTERVAL_MS = 30000;
const DEFAULT_SOLVE_EDITOR_HEIGHT = 156;
const MIN_SOLVE_EDITOR_HEIGHT = 156;
const MIN_SOLVE_CONSOLE_HEIGHT = 143;
const SOLVE_EDITOR_HEADER_HEIGHT = 54;
const SOLVE_RESIZER_HEIGHT = 10;
const DEFAULT_PRACTICE_EDITOR_WIDTH = 50;
const MIN_PRACTICE_EDITOR_WIDTH = 0;
const MAX_PRACTICE_EDITOR_WIDTH = 100;
const DEFAULT_PRACTICE_EDITOR_HEIGHT = 50;
const MIN_PRACTICE_EDITOR_HEIGHT = 0;
const MAX_PRACTICE_EDITOR_HEIGHT = 100;
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
  const [practiceCodeFontSize, setPracticeCodeFontSize] = useState(30);
  const [practiceConsoleFontSize, setPracticeConsoleFontSize] = useState(30);
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
  const [problemFailureCounts, setProblemFailureCounts] = useState<Record<string, number>>({});
  const [latestJudgeResults, setLatestJudgeResults] = useState<Record<string, JudgeResult>>({});
  const [geminiHelpNotice, setGeminiHelpNotice] = useState("");
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
  const solveRunIdRef = useRef(0);
  const solveRunAbortControllerRef = useRef<AbortController | null>(null);
  const solveInputResolverRef = useRef<((value: string) => void) | null>(null);
  const solveQueuedInputsRef = useRef<string[]>([]);
  const solveConsoleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const solveRunInputsRef = useRef<string[]>([]);
  const practiceResizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);
  const [practiceEditorWidth, setPracticeEditorWidth] = useState(DEFAULT_PRACTICE_EDITOR_WIDTH);
  const [practiceEditorHeight, setPracticeEditorHeight] = useState(DEFAULT_PRACTICE_EDITOR_HEIGHT);
  const [isPracticeStacked, setIsPracticeStacked] = useState(false);
  const solveResizeRef = useRef<{ startY: number; startHeight: number; containerHeight: number } | null>(null);
  const solveIdeBodyRef = useRef<HTMLDivElement | null>(null);
  const [solveEditorHeight, setSolveEditorHeight] = useState(DEFAULT_SOLVE_EDITOR_HEIGHT);
  const [bookSidebarOpen, setBookSidebarOpen] = useState(true);
  const [problemListOpen, setProblemListOpen] = useState(true);
  const [expandedProblemGroups, setExpandedProblemGroups] = useState<Set<string>>(() => new Set());
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [personalSubmissions, setPersonalSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [personalHistoryOpen, setPersonalHistoryOpen] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState<Student[]>([]);
  const [teacherDashboardBookId, setTeacherDashboardBookId] = useState("");
  const [teacherDashboardClassId, setTeacherDashboardClassId] = useState(
    DEFAULT_TEACHER_DASHBOARD_CLASS_ID
  );
  const [loading, setLoading] = useState(false);
  const [editorStorageReady, setEditorStorageReady] = useState(false);
  const latestDashboardSubmissionAtRef = useRef<string | null>(null);
  const dashboardRefreshInFlightRef = useRef(false);
  const dashboardRequestIdRef = useRef(0);
  const teacherDashboardScopeRef = useRef<TeacherDashboardScope>({ bookId: "", classId: "" });
  const teacherDashboardCacheRef = useRef(new Map<string, TeacherDashboardCacheEntry>());

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
    if (screen !== "solve") cancelSolveRun();
  }, [screen]);

  useEffect(
    () => () => {
      solveRunAbortControllerRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1120px)");
    const syncPracticeLayout = () => setIsPracticeStacked(mediaQuery.matches);

    syncPracticeLayout();
    mediaQuery.addEventListener("change", syncPracticeLayout);
    return () => mediaQuery.removeEventListener("change", syncPracticeLayout);
  }, []);

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
    if (!geminiHelpNotice) return;

    const timeout = window.setTimeout(() => setGeminiHelpNotice(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [geminiHelpNotice]);

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
    if (screen !== "teacher" || !isTeacherAuthenticated) return;

    let stopped = false;
    let timeoutId: number | undefined;

    const scheduleNextRefresh = () => {
      if (stopped) return;
      const interval =
        document.visibilityState === "hidden"
          ? DASHBOARD_BACKGROUND_POLL_INTERVAL_MS
          : DASHBOARD_POLL_INTERVAL_MS;
      timeoutId = window.setTimeout(async () => {
        await refreshDashboard({ incremental: true });
        scheduleNextRefresh();
      }, interval);
    };

    const handleVisibilityChange = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (document.visibilityState === "visible") void refreshDashboard({ incremental: true });
      scheduleNextRefresh();
    };

    scheduleNextRefresh();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopped = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [screen, isTeacherAuthenticated]);

  useEffect(() => {
    const savedPracticeCode = getStoredValue(PRACTICE_CODE_STORAGE_KEY);
    if (savedPracticeCode !== null) setPracticeCode(savedPracticeCode);
    setAutoAdvanceOnAccepted(getStoredValue(AUTO_ADVANCE_STORAGE_KEY) === "true");
    const savedCodeFontSize = getStoredFontSize(SOLVE_CODE_FONT_SIZE_STORAGE_KEY);
    if (savedCodeFontSize !== null) setCodeFontSize(savedCodeFontSize);
    const savedConsoleFontSize = getStoredFontSize(SOLVE_CONSOLE_FONT_SIZE_STORAGE_KEY);
    if (savedConsoleFontSize !== null) setConsoleFontSize(savedConsoleFontSize);
    const savedSolveEditorHeight = Number(getStoredValue(SOLVE_EDITOR_HEIGHT_STORAGE_KEY));
    if (Number.isFinite(savedSolveEditorHeight)) {
      setSolveEditorHeight(clampSolveEditorHeight(savedSolveEditorHeight));
    }

    const savedStudent = getStoredStudent();
    if (savedStudent) {
      setStudent(savedStudent);
      setStudentNo(savedStudent.student_no);
      setName(savedStudent.name);
      void refreshSolvedProblems(savedStudent.id);
      setPersonalSubmissions(getLocalSubmissions(savedStudent.id));
    }

    const savedProblemId = getStoredValue(SELECTED_PROBLEM_STORAGE_KEY);
    const savedProblem = fallbackProblems.find((problem) => problem.id === savedProblemId);
    if (savedProblem) {
      setSelectedProblemId(savedProblem.id);
      setSelectedBookId(savedProblem.bookId);
      setCode(getSavedProblemCode(savedProblem.id) ?? savedProblem.starterCode);
    } else if (savedProblemId) {
      // DB curriculum may not be loaded yet. Preserve its problem ID until refreshCurriculum resolves it.
      setSelectedProblemId(savedProblemId);
      setCode(getSavedProblemCode(savedProblemId) ?? DEFAULT_PROBLEM.starterCode);
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

  useEffect(() => {
    if (!editorStorageReady) return;
    setStoredValue(SOLVE_EDITOR_HEIGHT_STORAGE_KEY, String(solveEditorHeight));
  }, [editorStorageReady, solveEditorHeight]);

  useEffect(() => {
    if (!editorStorageReady) return;
    setStoredValue(SOLVE_CODE_FONT_SIZE_STORAGE_KEY, String(codeFontSize));
    setStoredValue(SOLVE_CONSOLE_FONT_SIZE_STORAGE_KEY, String(consoleFontSize));
  }, [codeFontSize, consoleFontSize, editorStorageReady]);

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
      setStoredValue(STUDENT_STORAGE_KEY, JSON.stringify(signedIn));
      setPersonalSubmissions(getLocalSubmissions(signedIn.id));
      void refreshSolvedProblems(signedIn.id);
      void refreshCurriculum(signedIn);
      setLoginOpen(false);
      navigateTo("solve");
      setNotice("");
    } catch (error) {
      setNotice(getDataErrorMessage(error, "로그인 중 문제가 생겼어요. Supabase 연결을 확인해주세요."));
    } finally {
      setLoading(false);
    }
  }

  async function continueAsGuest() {
    setLoading(true);
    try {
      const token = getOrCreateGuestToken();
      const guest = await findOrCreateGuest(token);
      setStudent(guest);
      setStoredValue(STUDENT_STORAGE_KEY, JSON.stringify(guest));
      setPersonalSubmissions(getLocalSubmissions(guest.id));
      void refreshSolvedProblems(guest.id);
      void refreshCurriculum(guest);
      setLoginOpen(false);
      navigateTo("solve");
      setNotice("");
    } catch (error) {
      setNotice(getDataErrorMessage(error, "비로그인 모드를 시작하지 못했어요."));
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
      latestDashboardSubmissionAtRef.current = null;
      teacherDashboardCacheRef.current.clear();
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
    removeStoredValue(STUDENT_STORAGE_KEY);
    setPersonalSubmissions([]);
    setPersonalHistoryOpen(false);
    setSolvedProblemIds(new Set());
    setResult(null);
    setNotice("");
    void refreshCurriculum();
    navigateTo("home");
  }

  function dismissResultToast() {
    setIsResultToastClosing(true);
    window.setTimeout(() => setResult(null), 300);
  }

  async function refreshSolvedProblems(studentId: string) {
    const localProblemIds = getLocalSubmissions(studentId)
      .filter((submission) => submission.status === "accepted")
      .map((submission) => submission.problem_id);
    try {
      const savedStudent = getStoredStudent();
      const query = new URLSearchParams({ studentId });
      const headers: HeadersInit = {};
      if (savedStudent?.is_guest) {
        const guestToken = getStoredValue(GUEST_TOKEN_STORAGE_KEY);
        if (guestToken) headers["x-pyoj-guest-token"] = guestToken;
      }
      const response = await fetch(`/api/submissions?${query.toString()}`, {
        cache: "no-store",
        headers
      });
      const data = (await response.json()) as { ok?: boolean; problemIds?: string[] };
      if (response.ok && data.ok) {
        setSolvedProblemIds(new Set([...(data.problemIds ?? []), ...localProblemIds]));
      } else {
        setSolvedProblemIds(new Set(localProblemIds));
      }
    } catch {
      setSolvedProblemIds(new Set(localProblemIds));
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
    cancelSolveRun();
    setSelectedProblemId(problem.id);
    setSelectedBookId(problem.bookId);
    setCode(getSavedProblemCode(problem.id) ?? problem.starterCode);
    setResult(null);
    resetSolveConsole();
  }

  async function refreshCurriculum(studentOverride?: Student | null) {
    try {
      const savedStudent = studentOverride ?? getStoredStudent();
      const headers: HeadersInit = {};
      if (savedStudent?.is_guest) {
        const guestToken = getStoredValue(GUEST_TOKEN_STORAGE_KEY);
        if (guestToken) headers["x-pyoj-guest-token"] = guestToken;
      } else if (savedStudent?.id) {
        headers["x-pyoj-student-id"] = savedStudent.id;
      }
      const response = await fetch("/api/curriculum", {
        cache: "no-store",
        headers
      });
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

  function clampPracticeEditorWidth(width: number) {
    return Math.min(MAX_PRACTICE_EDITOR_WIDTH, Math.max(MIN_PRACTICE_EDITOR_WIDTH, width));
  }

  function clampPracticeEditorHeight(height: number) {
    return Math.min(MAX_PRACTICE_EDITOR_HEIGHT, Math.max(MIN_PRACTICE_EDITOR_HEIGHT, height));
  }

  function startPracticeResize(event: ReactPointerEvent<HTMLDivElement>) {
    const containerRect = event.currentTarget.parentElement?.getBoundingClientRect();
    practiceResizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: practiceEditorWidth,
      startHeight: practiceEditorHeight,
      containerWidth: containerRect?.width ?? window.innerWidth,
      containerHeight: containerRect?.height ?? window.innerHeight
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("resizingPracticePane");
  }

  function movePracticeResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = practiceResizeRef.current;
    if (!resize) return;
    const widthDelta = resize.containerWidth > 0 ? ((event.clientX - resize.startX) / resize.containerWidth) * 100 : 0;
    const heightDelta = resize.containerHeight > 0 ? ((event.clientY - resize.startY) / resize.containerHeight) * 100 : 0;

    setPracticeEditorWidth(clampPracticeEditorWidth(resize.startWidth + widthDelta));
    setPracticeEditorHeight(clampPracticeEditorHeight(resize.startHeight + heightDelta));
  }

  function stopPracticeResize(event: ReactPointerEvent<HTMLDivElement>) {
    practiceResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove("resizingPracticePane");
  }

  function resizePracticeEditorWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const horizontalKeys = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const verticalKeys = event.key === "ArrowUp" || event.key === "ArrowDown";
    if ((!isPracticeStacked && !horizontalKeys) || (isPracticeStacked && !verticalKeys)) return;

    event.preventDefault();
    const change = event.shiftKey ? 8 : 2;
    if (isPracticeStacked) {
      setPracticeEditorHeight((height) =>
        clampPracticeEditorHeight(height + (event.key === "ArrowDown" ? change : -change))
      );
      return;
    }

    setPracticeEditorWidth((width) =>
      clampPracticeEditorWidth(width + (event.key === "ArrowRight" ? change : -change))
    );
  }

  function resetPracticePaneSize() {
    setPracticeEditorWidth(DEFAULT_PRACTICE_EDITOR_WIDTH);
    setPracticeEditorHeight(DEFAULT_PRACTICE_EDITOR_HEIGHT);
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
      setLatestJudgeResults((current) => ({ ...current, [selectedProblem.id]: judged }));
      setProblemFailureCounts((current) => ({
        ...current,
        [selectedProblem.id]:
          judged.status === "accepted" ? 0 : (current[selectedProblem.id] ?? 0) + 1
      }));
      await saveSubmission(
        {
          student_id: student.id,
          problem_id: selectedProblem.id,
          code,
          status: judged.status,
          passed_count: judged.passedCount,
          total_count: judged.totalCount,
          feedback: judged.feedback
        },
        student.is_guest ? getStoredValue(GUEST_TOKEN_STORAGE_KEY) ?? undefined : undefined
      );
      setPersonalSubmissions(getLocalSubmissions(student.id));
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

  async function openGeminiHelp() {
    window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer");

    const problemInfo = formatProblemForGemini(
      selectedProblem,
      code,
      problemFailureCounts[selectedProblem.id] ?? 0,
      latestJudgeResults[selectedProblem.id]
    );
    const copied = await copyTextToClipboard(problemInfo);
    setGeminiHelpNotice(
      copied
        ? "문제 정보를 복사하였습니다. 붙여넣기(Ctrl+V) 후 질문을 작성해보세요."
        : "Gemini를 열었습니다. 문제 정보 복사에 실패하여 직접 복사해 주세요."
    );
  }

  async function runSolveCode() {
    if (solveRunAbortControllerRef.current) return;
    const runId = ++solveRunIdRef.current;
    const abortController = new AbortController();
    const runInputs: string[] = [];
    const runOutputs: string[] = [];
    const runErrors: string[] = [];
    const startedAt = performance.now();
    const codeSnapshot = code;
    const problemIdSnapshot = selectedProblem.id;
    const studentSnapshot = student;
    solveRunAbortControllerRef.current = abortController;
    setIsSolveRunning(true);
    setResult(null);
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    setSolveInputHistory([]);
    solveQueuedInputsRef.current = [];
    solveRunInputsRef.current = runInputs;
    setSolveConsoleLines([]);

    try {
      await runPythonWithSkulpt(codeSnapshot, {
        output: (text) => {
          if (solveRunIdRef.current !== runId) return;
          runOutputs.push(text);
          setSolveConsoleLines((lines) => appendConsoleText(lines, text));
        },
        error: (text) => {
          if (solveRunIdRef.current !== runId) return;
          runErrors.push(text);
          setSolveConsoleLines((lines) => [...lines, text]);
        },
        input: (prompt) => requestSolveConsoleInput(prompt, runId)
      }, { signal: abortController.signal });
    } finally {
      const isCurrentRun = solveRunIdRef.current === runId;
      if (isCurrentRun) {
        solveRunAbortControllerRef.current = null;
        solveInputResolverRef.current = null;
        setSolvePendingPrompt(null);
        setIsSolveRunning(false);
      }
      if (studentSnapshot && !abortController.signal.aborted) {
        await saveCodeRunLog({
          studentId: studentSnapshot.id,
          problemId: problemIdSnapshot,
          code: codeSnapshot,
          stdin: runInputs.join("\n"),
          stdout: runOutputs.join(""),
          stderr: runErrors.join("\n"),
          status: runErrors.length > 0 ? "runtime_error" : "success",
          executionTimeMs: performance.now() - startedAt,
          guestToken: studentSnapshot.is_guest
            ? getStoredValue(GUEST_TOKEN_STORAGE_KEY) ?? undefined
            : undefined
        });
      }
    }
  }

  function requestSolveConsoleInput(prompt: string, runId: number) {
    if (solveRunIdRef.current !== runId) return new Promise<string>(() => undefined);
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

  function cancelSolveRun() {
    const abortController = solveRunAbortControllerRef.current;
    if (!abortController) return;
    solveRunIdRef.current += 1;
    solveRunAbortControllerRef.current = null;
    solveInputResolverRef.current = null;
    abortController.abort();
    setSolvePendingPrompt(null);
    setSolveConsoleInput("");
    setIsSolveRunning(false);
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
    guestToken?: string;
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

  function clampSolveEditorHeight(height: number, containerHeight?: number) {
    const availableHeight =
      containerHeight ?? solveIdeBodyRef.current?.getBoundingClientRect().height ?? window.innerHeight - 220;
    const maxHeight = Math.max(
      MIN_SOLVE_EDITOR_HEIGHT,
      availableHeight - SOLVE_EDITOR_HEADER_HEIGHT - SOLVE_RESIZER_HEIGHT - MIN_SOLVE_CONSOLE_HEIGHT
    );
    return Math.min(maxHeight, Math.max(MIN_SOLVE_EDITOR_HEIGHT, height));
  }

  function startSolveResize(event: ReactPointerEvent<HTMLDivElement>) {
    const containerHeight = solveIdeBodyRef.current?.getBoundingClientRect().height ?? window.innerHeight - 220;
    solveResizeRef.current = {
      startY: event.clientY,
      startHeight: solveEditorHeight,
      containerHeight
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("resizingSolvePane");
  }

  function moveSolveResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = solveResizeRef.current;
    if (!resize) return;
    setSolveEditorHeight(
      clampSolveEditorHeight(resize.startHeight + event.clientY - resize.startY, resize.containerHeight)
    );
  }

  function stopSolveResize(event: ReactPointerEvent<HTMLDivElement>) {
    solveResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove("resizingSolvePane");
  }

  function resizeSolveEditorWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const change = event.shiftKey ? 40 : 10;
    setSolveEditorHeight((height) =>
      clampSolveEditorHeight(height + (event.key === "ArrowDown" ? change : -change))
    );
  }

  async function refreshDashboard(
    options: { incremental?: boolean; bookId?: string; classId?: string } = {}
  ) {
    const hasExplicitScope = options.bookId !== undefined || options.classId !== undefined;
    if (options.incremental && dashboardRefreshInFlightRef.current && !hasExplicitScope) return;

    const storedBookId = getStoredValue(TEACHER_DASHBOARD_BOOK_STORAGE_KEY)?.trim() ?? "";
    const storedClassId = normalizeTeacherDashboardClassId(
      getStoredValue(TEACHER_DASHBOARD_CLASS_STORAGE_KEY)
    );
    const requestedScope = {
      bookId: options.bookId ?? (teacherDashboardScopeRef.current.bookId || storedBookId),
      classId:
        options.classId ?? (teacherDashboardScopeRef.current.classId || storedClassId)
    };
    const requestedCacheKey = getTeacherDashboardCacheKey(requestedScope);
    const syncFallbackAfter = new Date(
      Date.now() - DASHBOARD_EMPTY_CACHE_SYNC_OVERLAP_MS
    ).toISOString();
    const incremental = options.incremental && Boolean(latestDashboardSubmissionAtRef.current);
    const requestId = dashboardRequestIdRef.current + 1;
    dashboardRequestIdRef.current = requestId;
    dashboardRefreshInFlightRef.current = true;
    if (!incremental) {
      teacherDashboardScopeRef.current = requestedScope;
      setTeacherDashboardBookId(requestedScope.bookId);
      setTeacherDashboardClassId(requestedScope.classId);
      latestDashboardSubmissionAtRef.current = null;
      setLoading(true);
      setNotice("");
    }
    try {
      const query = new URLSearchParams({ classId: requestedScope.classId });
      if (requestedScope.bookId) query.set("bookId", requestedScope.bookId);
      if (incremental && latestDashboardSubmissionAtRef.current) {
        query.set("after", latestDashboardSubmissionAtRef.current);
      }
      const response = await fetch(
        `/api/teacher-dashboard${query.toString() ? `?${query.toString()}` : ""}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        ok?: boolean;
        submissions?: SubmissionWithStudent[];
        students?: Student[];
        scope?: TeacherDashboardScope;
        message?: string;
        code?: string;
      };

      if (requestId !== dashboardRequestIdRef.current) return;

      if (response.status === 401) {
        setIsTeacherAuthenticated(false);
        setSubmissions([]);
        setTeacherStudents([]);
        latestDashboardSubmissionAtRef.current = null;
        teacherDashboardCacheRef.current.clear();
        setTeacherLoginError("교사 로그인이 필요합니다.");
        setTeacherLoginOpen(true);
        navigateTo("home");
        return;
      }

      if (!response.ok || !data.ok) {
        const suffix = data.code ? ` (${data.code})` : "";
        if (!incremental) {
          setNotice(`${data.message ?? "대시보드를 불러오지 못했습니다."}${suffix}`);
        }
        return;
      }

      const resolvedScope = data.scope ?? requestedScope;
      const resolvedCacheKey = getTeacherDashboardCacheKey(resolvedScope);
      if (incremental) {
        const nextSubmissions = data.submissions ?? [];
        if (nextSubmissions.length > 0) {
          const cached = teacherDashboardCacheRef.current.get(resolvedCacheKey);
          const merged = mergeSubmissions(cached?.submissions ?? submissions, nextSubmissions);
          const after =
            getLatestSubmissionCreatedAt(merged) ??
            latestDashboardSubmissionAtRef.current ??
            syncFallbackAfter;
          latestDashboardSubmissionAtRef.current = after;
          setTeacherDashboardCacheEntry(teacherDashboardCacheRef.current, resolvedCacheKey, {
            submissions: merged,
            after
          });
          setSubmissions(merged);
          setTeacherStudents((current) => mergeStudentsFromSubmissions(current, nextSubmissions));
        } else {
          const cached = teacherDashboardCacheRef.current.get(requestedCacheKey);
          if (cached) {
            setTeacherDashboardCacheEntry(
              teacherDashboardCacheRef.current,
              requestedCacheKey,
              cached
            );
          }
        }
      } else {
        const nextSubmissions = data.submissions ?? [];
        const after = getLatestSubmissionCreatedAt(nextSubmissions) ?? syncFallbackAfter;
        teacherDashboardScopeRef.current = resolvedScope;
        setTeacherDashboardBookId(resolvedScope.bookId);
        setTeacherDashboardClassId(resolvedScope.classId);
        setStoredValue(TEACHER_DASHBOARD_BOOK_STORAGE_KEY, resolvedScope.bookId);
        setStoredValue(TEACHER_DASHBOARD_CLASS_STORAGE_KEY, resolvedScope.classId);
        setSubmissions(nextSubmissions);
        setTeacherStudents(data.students ?? []);
        latestDashboardSubmissionAtRef.current = after;
        setTeacherDashboardCacheEntry(teacherDashboardCacheRef.current, resolvedCacheKey, {
          submissions: nextSubmissions,
          after
        });
      }
    } catch {
      if (!incremental && requestId === dashboardRequestIdRef.current) {
        setNotice("대시보드 데이터를 불러오지 못했습니다.");
      }
    } finally {
      if (requestId === dashboardRequestIdRef.current) {
        dashboardRefreshInFlightRef.current = false;
        if (!incremental) setLoading(false);
      }
    }
  }

  function changeTeacherDashboardScope(bookId: string, classId: string) {
    const nextScope = { bookId, classId: normalizeTeacherDashboardClassId(classId) };
    if (
      nextScope.bookId === teacherDashboardScopeRef.current.bookId &&
      nextScope.classId === teacherDashboardScopeRef.current.classId
    ) {
      return;
    }

    teacherDashboardScopeRef.current = nextScope;
    setTeacherDashboardBookId(nextScope.bookId);
    setTeacherDashboardClassId(nextScope.classId);
    setStoredValue(TEACHER_DASHBOARD_BOOK_STORAGE_KEY, nextScope.bookId);
    setStoredValue(TEACHER_DASHBOARD_CLASS_STORAGE_KEY, nextScope.classId);
    const cacheKey = getTeacherDashboardCacheKey(nextScope);
    const cached = teacherDashboardCacheRef.current.get(cacheKey);
    if (cached) {
      setTeacherDashboardCacheEntry(teacherDashboardCacheRef.current, cacheKey, cached);
      setSubmissions(cached.submissions);
      latestDashboardSubmissionAtRef.current = cached.after;
      setLoading(false);
      void refreshDashboard({ ...nextScope, incremental: true });
      return;
    }

    setSubmissions([]);
    latestDashboardSubmissionAtRef.current = null;
    void refreshDashboard(nextScope);
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
          <div
            className="practiceGrid"
            style={
              {
                "--practice-editor-share": `${practiceEditorWidth}fr`,
                "--practice-console-share": `${100 - practiceEditorWidth}fr`,
                "--practice-editor-height-share": `${practiceEditorHeight}fr`,
                "--practice-console-height-share": `${100 - practiceEditorHeight}fr`
              } as CSSProperties
            }
          >
            <article className="idePane">
              <div className="ideHeader">
                <div>
                  <strong>코드 에디터</strong>
                </div>
                <div className="ideActions">
                  <FontSizeControl
                    label="코드 글자 크기"
                    value={practiceCodeFontSize}
                    onDecreaseLarge={() => setPracticeCodeFontSize((size) => Math.max(12, size - 10))}
                    onDecrease={() => setPracticeCodeFontSize((size) => Math.max(12, size - 1))}
                    onIncrease={() => setPracticeCodeFontSize((size) => Math.min(60, size + 1))}
                    onIncreaseLarge={() => setPracticeCodeFontSize((size) => Math.min(60, size + 10))}
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
                fontSize={practiceCodeFontSize}
              />
            </article>
            <div
              className="practicePaneResizer"
              role="separator"
              aria-label="코드 에디터와 콘솔 창 크기 조절"
              aria-orientation={isPracticeStacked ? "horizontal" : "vertical"}
              aria-valuemin={isPracticeStacked ? MIN_PRACTICE_EDITOR_HEIGHT : MIN_PRACTICE_EDITOR_WIDTH}
              aria-valuemax={isPracticeStacked ? MAX_PRACTICE_EDITOR_HEIGHT : MAX_PRACTICE_EDITOR_WIDTH}
              aria-valuenow={isPracticeStacked ? practiceEditorHeight : practiceEditorWidth}
              tabIndex={0}
              onPointerDown={startPracticeResize}
              onPointerMove={movePracticeResize}
              onPointerUp={stopPracticeResize}
              onPointerCancel={stopPracticeResize}
              onDoubleClick={resetPracticePaneSize}
              onKeyDown={resizePracticeEditorWithKeyboard}
            >
              <span />
            </div>
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
                    value={practiceConsoleFontSize}
                    onDecreaseLarge={() => setPracticeConsoleFontSize((size) => Math.max(12, size - 10))}
                    onDecrease={() => setPracticeConsoleFontSize((size) => Math.max(12, size - 1))}
                    onIncrease={() => setPracticeConsoleFontSize((size) => Math.min(60, size + 1))}
                    onIncreaseLarge={() => setPracticeConsoleFontSize((size) => Math.min(60, size + 10))}
                  />
                  <span>{pendingPrompt !== null ? "입력 대기 중" : isPracticeRunning ? "실행 중" : "실행 결과"}</span>
                </div>
              </div>
              <div className="terminal" aria-live="polite" style={{ fontSize: `${practiceConsoleFontSize}px` }}>
                <div className="terminalScroll">
                  <pre>{consoleLines.join("\n")}</pre>
                  {pendingPrompt !== null && (
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
                  )}
                  <div className="terminalHint">
                    <strong>입력값</strong>
                    {inputHistory.map((item, index) => (
                      <code key={`${item}-${index}`}>{item || "(빈 값)"}</code>
                    ))}
                    {pendingPrompt !== null && consoleInput !== "" && (
                      <code className="currentInputValue">{consoleInput}</code>
                    )}
                    {inputHistory.length === 0 && consoleInput === "" ? (
                      <span>아직 입력한 값이 없습니다.</span>
                    ) : null}
                  </div>
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
                  {student && (
                    <button className="ghostButton" onClick={() => setPersonalHistoryOpen(true)}>
                      내 기록 {personalSubmissions.length}
                    </button>
                  )}
                  <button className="ghostButton" onClick={() => setCode(selectedProblem.starterCode)}>
                    <Play size={17} />
                    초기 코드
                  </button>
                  <button
                    type="button"
                    className={`runButton${isSolveRunning ? " stopButton" : ""}`}
                    onClick={() => isSolveRunning ? cancelSolveRun() : void runSolveCode()}
                  >
                    {isSolveRunning ? <Square size={17} fill="currentColor" /> : <Play size={17} />}
                    {isSolveRunning ? "실행중지" : "실행"}
                    {!isSolveRunning && <kbd className="compactShortcut">Shift + Enter</kbd>}
                  </button>
                  <button className="primaryButton" onClick={() => void submitCode()} disabled={isSubmitting}>
                    <Send size={17} />
                    {isSubmitting ? "채점 중" : "제출"}
                    <kbd className="compactShortcut">Alt + Enter</kbd>
                  </button>
                </div>
              </div>
              <div
                className="solveIdeBody"
                ref={solveIdeBodyRef}
                style={{ "--solve-editor-height": `${solveEditorHeight}px` } as CSSProperties}
              >
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
                    onSubmit={submitCode}
                    colorMode={colorMode}
                    fontSize={codeFontSize}
                  />
                </div>
                <div
                  className="solvePaneResizer"
                  role="separator"
                  aria-label="코드 에디터와 출력 콘솔 높이 조절"
                  aria-orientation="horizontal"
                  aria-valuemin={MIN_SOLVE_EDITOR_HEIGHT}
                  aria-valuenow={solveEditorHeight}
                  tabIndex={0}
                  onPointerDown={startSolveResize}
                  onPointerMove={moveSolveResize}
                  onPointerUp={stopSolveResize}
                  onPointerCancel={stopSolveResize}
                  onKeyDown={resizeSolveEditorWithKeyboard}
                >
                  <span />
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
                      {solvePendingPrompt !== null && (
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
                      )}
                      <div className="terminalHint">
                        <strong>입력값</strong>
                        {solveInputHistory.map((item, index) => (
                          <code key={`${item}-${index}`}>{item || "(빈 값)"}</code>
                        ))}
                        {solvePendingPrompt !== null && solveConsoleInput !== "" && (
                          <code className="currentInputValue">{solveConsoleInput}</code>
                        )}
                        {solveInputHistory.length === 0 && solveConsoleInput === "" ? (
                          <span>아직 입력한 값이 없습니다.</span>
                        ) : null}
                      </div>
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
          selectedBookId={teacherDashboardBookId}
          classFilter={teacherDashboardClassId}
          onScopeChange={changeTeacherDashboardScope}
          onRefresh={() => void refreshDashboard()}
          onCurriculumChanged={refreshCurriculum}
          onLogout={() => void logoutTeacher()}
        />
      )}

      {screen === "solve" && (problemFailureCounts[selectedProblem.id] ?? 0) >= 3 && (
        <aside className="geminiHelp" aria-label="Gemini 도움말">
          <div className="geminiHelpBubble">제미나이에게 물어보세요!</div>
          {geminiHelpNotice && (
            <div className="geminiHelpNotice" role="status" aria-live="polite">
              {geminiHelpNotice}
            </div>
          )}
          <button
            type="button"
            className="geminiHelpButton"
            onClick={() => void openGeminiHelp()}
            aria-label="문제 정보를 복사하고 Gemini 새 탭 열기"
          >
            <Sparkles size={25} />
            <span>AI 도움</span>
          </button>
        </aside>
      )}

      {result && (
        <aside
          className={[
            "submissionToast",
            submissionResultClass(result.status),
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
            <strong>
              {result.status === "accepted"
                ? "성공"
                : result.status === "code_requirement_failed"
                  ? "코드 조건 미충족"
                  : "채점 결과"}
            </strong>
          </div>
          <p>
            총 {result.totalCount}개의 테스트 케이스 중 <b>{result.passedCount}개</b>를 통과했습니다.
          </p>
          {result.status === "code_requirement_failed" && (
            <p className="codeRequirementNotice">
              테스트 케이스는 통과했지만, {result.feedback}
            </p>
          )}
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
                <input placeholder="예: 진기루" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <button className="primaryButton wideButton" disabled={loading}>
                <CheckCircle2 size={18} />
                시작하기
              </button>
            </form>
            <p className="helperText">
              처음이면 자동 등록되고, 다음부터 같은 학번과 이름으로 이어서 풀 수 있어요.
            </p>
            <div className="guestLoginDivider">
              <span>또는</span>
            </div>
            <button
              type="button"
              className="ghostButton wideButton guestContinueButton"
              onClick={() => void continueAsGuest()}
              disabled={loading}
            >
              로그인 없이 진행
            </button>
            <p className="helperText">
              이 브라우저에 익명 식별 정보와 제출 기록이 저장됩니다.
            </p>
          </div>
        </div>
      )}

      {personalHistoryOpen && student && (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setPersonalHistoryOpen(false)}>
          <section
            className="personalHistoryModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-history-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="iconButton closeButton" onClick={() => setPersonalHistoryOpen(false)} aria-label="닫기">
              <X size={18} />
            </button>
            <h2 id="personal-history-title">내 제출 및 채점 기록</h2>
            <p className="helperText">{student.student_no} {student.name}</p>
            {personalSubmissions.length === 0 ? (
              <p className="empty">아직 제출 기록이 없습니다.</p>
            ) : (
              <div className="personalHistoryList">
                {personalSubmissions.map((submission, index) => (
                  <article key={submission.id ?? `${submission.created_at}-${index}`}>
                    <div>
                      <strong>{problemTitle(submission.problem_id, availableProblems)}</strong>
                      <span>
                        {submission.created_at
                          ? new Date(submission.created_at).toLocaleString("ko-KR")
                          : ""}
                      </span>
                    </div>
                    <span className={`submissionResultBadge ${submission.status}`}>
                      {submissionResultLabel(submission.status)} {submission.passed_count}/{submission.total_count}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
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
          <span>로그인 없이 코딩 연습</span>
        </button>
        <button className="choiceButton solve" onClick={onSolve}>
          <GraduationCap size={34} />
          <strong>문제 풀기</strong>
          <span>학번과 이름으로 로그인하고 문제 풀기</span>
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
  onSubmit,
  colorMode,
  fontSize
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit?: () => void;
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
          {
            key: "Alt-Enter",
            run: () => {
              onSubmit?.();
              return Boolean(onSubmit);
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
    [colorMode, fontSize, onRun, onSubmit]
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
          <button
            type="button"
            className="problemNavigationButton"
            disabled={!previousProblem}
            onClick={onPrevious}
            aria-label="이전 문제"
            data-tooltip={previousProblem ? `이전 문제: ${previousProblem.title}` : "첫 문제입니다."}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            className="problemNavigationButton"
            disabled={!nextProblem}
            onClick={onNext}
            aria-label="다음 문제"
            data-tooltip={nextProblem ? `다음 문제: ${nextProblem.title}` : "마지막 문제입니다."}
          >
            <ChevronRight size={19} />
          </button>
          <button
            type="button"
            className={`problemNavigationButton autoAdvanceButton ${
              autoAdvanceOnAccepted ? "active" : ""
            }`}
            onClick={() => onAutoAdvanceChange(!autoAdvanceOnAccepted)}
            aria-label="정답 시 자동으로 다음 문제 이동"
            aria-pressed={autoAdvanceOnAccepted}
            data-tooltip={`정답 시 자동 다음: ${autoAdvanceOnAccepted ? "켜짐" : "꺼짐"}`}
          >
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
      <ProblemBlock title="문제" body={selectedProblem.statement} />
      <div className="descriptionGrid">
        <ProblemBlock title="입력" body={selectedProblem.inputDescription} />
        <ProblemBlock title="출력" body={selectedProblem.outputDescription} />
      </div>
      {selectedProblem.testCases.length > 1 &&
        selectedProblem.showExample !== false &&
        selectedProblem.examples.length > 0 && (
        <div className="exampleBox">
          <h2>예시</h2>
          <div className="exampleList">
            {selectedProblem.examples.map((example, index) => (
              <section className="exampleCase" key={index}>
                {selectedProblem.examples.length > 1 && <h3>예시 {index + 1}</h3>}
                <div className="ioGrid">
                  <div>
                    <strong>입력</strong>
                    <pre>{example.input || "입력 없음"}</pre>
                  </div>
                  <div>
                    <strong>출력</strong>
                    <pre>{example.output}</pre>
                  </div>
                </div>
              </section>
            ))}
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
  const outputAccepted = !hasRuntimeError && passedCount === cases.length;
  const requirementResult = checkCodeRequirements(code, problem.codeRequirements);
  if (outputAccepted && !requirementResult.passed) {
    return {
      status: "code_requirement_failed",
      passedCount,
      totalCount: cases.length,
      feedback: requirementResult.feedback,
      cases
    };
  }

  const status: JudgeResult["status"] = hasRuntimeError
    ? "runtime_error"
    : outputAccepted
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

function getSubmissionMergeKey(submission: SubmissionWithStudent) {
  return (
    submission.id ??
    `${submission.student_id}:${submission.problem_id}:${submission.created_at ?? ""}:${submission.status}`
  );
}

function mergeSubmissions(
  current: SubmissionWithStudent[],
  incoming: SubmissionWithStudent[]
) {
  const byKey = new Map<string, SubmissionWithStudent>();
  for (const submission of [...current, ...incoming]) {
    byKey.set(getSubmissionMergeKey(submission), submission);
  }
  return [...byKey.values()].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

function mergeStudentsFromSubmissions(
  current: Student[],
  submissions: SubmissionWithStudent[]
) {
  const byId = new Map(current.map((student) => [student.id, student]));
  for (const submission of submissions) {
    if (byId.has(submission.student_id) || !submission.students) continue;
    byId.set(submission.student_id, {
      id: submission.student_id,
      student_no: submission.students.student_no,
      name: submission.students.name,
      is_guest: submission.students.is_guest
    });
  }
  return [...byId.values()].sort(
    (left, right) =>
      left.student_no.localeCompare(right.student_no, "ko") ||
      left.name.localeCompare(right.name, "ko")
  );
}

function getLatestSubmissionCreatedAt(submissions: SubmissionWithStudent[]) {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const submission of submissions) {
    if (!submission.created_at) continue;
    const time = new Date(submission.created_at).getTime();
    if (!Number.isFinite(time) || time <= latestTime) continue;
    latest = submission.created_at;
    latestTime = time;
  }
  return latest;
}

function getTeacherDashboardCacheKey(scope: TeacherDashboardScope) {
  return JSON.stringify([scope.bookId, scope.classId]);
}

function setTeacherDashboardCacheEntry(
  cache: Map<string, TeacherDashboardCacheEntry>,
  key: string,
  entry: TeacherDashboardCacheEntry
) {
  cache.delete(key);
  cache.set(key, entry);

  while (cache.size > DASHBOARD_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

function compareSubmissionsChronologically(
  left: SubmissionWithStudent,
  right: SubmissionWithStudent
) {
  const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
  const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
  if (leftTime !== rightTime) return leftTime - rightTime;
  return (left.id ?? "").localeCompare(right.id ?? "");
}

function TeacherDashboard({
  dashboard,
  loading,
  submissions,
  students,
  books,
  problems,
  selectedBookId,
  classFilter,
  onScopeChange,
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
  selectedBookId: string;
  classFilter: string;
  onScopeChange: (bookId: string, classId: string) => void;
  onRefresh: () => void;
  onCurriculumChanged: () => Promise<void>;
  onLogout: () => void;
}) {
  const [studentFilter, setStudentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("studentNo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [subgroupFilter, setSubgroupFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [selectedSubmissionHistory, setSelectedSubmissionHistory] = useState<
    SubmissionWithStudent[]
  >([]);
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const submissionHistoryRequestRef = useRef(0);
  const [overviewStudentId, setOverviewStudentId] = useState("");
  const [previewProblemId, setPreviewProblemId] = useState("");
  const selectedBook = books.find((book) => book.id === selectedBookId) ?? books[0];
  const bookProblems = problems
    .filter((problem) => problem.bookId === selectedBook?.id)
    .sort((left, right) => left.order - right.order);
  const bookProblemGroups = groupProblems(bookProblems, selectedBook);
  const displayedProblems =
    subgroupFilter === "all"
      ? bookProblems
      : bookProblemGroups.find((group) => group.id === subgroupFilter)?.problems ?? bookProblems;
  const previewProblemIndex = displayedProblems.findIndex(
    (problem) => problem.id === previewProblemId
  );
  const previewProblem =
    previewProblemIndex >= 0 ? displayedProblems[previewProblemIndex] : undefined;
  const previousPreviewProblem =
    previewProblemIndex > 0 ? displayedProblems[previewProblemIndex - 1] : undefined;
  const nextPreviewProblem =
    previewProblemIndex >= 0 && previewProblemIndex < displayedProblems.length - 1
      ? displayedProblems[previewProblemIndex + 1]
      : undefined;
  const subgroupToneByProblemId = useMemo(() => {
    const tones = new Map<string, number>();
    bookProblemGroups.forEach((group, groupIndex) => {
      group.problems.forEach((problem) => tones.set(problem.id, groupIndex % 4));
    });
    return tones;
  }, [bookProblemGroups]);
  const dashboardSubmissionByStudentProblem = useMemo(() => {
    const representative = new Map<string, SubmissionWithStudent>();
    for (const submission of submissions) {
      const key = `${submission.student_id}:${submission.problem_id}`;
      const current = representative.get(key);
      if (!current || (current.status !== "accepted" && submission.status === "accepted")) {
        representative.set(key, submission);
      }
    }
    return representative;
  }, [submissions]);
  const acceptedAttemptByStudentProblem = useMemo(() => {
    const submissionsByStudentProblem = new Map<string, SubmissionWithStudent[]>();
    for (const submission of submissions) {
      const key = `${submission.student_id}:${submission.problem_id}`;
      const attempts = submissionsByStudentProblem.get(key) ?? [];
      attempts.push(submission);
      submissionsByStudentProblem.set(key, attempts);
    }

    const acceptedAttempts = new Map<string, number>();
    for (const [key, attempts] of submissionsByStudentProblem) {
      attempts.sort(compareSubmissionsChronologically);
      const acceptedIndex = attempts.findIndex((submission) => submission.status === "accepted");
      if (acceptedIndex >= 0) acceptedAttempts.set(key, acceptedIndex + 1);
    }
    return acceptedAttempts;
  }, [submissions]);
  const classes = useMemo(
    () =>
      [
        ...new Set(
          students
            .filter((item) => !item.is_guest)
            .map((item) => getStudentGradeClassId(item.student_no))
            .filter((classId): classId is string => Boolean(classId))
        )
      ].sort((a, b) => a.localeCompare(b, "ko", { numeric: true })),
    [students]
  );
  const classOptions = useMemo(() => {
    if (classFilter === "all" || classFilter === "guest" || classes.includes(classFilter)) {
      return classes;
    }
    return [...classes, classFilter].sort((a, b) =>
      a.localeCompare(b, "ko", { numeric: true })
    );
  }, [classes, classFilter]);
  const bookFilterValues = books.map((book) => book.id);
  const subgroupFilterValues = ["all", ...bookProblemGroups.map((group) => group.id)];
  const classFilterValues = ["all", ...classOptions, "guest"];
  const filteredStudents = students.filter(
    (item) => matchesClassFilter(item, classFilter)
  );
  const studentFilterValues = ["all", ...filteredStudents.map((item) => item.id)];
  const sortFilterValues = ["studentNo", "name", "submissions", "accepted", "speed"];
  const studentRows = useMemo(() => {
    const displayedProblemIds = new Set(displayedProblems.map((problem) => problem.id));
    const submissionsByStudent = new Map<string, SubmissionWithStudent[]>();
    for (const submission of submissions) {
      if (!displayedProblemIds.has(submission.problem_id)) continue;
      const current = submissionsByStudent.get(submission.student_id) ?? [];
      current.push(submission);
      submissionsByStudent.set(submission.student_id, current);
    }

    const rows = students.map((item) => {
      const statuses = displayedProblems.map((problem) =>
        dashboardSubmissionByStudentProblem.get(`${item.id}:${problem.id}`)
      );
      const acceptedAttempts = displayedProblems.map((problem) =>
        acceptedAttemptByStudentProblem.get(`${item.id}:${problem.id}`)
      );
      const studentSubmissions = submissionsByStudent.get(item.id) ?? [];
      const submitted = studentSubmissions.length;
      const accepted = statuses.filter((submission) => submission?.status === "accepted").length;
      const firstAcceptedAtByProblem = new Map<string, number>();
      for (const submission of studentSubmissions) {
        if (submission.status !== "accepted" || !submission.created_at) continue;
        const acceptedAt = new Date(submission.created_at).getTime();
        if (!Number.isFinite(acceptedAt)) continue;
        const current = firstAcceptedAtByProblem.get(submission.problem_id);
        if (current === undefined || acceptedAt < current) {
          firstAcceptedAtByProblem.set(submission.problem_id, acceptedAt);
        }
      }

      const firstProblemId = displayedProblems[0]?.id;
      const speedStart = firstProblemId
        ? firstAcceptedAtByProblem.get(firstProblemId)
        : undefined;
      const acceptedAfterStart =
        speedStart === undefined
          ? []
          : [...firstAcceptedAtByProblem.values()].filter((acceptedAt) => acceptedAt >= speedStart);
      const speedEnd =
        acceptedAfterStart.length > 0 ? Math.max(...acceptedAfterStart) : undefined;
      const speedMinutes =
        speedStart !== undefined && speedEnd !== undefined ? (speedEnd - speedStart) / 60000 : 0;
      const speed =
        acceptedAfterStart.length >= 2 && speedMinutes > 0
          ? (acceptedAfterStart.length - 1) / speedMinutes
          : null;

      return { student: item, statuses, acceptedAttempts, submitted, accepted, speed };
    });
    const filtered = rows.filter(({ student }) => {
      const matchesClass = matchesClassFilter(student, classFilter);
      return matchesClass;
    });
    return filtered.sort((left, right) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = left.student.name.localeCompare(right.student.name, "ko");
      } else if (sortBy === "submissions") {
        comparison = left.submitted - right.submitted;
      } else if (sortBy === "accepted") {
        comparison = left.accepted - right.accepted;
      } else if (sortBy === "speed") {
        if (left.speed === null && right.speed !== null) return 1;
        if (left.speed !== null && right.speed === null) return -1;
        comparison = (left.speed ?? 0) - (right.speed ?? 0);
      } else {
        comparison = left.student.student_no.localeCompare(right.student.student_no, "ko", {
          numeric: true
        });
      }

      if (comparison !== 0) return sortDirection === "asc" ? comparison : -comparison;
      return left.student.student_no.localeCompare(right.student.student_no, "ko", {
        numeric: true
      });
    });
  }, [
    students,
    displayedProblems,
    dashboardSubmissionByStudentProblem,
    acceptedAttemptByStudentProblem,
    submissions,
    classFilter,
    sortBy,
    sortDirection
  ]);
  const displayedStudentRows =
    studentFilter === "all"
      ? studentRows
      : studentRows.filter(({ student }) => student.id === studentFilter);
  const rankByStudent = useMemo(() => {
    return new Map(studentRows.map((row, index) => [row.student.id, index + 1]));
  }, [studentRows]);
  async function openSubmission(submission: SubmissionWithStudent) {
    const requestId = submissionHistoryRequestRef.current + 1;
    submissionHistoryRequestRef.current = requestId;
    setSelectedSubmission(submission);
    setSelectedSubmissionHistory([]);
    setSubmissionHistoryLoading(true);
    try {
      const query = new URLSearchParams({
        studentId: submission.student_id,
        problemId: submission.problem_id
      });
      const response = await fetch(`/api/teacher-dashboard?${query.toString()}`, {
        cache: "no-store"
      });
      const data = (await response.json()) as {
        ok?: boolean;
        submissions?: SubmissionWithStudent[];
      };
      if (!response.ok || !data.ok) return;
      if (submissionHistoryRequestRef.current !== requestId) return;

      const history = data.submissions ?? [];
      setSelectedSubmissionHistory(history);
      const selected =
        history.find((item) => item.id === submission.id) ?? history[0] ?? submission;
      setSelectedSubmission(selected);
    } finally {
      if (submissionHistoryRequestRef.current === requestId) {
        setSubmissionHistoryLoading(false);
      }
    }
  }

  function closeSubmission() {
    submissionHistoryRequestRef.current += 1;
    setSelectedSubmission(null);
    setSelectedSubmissionHistory([]);
    setSubmissionHistoryLoading(false);
  }
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
        dashboardSubmissionByStudentProblem.get(`${overviewStudent.id}:${problem.id}`)
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
          submission: dashboardSubmissionByStudentProblem.get(
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
    dashboardSubmissionByStudentProblem
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
      if (event.key !== "Escape") return;
      submissionHistoryRequestRef.current += 1;
      setSelectedSubmission(null);
      setSelectedSubmissionHistory([]);
      setSubmissionHistoryLoading(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSubmission]);

  useEffect(() => {
    setSubgroupFilter("all");
  }, [selectedBookId]);

  useEffect(() => {
    if (!previewProblem) return;
    const handlePreviewKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewProblemId("");
      } else if (event.key === "ArrowLeft" && previousPreviewProblem) {
        setPreviewProblemId(previousPreviewProblem.id);
      } else if (event.key === "ArrowRight" && nextPreviewProblem) {
        setPreviewProblemId(nextPreviewProblem.id);
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", handlePreviewKeyDown);
    return () => window.removeEventListener("keydown", handlePreviewKeyDown);
  }, [previewProblem, previousPreviewProblem, nextPreviewProblem]);

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

  function changeClassFilter(value: string) {
    setStudentFilter("all");
    onScopeChange(selectedBook?.id ?? "", value);
  }

  function changeDashboardBook(value: string) {
    setStudentFilter("all");
    onScopeChange(value, classFilter);
  }

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
              <div className="filterSelectControl">
                <select
                  value={selectedBook?.id ?? ""}
                  onChange={(event) => changeDashboardBook(event.target.value)}
                >
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {formatBookTitle(book)}
                    </option>
                  ))}
                </select>
                <FilterStepButtons
                  label="문제집"
                  values={bookFilterValues}
                  value={selectedBook?.id ?? ""}
                  onChange={changeDashboardBook}
                />
              </div>
            </label>
            <label>
              <span>소분류</span>
              <div className="filterSelectControl">
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
                <FilterStepButtons
                  label="소분류"
                  values={subgroupFilterValues}
                  value={subgroupFilter}
                  onChange={setSubgroupFilter}
                />
              </div>
            </label>
            <label>
              <span>학급</span>
              <div className="filterSelectControl">
                <select
                  value={classFilter}
                  onChange={(event) => changeClassFilter(event.target.value)}
                >
                  <option value="all">전체</option>
                  {classOptions.map((classNo) => (
                    <option key={classNo} value={classNo}>
                      {classNo}
                    </option>
                  ))}
                  <option value="guest">비로그인</option>
                </select>
                <FilterStepButtons
                  label="학급"
                  values={classFilterValues}
                  value={classFilter}
                  onChange={changeClassFilter}
                />
              </div>
            </label>
            <label>
              <span>학생</span>
              <div className="filterSelectControl">
                <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}>
                  <option value="all">전체</option>
                  {filteredStudents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.student_no} {item.name}
                    </option>
                  ))}
                </select>
                <FilterStepButtons
                  label="학생"
                  values={studentFilterValues}
                  value={studentFilter}
                  onChange={setStudentFilter}
                />
              </div>
            </label>
            <label>
              <span>정렬</span>
              <div className="filterSelectControl">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="studentNo">학번</option>
                  <option value="name">이름</option>
                  <option value="submissions">제출수</option>
                  <option value="accepted">정답수</option>
                  <option value="speed">풀이속도</option>
                </select>
                <FilterStepButtons
                  label="정렬"
                  values={sortFilterValues}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </label>
            <label>
              <span>방향</span>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
              >
                <option value="asc">오름차순</option>
                <option value="desc">내림차순</option>
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
                  <th>학번</th>
                  <th>이름</th>
                  <th>정답수</th>
                  <th>제출수</th>
                  <th>풀이속도</th>
                  {displayedProblems.map((problem) => (
                    <th
                      className={`subgroupTone${subgroupToneByProblemId.get(problem.id) ?? 0}`}
                      key={problem.id}
                    >
                      <button
                        className="problemNumberButton"
                        type="button"
                        title={`${problem.title} 문제 보기`}
                        aria-label={`${Number(formatProblemNumber(problem))}번 ${problem.title} 문제 보기`}
                        onClick={() => setPreviewProblemId(problem.id)}
                      >
                        {Number(formatProblemNumber(problem))}
                      </button>
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
                        {row.student.student_no}
                      </button>
                    </th>
                    <th>
                      <button
                        className="studentOverviewLink"
                        type="button"
                        onClick={() => setOverviewStudentId(row.student.id)}
                      >
                        {row.student.name}
                      </button>
                    </th>
                    <td className="scoreCell">{row.accepted}</td>
                    <td>{row.submitted}</td>
                    <td>{row.speed === null ? "-" : `${row.speed.toFixed(2)}/분`}</td>
                    {row.statuses.map((submission, index) => {
                      const problem = displayedProblems[index];
                      const acceptedAttempt = row.acceptedAttempts[index];
                      const resultLabel = submission
                        ? submission.status === "accepted" && acceptedAttempt
                          ? `${acceptedAttempt}번의 시도 끝에 정답`
                          : submissionResultLabel(submission.status)
                        : "미제출";
                      return (
                        <td
                          className={`subgroupTone${
                            subgroupToneByProblemId.get(problem.id) ?? 0
                          }`}
                          key={problem.id}
                        >
                          {submission ? (
                            <button
                              className={`submissionStatus ${submissionResultClass(submission.status)}`}
                              onClick={() => void openSubmission(submission)}
                              title={resultLabel}
                              aria-label={`${problem.title} ${resultLabel}`}
                            >
                              {submission.status === "accepted" ? (
                                acceptedAttempt && acceptedAttempt > 1 ? (
                                  <span className="acceptedAttemptBadge" aria-hidden="true">
                                    {acceptedAttempt}
                                  </span>
                                ) : (
                                  "O"
                                )
                              ) : (
                                "X"
                              )}
                            </button>
                          ) : (
                            <span className="notSubmitted" aria-label="미제출" />
                          )}
                        </td>
                      );
                    })}
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
                                : submissionResultClass(submission.status);
                              const label = !submission
                                ? "미제출"
                                : submissionResultLabel(submission.status);
                              return (
                                <button
                                  className={`studentProblemDot ${resultClass}`}
                                  type="button"
                                  key={problem.id}
                                  disabled={!submission}
                                  title={`${problem.title}: ${label}`}
                                  aria-label={`${problem.title} ${label}`}
                                  onClick={() => submission && void openSubmission(submission)}
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
        <div className="modalBackdrop" role="presentation" onMouseDown={closeSubmission}>
          <div
            className="submissionCodeModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-code-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="iconButton closeButton" onClick={closeSubmission} aria-label="닫기">
              <X size={18} />
            </button>
            <span className={`submissionResultBadge ${selectedSubmission.status}`}>
              {submissionResultLabel(selectedSubmission.status)}
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
                {submissionHistoryLoading && <small>제출 이력을 불러오는 중...</small>}
                {selectedSubmissionHistory.map((submission, index) => (
                  <button
                    type="button"
                    className={submission.id === selectedSubmission.id ? "active" : ""}
                    key={submission.id ?? `${submission.created_at}-${index}`}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <span className={`submissionResultBadge ${submission.status}`}>
                      {submissionResultLabel(submission.status)}
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
              <pre className="submittedCode">
                {submissionHistoryLoading
                  ? "제출 코드를 불러오는 중..."
                  : selectedSubmission.code ?? "제출 코드를 불러오지 못했습니다."}
              </pre>
            </div>
          </div>
        </div>
      )}
      {previewProblem && (
        <TeacherProblemPreviewModal
          problem={previewProblem}
          previousProblem={previousPreviewProblem}
          nextProblem={nextPreviewProblem}
          onPrevious={() => previousPreviewProblem && setPreviewProblemId(previousPreviewProblem.id)}
          onNext={() => nextPreviewProblem && setPreviewProblemId(nextPreviewProblem.id)}
          onClose={() => setPreviewProblemId("")}
        />
      )}
    </section>
  );
}

function TeacherProblemPreviewModal({
  problem,
  previousProblem,
  nextProblem,
  onPrevious,
  onNext,
  onClose
}: {
  problem: Problem;
  previousProblem?: Problem;
  nextProblem?: Problem;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const problemNumber = Number(formatProblemNumber(problem));

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <article
        className="problemPreviewModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-problem-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="iconButton closeButton" type="button" onClick={onClose} aria-label="닫기">
          <X size={18} />
        </button>
        <header className="problemPreviewHeader">
          <div>
            <span className="problemPreviewNumber">문항 {problemNumber}</span>
            <h2 id="teacher-problem-preview-title">{problem.title}</h2>
          </div>
          <nav className="problemNavigation" aria-label="문항 이동">
            <button
              type="button"
              className="problemNavigationButton"
              disabled={!previousProblem}
              onClick={onPrevious}
              aria-label="이전 문제"
              title={previousProblem ? `이전 문제: ${previousProblem.title}` : "첫 문제입니다."}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              className="problemNavigationButton"
              disabled={!nextProblem}
              onClick={onNext}
              aria-label="다음 문제"
              title={nextProblem ? `다음 문제: ${nextProblem.title}` : "마지막 문제입니다."}
            >
              <ChevronRight size={19} />
            </button>
          </nav>
        </header>
        <ProblemBlock title="문제" body={problem.statement} />
        <div className="descriptionGrid">
          <ProblemBlock title="입력" body={problem.inputDescription} />
          <ProblemBlock title="출력" body={problem.outputDescription} />
        </div>
        {problem.testCases.length > 1 &&
          problem.showExample !== false &&
          problem.examples.length > 0 && (
            <div className="exampleBox">
              <h2>예시</h2>
              <div className="exampleList">
                {problem.examples.map((example, index) => (
                  <section className="exampleCase" key={index}>
                    {problem.examples.length > 1 && <h3>예시 {index + 1}</h3>}
                    <div className="ioGrid">
                      <div>
                        <strong>입력</strong>
                        <pre>{example.input || "입력 없음"}</pre>
                      </div>
                      <div>
                        <strong>출력</strong>
                        <pre>{example.output}</pre>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        {problem.hint.trim() && (
          <div className="hint">
            <Lightbulb size={18} />
            {problem.hint}
          </div>
        )}
      </article>
    </div>
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

function FilterStepButtons({
  label,
  values,
  value,
  onChange
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const currentIndex = values.indexOf(value);

  return (
    <span className="filterStepButtons">
      <button
        type="button"
        onClick={() => onChange(values[currentIndex - 1])}
        disabled={currentIndex <= 0}
        aria-label={`${label} 이전 항목`}
        title={`${label} 이전 항목`}
      >
        <ChevronUp size={13} />
      </button>
      <button
        type="button"
        onClick={() => onChange(values[currentIndex + 1])}
        disabled={currentIndex < 0 || currentIndex >= values.length - 1}
        aria-label={`${label} 다음 항목`}
        title={`${label} 다음 항목`}
      >
        <ChevronDown size={13} />
      </button>
    </span>
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
    codeRequirements: [],
    examples: [],
    testCases: [{ input: "", output: "", isSample: false }],
    isPublished: true,
    visibilityScope: "all",
    visibleClassIds: []
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
  const [bulkVisibilityScope, setBulkVisibilityScope] = useState<NonNullable<Problem["visibilityScope"]>>("all");
  const [bulkVisibleClassIds, setBulkVisibleClassIds] = useState<string[]>([CLASS_VISIBILITY_OPTIONS[0]]);
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
      testCases:
        problem.testCases.length > 0
          ? problem.testCases
          : [{ input: "", output: "", isSample: false }]
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
        body: JSON.stringify(editingProblem)
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
      items.map((item) =>
        item.id === problem.id
          ? {
              ...item,
              isPublished,
              visibilityScope: isPublished ? item.visibilityScope ?? "all" : item.visibilityScope,
              visibleClassIds: item.visibleClassIds ?? []
            }
          : item
      )
    );
    try {
      const response = await fetch("/api/teacher-problems", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: problem.id,
          isPublished,
          visibilityScope: problem.visibilityScope ?? "all",
          visibleClassIds: problem.visibleClassIds ?? []
        })
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
    if (isPublished && bulkVisibilityScope === "classes" && bulkVisibleClassIds.length === 0) {
      setManagerError("전체 공개할 학급을 1개 이상 선택해주세요.");
      return;
    }
    setBulkVisibilitySaving(true);
    setManagerError("");
    const visibleClassIds = bulkVisibilityScope === "classes" ? bulkVisibleClassIds : [];
    try {
      const response = await fetch("/api/teacher-problems", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedManagedBook.id,
          isPublished,
          visibilityScope: bulkVisibilityScope,
          visibleClassIds
        })
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

  function updateBulkVisibilityScope(scope: NonNullable<Problem["visibilityScope"]>) {
    setBulkVisibilityScope(scope);
    if (scope === "classes" && bulkVisibleClassIds.length === 0) {
      setBulkVisibleClassIds([CLASS_VISIBILITY_OPTIONS[0]]);
    }
  }

  function toggleBulkVisibleClass(classId: string) {
    setBulkVisibleClassIds((current) => {
      const selected = new Set(current);
      if (selected.has(classId)) selected.delete(classId);
      else selected.add(classId);
      return CLASS_VISIBILITY_OPTIONS.filter((option) => selected.has(option));
    });
  }

  function updateVisibilityScope(scope: NonNullable<Problem["visibilityScope"]>) {
    setEditingProblem((problem) =>
      problem
        ? {
            ...problem,
            isPublished: true,
            visibilityScope: scope,
            visibleClassIds:
              scope === "classes"
                ? problem.visibleClassIds && problem.visibleClassIds.length > 0
                  ? problem.visibleClassIds
                  : [CLASS_VISIBILITY_OPTIONS[0]]
                : []
          }
        : problem
    );
  }

  function toggleVisibleClass(classId: string) {
    setEditingProblem((problem) => {
      if (!problem) return problem;
      const current = new Set(problem.visibleClassIds ?? []);
      if (current.has(classId)) current.delete(classId);
      else current.add(classId);
      const visibleClassIds = CLASS_VISIBILITY_OPTIONS.filter((option) => current.has(option));
      return {
        ...problem,
        visibleClassIds,
        visibilityScope: "classes",
        isPublished: true
      };
    });
  }

  function updateTestCase<K extends keyof TestCase>(
    index: number,
    key: K,
    value: TestCase[K]
  ) {
    setEditingProblem((problem) => {
      if (!problem) return problem;
      const testCases = problem.testCases.map((testCase, caseIndex) =>
        caseIndex === index ? { ...testCase, [key]: value } : testCase
      );
      return {
        ...problem,
        testCases,
        examples: testCases.filter((testCase) => testCase.isSample),
        showExample: testCases.length > 1 && testCases.some((testCase) => testCase.isSample)
      };
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
            <fieldset className="bulkVisibilityFieldset">
              <legend>일괄 공개 범위</legend>
              <div className="bulkVisibilityModes">
                <label>
                  <input
                    type="radio"
                    name="bulkVisibilityScope"
                    checked={bulkVisibilityScope === "all"}
                    onChange={() => updateBulkVisibilityScope("all")}
                  />
                  전체 학급
                </label>
                <label>
                  <input
                    type="radio"
                    name="bulkVisibilityScope"
                    checked={bulkVisibilityScope === "classes"}
                    onChange={() => updateBulkVisibilityScope("classes")}
                  />
                  특정 학급
                </label>
              </div>
              {bulkVisibilityScope === "classes" && (
                <div className="bulkClassOptions">
                  {CLASS_VISIBILITY_OPTIONS.map((classId) => (
                    <label key={classId}>
                      <input
                        type="checkbox"
                        checked={bulkVisibleClassIds.includes(classId)}
                        onChange={() => toggleBulkVisibleClass(classId)}
                      />
                      {formatClassLabel(classId)}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <div className="bookVisibilityActions">
              <button
                className="managerActionButton visibilityButton published"
                type="button"
                disabled={
                  bulkVisibilitySaving ||
                  selectedManagedProblems.length === 0 ||
                  (bulkVisibilityScope === "classes" && bulkVisibleClassIds.length === 0)
                }
                onClick={() => void setBookVisibility(true)}
                title={
                  bulkVisibilityScope === "classes"
                    ? `${bulkVisibleClassIds.map(formatClassLabel).join(", ")}에 전체 공개`
                    : "전체 학급에 전체 공개"
                }
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
              {formatVisibilityLabel(problem)}
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
              <fieldset className="visibilityFieldset">
                <legend>공개 범위</legend>
                <div className="visibilityModeOptions">
                  <label className="publishToggle">
                    <input
                      type="radio"
                      name="visibility"
                      checked={editingProblem.isPublished === false}
                      onChange={() => updateProblem("isPublished", false)}
                    />
                    비공개
                  </label>
                  <label className="publishToggle">
                    <input
                      type="radio"
                      name="visibility"
                      checked={editingProblem.isPublished !== false && (editingProblem.visibilityScope ?? "all") === "all"}
                      onChange={() => updateVisibilityScope("all")}
                    />
                    전체 학급 공개
                  </label>
                  <label className="publishToggle">
                    <input
                      type="radio"
                      name="visibility"
                      checked={editingProblem.isPublished !== false && editingProblem.visibilityScope === "classes"}
                      onChange={() => updateVisibilityScope("classes")}
                    />
                    특정 학급 공개
                  </label>
                </div>
                {editingProblem.isPublished !== false && editingProblem.visibilityScope === "classes" && (
                  <div className="classVisibilityOptions">
                    {CLASS_VISIBILITY_OPTIONS.map((classId) => (
                      <label key={classId} className="classVisibilityOption">
                        <input
                          type="checkbox"
                          checked={(editingProblem.visibleClassIds ?? []).includes(classId)}
                          onChange={() => toggleVisibleClass(classId)}
                        />
                        {formatClassLabel(classId)}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <div className="testCaseEditor">
                <div className="problemManagerHeader">
                  <h3>테스트케이스</h3>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() =>
                      updateProblem("testCases", [
                        ...editingProblem.testCases,
                        { input: "", output: "", isSample: false }
                      ])
                    }
                  >
                    <Plus size={16} />
                    케이스 추가
                  </button>
                </div>
                {editingProblem.testCases.map((testCase, index) => (
                  <div className="testCaseRow" key={index}>
                    <label className="sampleToggle">
                      <input
                        type="checkbox"
                        checked={testCase.isSample === true}
                        onChange={(event) =>
                          updateTestCase(index, "isSample", event.target.checked)
                        }
                      />
                      예시 표시
                    </label>
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

function submissionResultClass(status: SubmissionStatus) {
  if (status === "accepted") return "accepted correct";
  if (status === "code_requirement_failed") return "codeRequirementFailed";
  return "failed incorrect";
}

function formatProblemForGemini(
  problem: Problem,
  code: string,
  failureCount: number,
  latestResult?: JudgeResult
) {
  const examples =
    problem.examples.length > 0
      ? problem.examples
          .map(
            (example, index) =>
              `[예시 ${index + 1}]\n입력:\n${example.input || "(입력 없음)"}\n출력:\n${example.output}`
          )
          .join("\n\n")
      : "(예시 없음)";
  const judgeSummary = latestResult
    ? `${submissionResultLabel(latestResult.status)} (${latestResult.passedCount}/${latestResult.totalCount} 통과)\n${latestResult.feedback}`
    : "(채점 결과 없음)";

  return [
    "아래 파이썬 문제를 풀고 있습니다. 정답 코드를 바로 제시하기보다, 제 코드의 문제점을 설명하고 스스로 고칠 수 있도록 단계별 힌트를 주세요.",
    "",
    `[문제 제목]\n${problem.title}`,
    `[문제]\n${problem.statement}`,
    `[입력]\n${problem.inputDescription || "(입력 없음)"}`,
    `[출력]\n${problem.outputDescription || "(출력 설명 없음)"}`,
    `[입출력 예시]\n${examples}`,
    problem.hint.trim() ? `[문제 힌트]\n${problem.hint}` : "",
    `[현재 코드]\n\`\`\`python\n${code}\n\`\`\``,
    `[최근 채점 결과]\n${judgeSummary}`,
    `[현재까지 실패 횟수]\n${failureCount}회`
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function submissionResultLabel(status: SubmissionStatus) {
  if (status === "accepted") return "정답";
  if (status === "code_requirement_failed") return "코드 조건 불충족";
  return "오답";
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

function formatVisibilityLabel(problem: Problem) {
  if (problem.isPublished === false) return "비공개";
  if (problem.visibilityScope === "classes") {
    const classes = (problem.visibleClassIds ?? [])
      .filter((classId) => CLASS_VISIBILITY_OPTIONS.includes(classId))
      .map(formatClassLabel);
    return classes.length > 0 ? `${classes.join(", ")} 공개` : "학급 미지정";
  }
  return "전체 공개";
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

function getStoredFontSize(key: string) {
  const value = Number(getStoredValue(key));
  return Number.isInteger(value) && value >= 12 && value <= 60 ? value : null;
}

function normalizeTeacherDashboardClassId(value: string | null) {
  const normalized = value?.trim();
  if (
    normalized === "all" ||
    normalized === "guest" ||
    isStudentGradeClassId(normalized ?? "")
  ) {
    return normalized!;
  }
  return DEFAULT_TEACHER_DASHBOARD_CLASS_ID;
}

function setStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The editor remains usable when browser storage is unavailable.
  }
}

function getOrCreateGuestToken() {
  const stored = getStoredValue(GUEST_TOKEN_STORAGE_KEY);
  if (stored) return stored;
  const token = crypto.randomUUID();
  setStoredValue(GUEST_TOKEN_STORAGE_KEY, token);
  return token;
}

function removeStoredValue(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Logout still works in memory when browser storage is unavailable.
  }
}

function getStoredStudent(): Student | null {
  const value = getStoredValue(STUDENT_STORAGE_KEY);
  if (!value) return null;

  try {
    const student = JSON.parse(value) as Partial<Student>;
    if (
      typeof student.id !== "string" ||
      typeof student.student_no !== "string" ||
      typeof student.name !== "string"
    ) {
      return null;
    }
    return student as Student;
  } catch {
    return null;
  }
}

function matchesClassFilter(student: Student, classFilter: string) {
  if (classFilter === "all") return true;
  if (classFilter === "guest") return Boolean(student.is_guest);
  return !student.is_guest && getStudentGradeClassId(student.student_no) === classFilter;
}
