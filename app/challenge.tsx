"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Clock3, Copy, Download, Expand, Minimize2, Play, Send, Square, Trophy, X } from "lucide-react";
import type { Problem, ProblemBook, Student } from "@/lib/types";
import { challengePhase, elapsedLabel, firstSolvers, type Challenge, type ChallengeBoard, type ChallengeParticipant, type ChallengeSubmission } from "@/lib/challenge-types";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";
import ChallengeArcade from "./challenge-arcade";

type EditorProps = { value: string; onChange: (value: string) => void; onRun: () => void; onSubmit?: () => void; colorMode: "light" | "dark"; fontSize: number };
type PaneProps = { selectedProblem: Problem; previousProblem?: Problem; nextProblem?: Problem; autoAdvanceOnAccepted: boolean; onPrevious: () => void; onNext: () => void; onAutoAdvanceChange: (enabled: boolean) => void };
type Session = { challenge: Challenge; participant: ChallengeParticipant; submissions: ChallengeSubmission[]; serverNow: string; leaderboard: Pick<ChallengeBoard, "participants" | "submissions"> | null };
type Mode = "entry" | "student" | "teacher";
type ExportOptions = { includeFirstSolver: boolean; includeSubmissionTimes: boolean; includeAttemptCounts: boolean };

async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || "요청을 처리하지 못했습니다.");
  return data;
}
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
function message(error: unknown) { return error instanceof Error ? error.message : "연결 상태를 확인하고 다시 시도해주세요."; }
const statusLabel = (status?: string) => ({ accepted: "정답", wrong_answer: "오답", runtime_error: "실행 오류", code_requirement_failed: "조건 미충족", pending: "채점 중" }[status ?? ""] ?? "미제출");

function remainingLabel(challenge: Challenge, now: number) {
  const phase = challengePhase(challenge, now);
  if (phase === "waiting") return "시작 대기";
  if (phase === "ended") return "제출 종료";
  const remaining = Math.max(0, Date.parse(challenge.ends_at ?? "") - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor(remaining / 60_000) % 60;
  const seconds = Math.floor(remaining / 1_000) % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function ChallengeTimer({ challenge, now, large = false, onEndedTripleClick }: { challenge: Challenge; now: number; large?: boolean; onEndedTripleClick?: () => void }) {
  const phase = challengePhase(challenge, now);
  return <div className={`challengeTimer ${phase === "ended" ? "ended" : ""} ${large ? "large" : ""} ${phase === "ended" && onEndedTripleClick ? "secretEnabled" : ""}`} role="timer" aria-label={`남은 시간 ${remainingLabel(challenge, now)}`}><Clock3 aria-hidden="true" /><span onClick={event => { if (phase === "ended" && event.detail === 3) onEndedTripleClick?.(); }}>{remainingLabel(challenge, now)}</span></div>;
}

export default function ChallengeExperience({ mode, student, colorMode, onMode, onClose, CodeEditor, ProblemPane }: { mode: Mode; student: Student | null; colorMode: "light" | "dark"; onMode: (mode: Mode) => void; onClose: () => void; CodeEditor: ComponentType<EditorProps>; ProblemPane: ComponentType<PaneProps> }) {
  const [teacherEntry, setTeacherEntry] = useState(false);
  const [entryCode, setEntryCode] = useState("");
  const [studentNo, setStudentNo] = useState(student?.is_guest ? "" : student?.student_no ?? "");
  const [name, setName] = useState(student?.is_guest ? "" : student?.name ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function enter(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (teacherEntry) { await api("/api/teacher-login", { password }); setPassword(""); onMode("teacher"); }
      else {
        const result = await api<{ challengeId: string }>("/api/challenges/session", { entryCode, studentNo, name });
        write("pyoj:challenge-id", result.challengeId);
        const url = new URL(window.location.href); url.searchParams.set("challenge", result.challengeId); window.history.replaceState(null, "", url); onMode("student");
      }
    } catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  if (mode === "teacher") return <ChallengeManager onReauthenticate={() => { setTeacherEntry(true); onMode("entry"); }} />;
  if (mode === "student") return <ChallengeStudent CodeEditor={CodeEditor} ProblemPane={ProblemPane} colorMode={colorMode} onReenter={() => onMode("entry")} />;
  return <ChallengeModal title="챌린지" onClose={onClose}>
    <p className="helperText">수행평가 및 프로그래밍 대회</p>
    <div className="challengeTabs"><button type="button" className={!teacherEntry ? "active" : ""} onClick={() => { setTeacherEntry(false); setError(""); }}>학생 입장</button><button type="button" className={teacherEntry ? "active" : ""} onClick={() => { setTeacherEntry(true); setError(""); }}>교사 관리</button></div>
    <form onSubmit={enter}>{teacherEntry ? <label>교사 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label> : <>
      <label>입장코드<input value={entryCode} onChange={event => setEntryCode(event.target.value.toUpperCase().replace(/\s/g, ""))} maxLength={8} placeholder="8자리 입장코드" autoComplete="off" required /><small className="challengeInputHelp">영문은 모두 대문자로 입력합니다.</small></label>
      <label>학번<input value={studentNo} onChange={event => setStudentNo(event.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="예: 1203" required /></label>
      <label>이름<input value={name} onChange={event => setName(event.target.value)} maxLength={30} autoComplete="name" required /></label>
    </>}{error && <p role="alert" className="modalError">{error}</p>}<button className="primaryButton wideButton" disabled={busy}>{busy ? "확인 중…" : teacherEntry ? "관리 모드 입장" : "챌린지 입장"}</button></form>
  </ChallengeModal>;
}

function ChallengeModal({ title, children, onClose, wide = false, className = "" }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; ref.current?.querySelector<HTMLElement>("input,button")?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const nodes = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]'); if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", listener); return () => { document.removeEventListener("keydown", listener); previous?.focus(); };
  }, []);
  return <div className="modalBackdrop"><div className={`loginModal challengeModal ${wide ? "wide" : ""} ${className}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}><button className="iconButton closeButton" onClick={onClose} aria-label="닫기"><X size={18} /></button><h2>{title}</h2>{children}</div></div>;
}

function ChallengeStudent({ CodeEditor, ProblemPane, colorMode, onReenter }: { CodeEditor: ComponentType<EditorProps>; ProblemPane: ComponentType<PaneProps>; colorMode: "light" | "dark"; onReenter: () => void }) {
  const [session, setSession] = useState<Session | null>(null); const [error, setError] = useState(""); const [selected, setSelected] = useState(0); const [now, setNow] = useState(Date.now());
  const clock = useRef({ server: Date.now(), local: 0 }); const [lastSync, setLastSync] = useState(0); const [autoNext, setAutoNext] = useState(false); const [historyOpen, setHistoryOpen] = useState(false); const [arcadeOpen, setArcadeOpen] = useState(false);
  const refresh = useCallback(async () => {
    const id = new URL(window.location.href).searchParams.get("challenge") || read("pyoj:challenge-id"); if (!id) { setError("입장코드를 입력해주세요."); return; }
    try { const data = await api<Session>(`/api/challenges/session?id=${encodeURIComponent(id)}`); setSession(data); clock.current = { server: Date.parse(data.serverNow), local: performance.now() }; setNow(Date.parse(data.serverNow)); setLastSync(performance.now()); setError(""); }
    catch (caught) { setError(message(caught)); }
  }, []);
  useEffect(() => {
    let alive = true; let timer: ReturnType<typeof setTimeout>; const poll = async () => { await refresh(); if (alive) timer = setTimeout(poll, 3000); }; void poll();
    const tick = setInterval(() => setNow(clock.current.server + performance.now() - clock.current.local), 250); return () => { alive = false; clearTimeout(timer); clearInterval(tick); };
  }, [refresh]);
  if (!session) return <section className="challengeWaiting"><Trophy size={42} /><h1>챌린지 입장 확인</h1><p role="status">{error || "참여 정보를 불러오는 중입니다…"}</p>{error && <button className="primaryButton" onClick={onReenter}>입장코드 입력</button>}</section>;
  const { challenge, participant, submissions } = session; const phase = challengePhase(challenge, now); const problems = challenge.problem_snapshots; const problem = problems[selected] ?? problems[0]; const connected = performance.now() - lastSync < 12000 && !error;
  return <section className="challengeView">
    <header className="challengeBar"><div><span className="pill">챌린지 · {participant.student_no} {participant.name}</span><h1>{challenge.title}</h1></div><ChallengeTimer challenge={challenge} now={now} onEndedTripleClick={() => setArcadeOpen(true)} /><button className="ghostButton" onClick={() => setHistoryOpen(true)}>내 제출 기록</button></header>
    {error && <p className="modalError" role="alert">{error} 제출은 연결이 복구되면 가능합니다.</p>}
    {phase === "waiting" ? <div className="challengeWaiting"><Trophy size={48} /><h2>입장했습니다. 선생님의 시작을 기다려주세요.</h2><p>제한시간 {challenge.duration_minutes}분 · 시작하면 문제가 자동으로 공개됩니다.</p></div> : <>{phase === "ended" && <div className="notice">제한시간이 끝났습니다. 제출은 마감되었으며, 추가 시간이 부여되면 자동으로 다시 열립니다.</div>}<div className="challengeSolveGrid">
      <aside className="problemList"><div className="sectionTitle">문항</div>{problems.map((item, index) => { const records = submissions.filter(row => row.problem_id === item.id); const status = records.some(row => row.status === "accepted") ? "accepted" : records.at(-1)?.status; return <button className={`problemItem ${item.id === problem?.id ? "active" : ""} ${status === "accepted" ? "solved" : ""}`} key={item.id} onClick={() => setSelected(index)}><span>{index + 1}</span><strong>{statusLabel(status)}</strong></button>; })}</aside>
      {problem && <div className="workspace"><ProblemPane selectedProblem={problem} previousProblem={problems[selected - 1]} nextProblem={problems[selected + 1]} autoAdvanceOnAccepted={autoNext} onPrevious={() => setSelected(index => Math.max(0, index - 1))} onNext={() => setSelected(index => Math.min(problems.length - 1, index + 1))} onAutoAdvanceChange={setAutoNext} /><ChallengeIDE key={`${participant.id}:${problem.id}`} problem={problem} participant={participant} canSubmit={phase === "running" && connected} colorMode={colorMode} CodeEditor={CodeEditor} onSubmitted={async accepted => { await refresh(); if (accepted && autoNext) setSelected(index => Math.min(problems.length - 1, index + 1)); }} /></div>}
    </div></>}
    {session.leaderboard && <ChallengeResults challenge={challenge} participants={session.leaderboard.participants} submissions={session.leaderboard.submissions} />}
    {historyOpen && <ChallengeModal title="내 제출 기록" wide onClose={() => setHistoryOpen(false)}><div className="challengeHistory">{[...submissions].reverse().map(row => <div key={row.id}><strong>{problems.find(item => item.id === row.problem_id)?.title ?? "문항"} · {statusLabel(row.status)}</strong><p>시작 후 {elapsedLabel(challenge.started_at, row.received_at)} · {row.feedback}</p></div>)}{!submissions.length && <p>아직 제출한 기록이 없습니다.</p>}</div></ChallengeModal>}
    {arcadeOpen && <ChallengeModal title="비밀 파이썬 놀이터" wide className="arcadeModal" onClose={() => setArcadeOpen(false)}><ChallengeArcade /></ChallengeModal>}
  </section>;
}

function FontSizeControl({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  const update = (amount: number) => onChange(Math.max(12, Math.min(48, value + amount)));
  return <div className="fontSizeControl" aria-label={label}><button type="button" className="fontSizeStepButton" disabled={value <= 12} onClick={() => update(-10)}>-10</button><button type="button" className="fontSizeFineButton" disabled={value <= 12} onClick={() => update(-1)}>-1</button><span>{value}px</span><button type="button" className="fontSizeFineButton" disabled={value >= 48} onClick={() => update(1)}>+1</button><button type="button" className="fontSizeStepButton" disabled={value >= 48} onClick={() => update(10)}>+10</button></div>;
}

function ChallengeIDE({ problem, participant, canSubmit, colorMode, CodeEditor, onSubmitted }: { problem: Problem; participant: ChallengeParticipant; canSubmit: boolean; colorMode: "light" | "dark"; CodeEditor: ComponentType<EditorProps>; onSubmitted: (accepted: boolean) => Promise<void> }) {
  const storageKey = `pyoj:challenge-code:${participant.challenge_id}:${participant.id}:${problem.id}`;
  const [code, setCode] = useState(() => read(storageKey) ?? problem.starterCode); const [editorFont, setEditorFont] = useState(25); const [consoleFont, setConsoleFont] = useState(25); const [editorHeight, setEditorHeight] = useState(208);
  const [output, setOutput] = useState("실행 버튼 또는 Shift + Enter로 실행하세요."); const [prompt, setPrompt] = useState<string | null>(null); const [input, setInput] = useState(""); const [running, setRunning] = useState(false); const [submitting, setSubmitting] = useState(false); const [notice, setNotice] = useState("");
  const resolver = useRef<((input: string) => void) | null>(null); const controller = useRef<AbortController | null>(null); const submittingRef = useRef(false); const mounted = useRef(true); const inputRef = useRef<HTMLInputElement>(null); const bodyRef = useRef<HTMLDivElement>(null); const resizing = useRef<{ startY: number; startHeight: number } | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); resolver.current?.(""); }; }, []); useEffect(() => { if (prompt !== null) inputRef.current?.focus(); }, [prompt]);
  function change(value: string) { setCode(value); if (!write(storageKey, value)) setNotice("이 브라우저에서 코드 자동 저장을 사용할 수 없습니다. 코드를 별도로 보관해주세요."); }
  async function run() {
    if (controller.current || submittingRef.current) return; const abort = new AbortController(); controller.current = abort; setRunning(true); setOutput(""); setPrompt(null);
    try { await runPythonWithSkulpt(code, { output: text => setOutput(old => (old + text).slice(-65536)), error: text => setOutput(old => old + "\n" + text), input: text => new Promise(resolve => { resolver.current = resolve; setPrompt(text); }) }, { signal: abort.signal }); }
    finally { controller.current = null; resolver.current = null; if (mounted.current) { setRunning(false); setPrompt(null); } }
  }
  async function submit() {
    if (!canSubmit || submittingRef.current || controller.current) return; submittingRef.current = true; setSubmitting(true); setNotice("");
    try { const result = await api<{ submission: ChallengeSubmission }>("/api/challenges/submit", { challengeId: participant.challenge_id, problemId: problem.id, code, requestId: crypto.randomUUID() }); if (mounted.current) setNotice(`${statusLabel(result.submission.status)} · ${result.submission.feedback ?? ""}`); if (mounted.current) await onSubmitted(result.submission.status === "accepted"); }
    catch (caught) { if (mounted.current) setNotice(message(caught)); } finally { submittingRef.current = false; if (mounted.current) setSubmitting(false); }
  }
  function beginResize(event: React.PointerEvent<HTMLButtonElement>) { event.currentTarget.setPointerCapture(event.pointerId); resizing.current = { startY: event.clientY, startHeight: editorHeight }; }
  function resize(event: React.PointerEvent<HTMLButtonElement>) { if (!resizing.current || !bodyRef.current) return; const total = bodyRef.current.clientHeight; setEditorHeight(Math.max(150, Math.min(total - 120, resizing.current.startHeight + event.clientY - resizing.current.startY))); }
  return <article className="idePane challengeIde"><div className="ideHeader"><div><strong>문제 풀이 IDE</strong><span>Shift + Enter 실행 · Alt + Enter 제출</span></div><div className="ideActions"><button className="ghostButton" onClick={() => change(problem.starterCode)}>초기 코드</button><button className="runButton" disabled={submitting} onClick={() => running ? controller.current?.abort() : void run()}>{running ? <Square size={16} /> : <Play size={16} />}{running ? "실행중지" : "실행"}</button><button className="primaryButton" disabled={!canSubmit || submitting || running} onClick={() => void submit()}><Send size={16} />{submitting ? "채점 중" : "제출"}</button></div></div>
    {notice && <p className="challengeIdeNotice" role="status">{notice}</p>}
    <div className="challengeIdeBody" ref={bodyRef} style={{ "--challenge-editor-height": `${editorHeight}px` } as React.CSSProperties}><div className="challengeEditorSection"><div className="solveSectionHeader"><strong>코드 에디터</strong><FontSizeControl value={editorFont} onChange={setEditorFont} label="코드 에디터 글자 크기" /></div><div className="challengeEditor"><CodeEditor value={code} onChange={change} onRun={() => void run()} onSubmit={() => void submit()} fontSize={editorFont} colorMode={colorMode} /></div></div>
      <button type="button" className="solvePaneResizer challengePaneResizer" aria-label="코드 에디터와 출력 콘솔 높이 조절" onPointerDown={beginResize} onPointerMove={resize} onPointerUp={() => { resizing.current = null; }} onPointerCancel={() => { resizing.current = null; }}><span /></button>
      <div className="solveConsoleSection"><div className="solveSectionHeader"><strong>출력 콘솔</strong><div className="challengeConsoleActions"><button className="ghostButton" onClick={() => setOutput("")}>콘솔 초기화</button><FontSizeControl value={consoleFont} onChange={setConsoleFont} label="출력 콘솔 글자 크기" /></div></div><div className="terminal challengeTerminal" style={{ fontSize: consoleFont }} aria-live="polite"><pre>{output}</pre>{prompt !== null && <form className="terminalInputRow active" onSubmit={event => { event.preventDefault(); const resolve = resolver.current; resolver.current = null; setOutput(old => old + prompt + input + "\n"); setPrompt(null); setInput(""); resolve?.(input); }}><span>{prompt}</span><input ref={inputRef} aria-label="문제 풀이 콘솔 입력" value={input} onChange={event => setInput(event.target.value)} autoComplete="off" placeholder="값을 입력하고 Enter" /></form>}</div></div></div>
  </article>;
}

function problemGroup(problem: Problem, book: ProblemBook | undefined) {
  const match = problem.id.match(/^(\d+)-(\d+)-\d+/); if (match) return { key: match[2], label: `${book?.order ?? match[1]}-${Number(match[2])}` };
  const group = Math.max(1, Math.floor(problem.order / 100)); return { key: String(group), label: `${book?.order ?? 1}-${group}` };
}

function ChallengeManager({ onReauthenticate }: { onReauthenticate: () => void }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]); const [selected, setSelected] = useState(""); const [board, setBoard] = useState<ChallengeBoard | null>(null); const [books, setBooks] = useState<ProblemBook[]>([]); const [problems, setProblems] = useState<Problem[]>([]); const [chosen, setChosen] = useState<string[]>([]); const [pickerBook, setPickerBook] = useState(""); const [pickerGroup, setPickerGroup] = useState("");
  const [title, setTitle] = useState(""); const [minutes, setMinutes] = useState(40); const [extra, setExtra] = useState(5); const [publicBoard, setPublicBoard] = useState(false); const [creating, setCreating] = useState(false); const [search, setSearch] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [now, setNow] = useState(Date.now()); const [confirmation, setConfirmation] = useState<"start" | "extend" | null>(null); const [entryCodeOpen, setEntryCodeOpen] = useState(false); const [copied, setCopied] = useState(false); const [timerFullscreen, setTimerFullscreen] = useState(false); const [exportOpen, setExportOpen] = useState(false); const [exportOptions, setExportOptions] = useState<ExportOptions>({ includeFirstSolver: false, includeSubmissionTimes: false, includeAttemptCounts: false });
  const clock = useRef({ server: Date.now(), local: 0 }); const [history, setHistory] = useState<{ title: string; rows: ChallengeSubmission[] } | null>(null); const requestVersion = useRef(0); const fullscreenRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (board) setMinutes(board.challenge.duration_minutes); }, [board?.challenge.id]);
  useEffect(() => { const listener = () => { if (!document.fullscreenElement) setTimerFullscreen(false); }; document.addEventListener("fullscreenchange", listener); return () => document.removeEventListener("fullscreenchange", listener); }, []);
  const loadList = useCallback(async () => { const data = await api<{ challenges: Challenge[] }>("/api/challenges"); setChallenges(data.challenges); setSelected(old => old || data.challenges[0]?.id || ""); }, []);
  useEffect(() => { void loadList().catch(caught => setError(message(caught))); }, [loadList]);
  const refresh = useCallback(async () => { if (!selected) return; const version = ++requestVersion.current; try { const data = await api<ChallengeBoard>(`/api/challenges?id=${encodeURIComponent(selected)}`); if (version !== requestVersion.current) return; setBoard(data); clock.current = { server: Date.parse(data.serverNow), local: performance.now() }; setNow(Date.parse(data.serverNow)); setError(""); } catch (caught) { if (version === requestVersion.current) setError(message(caught)); } }, [selected]);
  useEffect(() => { let alive = true; let timer: ReturnType<typeof setTimeout>; setBoard(null); const poll = async () => { await refresh(); if (alive) timer = setTimeout(poll, 5000); }; void poll(); const tick = setInterval(() => setNow(clock.current.server + performance.now() - clock.current.local), 250); return () => { alive = false; requestVersion.current++; clearTimeout(timer); clearInterval(tick); }; }, [refresh]);
  async function openCreate() {
    setError(""); setBusy(true);
    try { const data = await api<{ books: ProblemBook[]; problems: Problem[] }>("/api/teacher-problems"); setBooks(data.books); setProblems(data.problems); const firstBook = data.books.find(book => data.problems.some(problem => problem.bookId === book.id))?.id ?? data.problems[0]?.bookId ?? ""; setPickerBook(firstBook); const book = data.books.find(item => item.id === firstBook); setPickerGroup(data.problems.filter(problem => problem.bookId === firstBook).map(problem => problemGroup(problem, book).key).sort((a, b) => Number(a) - Number(b))[0] ?? ""); setCreating(true); }
    catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  async function create(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const data = await api<{ challenge: Challenge }>("/api/challenges", { action: "create", title, minutes, problemIds: chosen, showLeaderboard: publicBoard }); await loadList(); setSelected(data.challenge.id); setCreating(false); setChosen([]); setTitle(""); } catch (caught) { setError(message(caught)); } finally { setBusy(false); } }
  async function control() { if (!board || !confirmation) return; setBusy(true); setError(""); try { await api("/api/challenges", { action: confirmation, id: board.challenge.id, minutes: confirmation === "start" ? minutes : extra }); setConfirmation(null); await refresh(); await loadList(); } catch (caught) { setError(message(caught)); } finally { setBusy(false); } }
  async function inspect(participant: ChallengeParticipant, problem: Problem) { try { const data = await api<{ submissions: ChallengeSubmission[] }>(`/api/challenges?id=${selected}&participantId=${participant.id}&problemId=${encodeURIComponent(problem.id)}`); setHistory({ title: `${participant.student_no} ${participant.name} · ${problem.title}`, rows: data.submissions }); } catch (caught) { setError(message(caught)); } }
  async function copyEntryCode() { if (!board?.challenge.entry_code) return; try { await navigator.clipboard.writeText(board.challenge.entry_code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setError("입장코드를 직접 복사해주세요."); } }
  async function showFullscreenTimer() { setTimerFullscreen(true); window.setTimeout(() => { void fullscreenRef.current?.requestFullscreen?.().catch(() => undefined); }, 0); }
  async function closeFullscreenTimer() { if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined); setTimerFullscreen(false); }
  async function downloadResults() {
    if (!board) return; setBusy(true); setError("");
    try { const response = await fetch("/api/challenges/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: board.challenge.id, ...exportOptions }) }); if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.message || "결과 파일을 만들지 못했습니다."); } const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${board.challenge.title.replace(/[\\/:*?\"<>|]/g, "_")}_결과.xlsx`; anchor.click(); URL.revokeObjectURL(url); setExportOpen(false); }
    catch (caught) { setError(message(caught)); } finally { setBusy(false); }
  }
  const activeBook = books.find(book => book.id === pickerBook);
  const pickerGroups = useMemo(() => [...new Map(problems.filter(problem => problem.bookId === pickerBook).map(problem => { const group = problemGroup(problem, activeBook); return [group.key, group] as const; })).values()].sort((a, b) => Number(a.key) - Number(b.key)), [activeBook, pickerBook, problems]);
  const pickerProblems = problems.filter(problem => problem.bookId === pickerBook && problemGroup(problem, activeBook).key === pickerGroup && `${problem.title} ${problem.id}`.toLowerCase().includes(search.toLowerCase()));
  const phase = board ? challengePhase(board.challenge, now) : "waiting";
  return <section className="challengeManager"><header className="challengeBar"><div><span className="pill">교사 관리</span><h1>챌린지 관리</h1></div>{board && <div className="challengeTeacherTimer"><ChallengeTimer challenge={board.challenge} now={now} /><button className="iconButton" title="타이머 전체화면" aria-label="타이머 전체화면" onClick={() => void showFullscreenTimer()}><Expand size={19} /></button></div>}<button className="primaryButton" onClick={() => void openCreate()} disabled={busy}>새 챌린지 생성</button><button className="ghostButton" onClick={async () => { await api("/api/teacher-logout", {}); onReauthenticate(); }}>관리 로그아웃</button></header>
    {error && <div className="modalError" role="alert">{error}{error.includes("인증") && <button className="ghostButton" onClick={onReauthenticate}>교사 인증</button>}</div>}
    <label className="challengeSelect">챌린지 선택<select value={selected} onChange={event => { setSelected(event.target.value); const challenge = challenges.find(item => item.id === event.target.value); if (challenge) setMinutes(challenge.duration_minutes); }}><option value="" disabled>챌린지를 선택하세요</option>{challenges.map(challenge => <option key={challenge.id} value={challenge.id}>{challenge.title} · {challenge.entry_code}</option>)}</select></label>
    {!challenges.length && !error && <div className="challengeWaiting"><Trophy size={40} /><h2>첫 챌린지를 만들어보세요.</h2><p>문제를 고르고 제한시간을 설정하면 입장코드가 생성됩니다.</p></div>}
    {board && <><div className="challengeControls"><div><span>입장코드 (영문은 모두 대문자)</span><button type="button" className="challengeEntryCode" onClick={() => setEntryCodeOpen(true)} title="입장코드 크게 보기">{board.challenge.entry_code}</button><button type="button" className={`challengeCopyButton ${copied ? "copied" : ""}`} onClick={() => void copyEntryCode()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "복사됨" : "복사"}</button></div><div><span>상태</span><strong>{phase === "waiting" ? "시작 전" : phase === "running" ? "진행 중" : "종료"}</strong><span>{board.challenge.ends_at && `${new Date(board.challenge.ends_at).toLocaleTimeString("ko-KR")} 마감`}</span></div><div><span>참여 학생</span><strong>{board.participants.length}명</strong><span>{board.challenge.show_leaderboard ? "학생에게 순위 공개" : "결과는 교사만 조회"}</span></div><div className="challengeTimeAction">{phase === "waiting" ? <><label>제한시간(분)<input type="number" min={1} max={480} value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></label><button className="primaryButton" disabled={busy} onClick={() => setConfirmation("start")}><Play size={16} />시작</button></> : <><label>추가 시간(분)<input type="number" min={1} max={480} value={extra} onChange={event => setExtra(Number(event.target.value))} /></label><button className="primaryButton" disabled={busy} onClick={() => setConfirmation("extend")}>{phase === "ended" ? "시간 추가 후 재개" : "시간 추가"}</button></>}</div></div><div className="challengeResultActions"><button className="ghostButton" onClick={() => setExportOpen(true)}><Download size={17} />결과 엑셀 다운로드</button></div><ChallengeResults challenge={board.challenge} participants={board.participants} submissions={board.submissions} onCell={inspect} /></>}
    {creating && <ChallengeModal title="새 챌린지 생성" wide className="challengeCreateModal" onClose={() => setCreating(false)}><form onSubmit={create} className="challengeCreate"><div className="challengeCreateBasics"><label>챌린지 이름<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} placeholder="예: 2학년 1반 파이썬 수행평가" required /></label><label>제한시간(분)<input type="number" value={minutes} onChange={event => setMinutes(Number(event.target.value))} min={1} max={480} required /></label></div><label className="challengeCheckbox"><input type="checkbox" checked={publicBoard} onChange={event => setPublicBoard(event.target.checked)} />학생에게 순위와 최초 해결자 공개 (대회용)</label><div className="challengePickerHeader"><h3>문제 선택</h3><input aria-label="선택한 소단원 문제 검색" value={search} onChange={event => setSearch(event.target.value)} placeholder="현재 소단원에서 문제 검색" /></div><div className="challengeProblemBrowser"><nav aria-label="문제집"><strong>문제집</strong>{books.filter(book => problems.some(problem => problem.bookId === book.id)).map(book => <button type="button" className={pickerBook === book.id ? "active" : ""} key={book.id} onClick={() => { setPickerBook(book.id); const firstGroup = problems.filter(problem => problem.bookId === book.id).map(problem => problemGroup(problem, book).key).sort((a, b) => Number(a) - Number(b))[0] ?? ""; setPickerGroup(firstGroup); setSearch(""); }}>{book.order}번<small>{book.title}</small></button>)}</nav><nav aria-label="소단원"><strong>소단원</strong>{pickerGroups.map(group => <button type="button" className={pickerGroup === group.key ? "active" : ""} key={group.key} onClick={() => { setPickerGroup(group.key); setSearch(""); }}>{group.label}</button>)}</nav><div className="challengeProblemPicker"><strong>{activeBook?.title ?? "문제집"} · {pickerGroups.find(group => group.key === pickerGroup)?.label ?? "소단원"}</strong>{pickerProblems.map(problem => <label className="challengeCheckbox" key={problem.id}><input type="checkbox" checked={chosen.includes(problem.id)} disabled={!chosen.includes(problem.id) && chosen.length >= 50} onChange={event => setChosen(ids => event.target.checked ? [...ids, problem.id] : ids.filter(id => id !== problem.id))} /><span>{problem.title}<small>{problem.id} · {problem.isPublished ? "공개" : "비공개"}</small></span></label>)}{!pickerProblems.length && <p className="helperText">조건에 맞는 문제가 없습니다.</p>}</div></div><h3>출제 순서 ({chosen.length}/50)</h3><ol className="challengeChosen">{chosen.map((id, index) => <li key={id}><span><b>{index + 1}번</b> {problems.find(problem => problem.id === id)?.title}</span><button type="button" className="iconButton" disabled={index === 0} aria-label="문제 위로 이동" onClick={() => setChosen(ids => { const next = [...ids]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}><ArrowUp size={15} /></button><button type="button" className="iconButton" disabled={index === chosen.length - 1} aria-label="문제 아래로 이동" onClick={() => setChosen(ids => { const next = [...ids]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}><ArrowDown size={15} /></button><button type="button" className="iconButton" aria-label="선택 문제 제거" onClick={() => setChosen(ids => ids.filter(item => item !== id))}><X size={15} /></button></li>)}</ol>{error && <p className="modalError" role="alert">{error}</p>}<button className="primaryButton wideButton" disabled={busy || !chosen.length}>{busy ? "생성 중…" : "챌린지 생성"}</button></form></ChallengeModal>}
    {confirmation && board && <ChallengeModal title={confirmation === "start" ? "챌린지 시작" : "추가 시간 부여"} onClose={() => setConfirmation(null)}><p>{confirmation === "start" ? `지금부터 ${minutes}분 동안 문제가 공개되고 제출할 수 있습니다.` : phase === "ended" ? `지금부터 ${extra}분 동안 전체 학생의 제출이 다시 열립니다.` : `전체 학생의 마감 시간이 ${extra}분 연장됩니다.`}</p>{error && <p role="alert">{error}</p>}<button className="primaryButton wideButton" disabled={busy} onClick={() => void control()}>{busy ? "적용 중…" : "확인"}</button></ChallengeModal>}
    {history && <ChallengeModal title={history.title} wide onClose={() => setHistory(null)}><div className="challengeHistory">{history.rows.map(row => <article key={row.id}><strong>{statusLabel(row.status)} · 시작 후 {elapsedLabel(board?.challenge.started_at ?? null, row.received_at)}</strong><p>{row.feedback}</p><pre>{row.code}</pre></article>)}{!history.rows.length && <p>제출 기록이 없습니다.</p>}</div></ChallengeModal>}
    {entryCodeOpen && board && <ChallengeModal title="챌린지 입장코드" className="challengeCodeModal" onClose={() => setEntryCodeOpen(false)}><button type="button" className="challengeCodeDisplay" onClick={() => void copyEntryCode()} title="클릭하여 복사">{board.challenge.entry_code}</button><p>{board.challenge.title}</p><button type="button" className={`challengeCopyButton wideButton ${copied ? "copied" : ""}`} onClick={() => void copyEntryCode()}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "입장코드 복사됨" : "입장코드 복사"}</button></ChallengeModal>}
    {exportOpen && board && <ChallengeModal title="결과 엑셀 다운로드" onClose={() => setExportOpen(false)}><p className="helperText">학번, 이름, 문항별 정오답 여부는 항상 포함됩니다. 필요한 상세 정보를 선택하세요.</p><div className="challengeExportOptions"><label><input type="checkbox" checked={exportOptions.includeFirstSolver} onChange={event => setExportOptions(options => ({ ...options, includeFirstSolver: event.target.checked }))} />문항별 최초 해결 정보</label><label><input type="checkbox" checked={exportOptions.includeSubmissionTimes} onChange={event => setExportOptions(options => ({ ...options, includeSubmissionTimes: event.target.checked }))} />첫 제출·최초 정답 시간</label><label><input type="checkbox" checked={exportOptions.includeAttemptCounts} onChange={event => setExportOptions(options => ({ ...options, includeAttemptCounts: event.target.checked }))} />제출 시도 횟수</label></div><button className="primaryButton wideButton" disabled={busy} onClick={() => void downloadResults()}>{busy ? "파일 생성 중…" : "엑셀 파일 다운로드"}</button></ChallengeModal>}
    {timerFullscreen && board && <div className="challengeFullscreenTimer" ref={fullscreenRef} role="dialog" aria-modal="true" aria-label="챌린지 타이머 전체화면"><button className="challengeFullscreenClose" onClick={() => void closeFullscreenTimer()}><Minimize2 size={24} />전체화면 닫기</button><ChallengeTimer challenge={board.challenge} now={now} large /></div>}
  </section>;
}

function ChallengeResults({ challenge, participants, submissions, onCell }: Pick<ChallengeBoard, "challenge" | "participants" | "submissions"> & { onCell?: (participant: ChallengeParticipant, problem: Problem) => void }) {
  const first = firstSolvers(submissions); const rows = participants.map(participant => { const records = submissions.filter(row => row.participant_id === participant.id); return { participant, records, solved: new Set(records.filter(row => row.status === "accepted").map(row => row.problem_id)).size }; }).sort((a, b) => b.solved - a.solved || a.participant.student_no.localeCompare(b.participant.student_no));
  return <div className="challengeResults"><table><caption>{onCell ? "학생별 제출 및 정답 현황 (★는 문항 최초 해결자)" : "챌린지 순위 · 정답 수 기준 공동 순위"}</caption><thead><tr><th>순위</th><th>학번</th><th>이름</th><th>정답</th>{challenge.problem_snapshots.map((problem, index) => <th key={problem.id} title={problem.title}>{index + 1}번<br /><small>{problem.title}</small></th>)}</tr></thead><tbody>{rows.map(({ participant, records, solved }) => <tr key={participant.id}><td>{rows.findIndex(row => row.solved === solved) + 1}</td><td>{participant.student_no}</td><th>{participant.name}</th><td>{solved}/{challenge.problem_snapshots.length}</td>{challenge.problem_snapshots.map(problem => { const attempts = records.filter(row => row.problem_id === problem.id).sort((a, b) => a.received_at.localeCompare(b.received_at) || a.id.localeCompare(b.id)); const accepted = attempts.find(row => row.status === "accepted"); const firstSolver = first.get(problem.id)?.participant_id === participant.id; const content = <><strong>{firstSolver && <span title="문항 최초 해결자">★ </span>}{statusLabel(accepted ? "accepted" : attempts.at(-1)?.status)}</strong>{accepted && <span>{elapsedLabel(challenge.started_at, accepted.received_at)}</span>}{onCell && <small>{attempts.length}회 제출</small>}</>; return <td key={problem.id} className={accepted ? "challengeAccepted" : ""}>{onCell ? <button className="challengeCell" onClick={() => onCell(participant, problem)}>{content}</button> : <div className="challengeCell">{content}</div>}</td>; })}</tr>)}{!rows.length && <tr><td colSpan={4 + challenge.problem_snapshots.length}>입장한 학생이 없습니다.</td></tr>}</tbody></table></div>;
}
