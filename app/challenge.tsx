"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Clock3, Play, Send, Square, Trophy, X } from "lucide-react";
import type { Problem, Student } from "@/lib/types";
import { challengePhase, elapsedLabel, firstSolvers, type Challenge, type ChallengeBoard, type ChallengeParticipant, type ChallengeSubmission } from "@/lib/challenge-types";
import { runPythonWithSkulpt } from "@/lib/skulpt-runner";

type EditorProps = { value: string; onChange: (value: string) => void; onRun: () => void; onSubmit?: () => void; colorMode: "light" | "dark"; fontSize: number };
type PaneProps = { selectedProblem: Problem; previousProblem?: Problem; nextProblem?: Problem; autoAdvanceOnAccepted: boolean; onPrevious: () => void; onNext: () => void; onAutoAdvanceChange: (enabled: boolean) => void };
type Session = { challenge: Challenge; participant: ChallengeParticipant; submissions: ChallengeSubmission[]; serverNow: string; leaderboard: Pick<ChallengeBoard, "participants" | "submissions"> | null };
type Mode = "entry" | "student" | "teacher";

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

export default function ChallengeExperience({ mode, student, colorMode, onMode, onClose, CodeEditor, ProblemPane }: {
  mode: Mode; student: Student | null; colorMode: "light" | "dark"; onMode: (mode: Mode) => void; onClose: () => void;
  CodeEditor: ComponentType<EditorProps>; ProblemPane: ComponentType<PaneProps>;
}) {
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
      if (teacherEntry) {
        await api("/api/teacher-login", { password }); setPassword(""); onMode("teacher");
      } else {
        const result = await api<{ challengeId: string }>("/api/challenges/session", { entryCode, studentNo, name });
        write("pyoj:challenge-id", result.challengeId);
        const url = new URL(window.location.href); url.searchParams.set("challenge", result.challengeId); window.history.replaceState(null, "", url);
        onMode("student");
      }
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  if (mode === "teacher") return <ChallengeManager onReauthenticate={() => { setTeacherEntry(true); onMode("entry"); }} />;
  if (mode === "student") return <ChallengeStudent CodeEditor={CodeEditor} ProblemPane={ProblemPane} colorMode={colorMode} onReenter={() => onMode("entry")} />;
  return <ChallengeModal title="챌린지" onClose={onClose}>
    <p className="helperText">수행평가 및 프로그래밍 대회</p>
    <div className="challengeTabs"><button className={!teacherEntry ? "active" : ""} onClick={() => { setTeacherEntry(false); setError(""); }}>학생 입장</button><button className={teacherEntry ? "active" : ""} onClick={() => { setTeacherEntry(true); setError(""); }}>교사 관리</button></div>
    <form onSubmit={enter}>
      {teacherEntry ? <label>교사 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label> : <>
        <label>입장코드<input value={entryCode} onChange={e => setEntryCode(e.target.value.toUpperCase().replace(/\s/g, ""))} maxLength={8} placeholder="8자리 입장코드" autoComplete="off" required /></label>
        <label>학번<input value={studentNo} onChange={e => setStudentNo(e.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="예: 1203" required /></label>
        <label>이름<input value={name} onChange={e => setName(e.target.value)} maxLength={30} autoComplete="name" required /></label>
      </>}
      {error && <p role="alert" className="modalError">{error}</p>}
      <button className="primaryButton wideButton" disabled={busy}>{busy ? "확인 중…" : teacherEntry ? "관리 모드 입장" : "챌린지 입장"}</button>
    </form>
  </ChallengeModal>;
}

function ChallengeModal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,button")?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const nodes = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", listener);
    return () => { document.removeEventListener("keydown", listener); previous?.focus(); };
  }, []);
  return <div className="modalBackdrop"><div className={`loginModal challengeModal ${wide ? "wide" : ""}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}>
    <button className="iconButton closeButton" onClick={onClose} aria-label="닫기"><X size={18} /></button><h2>{title}</h2>{children}
  </div></div>;
}

function ChallengeStudent({ CodeEditor, ProblemPane, colorMode, onReenter }: { CodeEditor: ComponentType<EditorProps>; ProblemPane: ComponentType<PaneProps>; colorMode: "light" | "dark"; onReenter: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);
  const [now, setNow] = useState(Date.now());
  const clock = useRef({ server: Date.now(), local: 0 });
  const [lastSync, setLastSync] = useState(0);
  const [autoNext, setAutoNext] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const refresh = useCallback(async () => {
    const id = new URL(window.location.href).searchParams.get("challenge") || read("pyoj:challenge-id");
    if (!id) { setError("입장코드를 입력해주세요."); return; }
    try {
      const data = await api<Session>(`/api/challenges/session?id=${encodeURIComponent(id)}`);
      setSession(data); clock.current = { server: Date.parse(data.serverNow), local: performance.now() };
      setNow(Date.parse(data.serverNow)); setLastSync(performance.now()); setError("");
    } catch (error) { setError(message(error)); }
  }, []);
  useEffect(() => {
    let alive = true; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => { await refresh(); if (alive) timer = setTimeout(poll, 3000); };
    void poll();
    const tick = setInterval(() => setNow(clock.current.server + performance.now() - clock.current.local), 250);
    return () => { alive = false; clearTimeout(timer); clearInterval(tick); };
  }, [refresh]);
  if (!session) return <section className="challengeWaiting"><Trophy size={42} /><h1>챌린지 입장 확인</h1><p role="status">{error || "참여 정보를 불러오는 중입니다…"}</p>{error && <button className="primaryButton" onClick={onReenter}>입장코드 입력</button>}</section>;
  const { challenge, participant, submissions } = session;
  const phase = challengePhase(challenge, now);
  const problems = challenge.problem_snapshots;
  const problem = problems[selected] ?? problems[0];
  const remaining = Math.max(0, Date.parse(challenge.ends_at ?? "") - now);
  const connected = performance.now() - lastSync < 12000 && !error;
  return <section className="challengeView">
    <header className="challengeBar"><div><span className="pill">챌린지 · {participant.student_no} {participant.name}</span><h1>{challenge.title}</h1></div><div className={`challengeTimer ${phase === "ended" ? "ended" : ""}`} role="timer"><Clock3 size={22} />{phase === "waiting" ? "시작 대기" : phase === "ended" ? "제출 종료" : `${Math.floor(remaining / 60000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}`}</div><button className="ghostButton" onClick={() => setHistoryOpen(true)}>내 제출 기록</button></header>
    {error && <p className="modalError" role="alert">{error} 제출은 연결이 복구되면 가능합니다.</p>}
    {phase === "waiting" ? <div className="challengeWaiting"><Trophy size={48} /><h2>입장했습니다. 선생님의 시작을 기다려주세요.</h2><p>제한시간 {challenge.duration_minutes}분 · 시작하면 문제가 자동으로 공개됩니다.</p></div> : <>
      {phase === "ended" && <div className="notice">제한시간이 끝났습니다. 제출은 마감되었으며, 추가 시간이 부여되면 자동으로 다시 열립니다.</div>}
      <div className="challengeSolveGrid"><aside className="problemList"><div className="sectionTitle">문항</div>{problems.map((p, index) => {
        const records = submissions.filter(s => s.problem_id === p.id);
        const status = records.some(s => s.status === "accepted") ? "accepted" : records.at(-1)?.status;
        return <button className={`problemItem ${p.id === problem?.id ? "active" : ""} ${status === "accepted" ? "solved" : ""}`} key={p.id} onClick={() => setSelected(index)}><span>{index + 1}</span><strong>{statusLabel(status)}</strong></button>;
      })}</aside>{problem && <div className="workspace"><ProblemPane selectedProblem={problem} previousProblem={problems[selected - 1]} nextProblem={problems[selected + 1]} autoAdvanceOnAccepted={autoNext} onPrevious={() => setSelected(i => Math.max(0, i - 1))} onNext={() => setSelected(i => Math.min(problems.length - 1, i + 1))} onAutoAdvanceChange={setAutoNext} />
        <ChallengeIDE key={`${participant.id}:${problem.id}`} problem={problem} participant={participant} canSubmit={phase === "running" && connected} colorMode={colorMode} CodeEditor={CodeEditor} onSubmitted={async accepted => { await refresh(); if (accepted && autoNext) setSelected(i => Math.min(problems.length - 1, i + 1)); }} />
      </div>}</div>
    </>}
    {session.leaderboard && <ChallengeResults challenge={challenge} participants={session.leaderboard.participants} submissions={session.leaderboard.submissions} />}
    {historyOpen && <ChallengeModal title="내 제출 기록" wide onClose={() => setHistoryOpen(false)}><div className="challengeHistory">{[...submissions].reverse().map(s => <div key={s.id}><strong>{problems.find(p => p.id === s.problem_id)?.title ?? "문항"} · {statusLabel(s.status)}</strong><p>시작 후 {elapsedLabel(challenge.started_at, s.received_at)} · {s.feedback}</p></div>)}{!submissions.length && <p>아직 제출한 기록이 없습니다.</p>}</div></ChallengeModal>}
  </section>;
}

function ChallengeIDE({ problem, participant, canSubmit, colorMode, CodeEditor, onSubmitted }: { problem: Problem; participant: ChallengeParticipant; canSubmit: boolean; colorMode: "light" | "dark"; CodeEditor: ComponentType<EditorProps>; onSubmitted: (accepted: boolean) => Promise<void> }) {
  const storageKey = `pyoj:challenge-code:${participant.challenge_id}:${participant.id}:${problem.id}`;
  const [code, setCode] = useState(() => read(storageKey) ?? problem.starterCode);
  const [font, setFont] = useState(16);
  const [output, setOutput] = useState("실행 버튼 또는 Shift + Enter로 실행하세요.");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const resolver = useRef<((input: string) => void) | null>(null);
  const controller = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);
  const mounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); resolver.current?.(""); }; }, []);
  useEffect(() => { if (prompt !== null) inputRef.current?.focus(); }, [prompt]);
  function change(value: string) { setCode(value); if (!write(storageKey, value)) setNotice("이 브라우저에서 코드 자동 저장을 사용할 수 없습니다. 코드를 별도로 보관해주세요."); }
  async function run() {
    if (controller.current || submittingRef.current) return;
    const abort = new AbortController(); controller.current = abort;
    setRunning(true); setOutput(""); setPrompt(null);
    try {
      await runPythonWithSkulpt(code, { output: text => setOutput(old => (old + text).slice(-65536)), error: text => setOutput(old => old + "\n" + text), input: text => new Promise(resolve => { resolver.current = resolve; setPrompt(text); }) }, { signal: abort.signal });
    } finally { controller.current = null; resolver.current = null; if (mounted.current) { setRunning(false); setPrompt(null); } }
  }
  async function submit() {
    if (!canSubmit || submittingRef.current || controller.current) return;
    submittingRef.current = true; setSubmitting(true); setNotice("");
    try {
      const result = await api<{ submission: ChallengeSubmission }>("/api/challenges/submit", { challengeId: participant.challenge_id, problemId: problem.id, code, requestId: crypto.randomUUID() });
      if (mounted.current) setNotice(`${statusLabel(result.submission.status)} · ${result.submission.feedback ?? ""}`);
      if (mounted.current) await onSubmitted(result.submission.status === "accepted");
    } catch (error) { if (mounted.current) setNotice(message(error)); }
    finally { submittingRef.current = false; if (mounted.current) setSubmitting(false); }
  }
  return <article className="idePane challengeIde"><div className="ideHeader"><div><strong>문제 풀이 IDE</strong><span>작성 코드 자동 저장</span></div><div className="ideActions"><button className="ghostButton" onClick={() => change(problem.starterCode)}>초기 코드</button><button className="runButton" disabled={submitting} onClick={() => running ? controller.current?.abort() : void run()}>{running ? <Square size={16} /> : <Play size={16} />}{running ? "실행중지" : "실행"}</button><button className="primaryButton" disabled={!canSubmit || submitting || running} onClick={() => void submit()}><Send size={16} />{submitting ? "채점 중" : "제출"}</button></div></div>
    <div className="challengeEditorSection"><div className="solveSectionHeader"><strong>코드 에디터</strong><div className="challengeFont"><button aria-label="코드 글자 작게" onClick={() => setFont(f => Math.max(12, f - 1))}>−</button><span>{font}px</span><button aria-label="코드 글자 크게" onClick={() => setFont(f => Math.min(40, f + 1))}>+</button></div></div><CodeEditor value={code} onChange={change} onRun={() => void run()} onSubmit={() => void submit()} fontSize={font} colorMode={colorMode} /></div>
    <div className="solveConsoleSection"><div className="solveSectionHeader"><strong>출력 콘솔</strong><button className="ghostButton" onClick={() => setOutput("")}>콘솔 초기화</button></div><div className="terminal challengeTerminal" aria-live="polite"><pre>{output}</pre>{prompt !== null && <form className="terminalInputRow active" onSubmit={e => { e.preventDefault(); const resolve = resolver.current; resolver.current = null; setOutput(old => old + prompt + input + "\n"); setPrompt(null); setInput(""); resolve?.(input); }}><span>{prompt}</span><input ref={inputRef} aria-label="문제 풀이 콘솔 입력" value={input} onChange={e => setInput(e.target.value)} autoComplete="off" placeholder="값을 입력하고 Enter" /></form>}</div></div>
    <div className="challengeIdeFooter"><span>Shift + Enter 실행 · Alt + Enter 제출</span>{notice && <p role="status">{notice}</p>}</div>
  </article>;
}

function ChallengeManager({ onReauthenticate }: { onReauthenticate: () => void }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState("");
  const [board, setBoard] = useState<ChallengeBoard | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(40);
  const [extra, setExtra] = useState(5);
  const [publicBoard, setPublicBoard] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmation, setConfirmation] = useState<"start" | "extend" | null>(null);
  const clock = useRef({ server: Date.now(), local: 0 });
  const [history, setHistory] = useState<{ title: string; rows: ChallengeSubmission[] } | null>(null);
  const requestVersion = useRef(0);
  useEffect(() => { if (board) setMinutes(board.challenge.duration_minutes); }, [board?.challenge.id]);
  const loadList = useCallback(async () => {
    const data = await api<{ challenges: Challenge[] }>("/api/challenges"); setChallenges(data.challenges);
    setSelected(old => old || data.challenges[0]?.id || "");
  }, []);
  useEffect(() => { void loadList().catch(error => setError(message(error))); }, [loadList]);
  const refresh = useCallback(async () => {
    if (!selected) return;
    const version = ++requestVersion.current;
    try {
      const data = await api<ChallengeBoard>(`/api/challenges?id=${encodeURIComponent(selected)}`);
      if (version !== requestVersion.current) return;
      setBoard(data); clock.current = { server: Date.parse(data.serverNow), local: performance.now() }; setNow(Date.parse(data.serverNow)); setError("");
    } catch (error) { if (version === requestVersion.current) setError(message(error)); }
  }, [selected]);
  useEffect(() => {
    let alive = true; let timer: ReturnType<typeof setTimeout>;
    setBoard(null);
    const poll = async () => { await refresh(); if (alive) timer = setTimeout(poll, 5000); }; void poll();
    const tick = setInterval(() => setNow(clock.current.server + performance.now() - clock.current.local), 1000);
    return () => { alive = false; requestVersion.current++; clearTimeout(timer); clearInterval(tick); };
  }, [refresh]);
  async function openCreate() {
    setError(""); setBusy(true);
    try { const data = await api<{ problems: Problem[] }>("/api/teacher-problems"); setProblems(data.problems); setCreating(true); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = await api<{ challenge: Challenge }>("/api/challenges", { action: "create", title, minutes, problemIds: chosen, showLeaderboard: publicBoard });
      await loadList(); setSelected(data.challenge.id); setCreating(false); setChosen([]); setTitle("");
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function control() {
    if (!board || !confirmation) return;
    setBusy(true); setError("");
    try { await api("/api/challenges", { action: confirmation, id: board.challenge.id, minutes: confirmation === "start" ? minutes : extra }); setConfirmation(null); await refresh(); await loadList(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function inspect(participant: ChallengeParticipant, problem: Problem) {
    try { const data = await api<{ submissions: ChallengeSubmission[] }>(`/api/challenges?id=${selected}&participantId=${participant.id}&problemId=${encodeURIComponent(problem.id)}`); setHistory({ title: `${participant.student_no} ${participant.name} · ${problem.title}`, rows: data.submissions }); }
    catch (error) { setError(message(error)); }
  }
  const phase = board ? challengePhase(board.challenge, now) : "waiting";
  return <section className="challengeManager"><header className="challengeBar"><div><span className="pill">교사 관리</span><h1>챌린지 관리</h1></div><button className="primaryButton" onClick={() => void openCreate()} disabled={busy}>새 챌린지 · 입장코드 생성</button><button className="ghostButton" onClick={async () => { await api("/api/teacher-logout", {}); onReauthenticate(); }}>관리 로그아웃</button></header>
    {error && <div className="modalError" role="alert">{error}{error.includes("인증") && <button className="ghostButton" onClick={onReauthenticate}>교사 인증</button>}</div>}
    <label className="challengeSelect">챌린지 선택<select value={selected} onChange={e => { setSelected(e.target.value); const c = challenges.find(c => c.id === e.target.value); if (c) setMinutes(c.duration_minutes); }}><option value="" disabled>챌린지를 선택하세요</option>{challenges.map(c => <option key={c.id} value={c.id}>{c.title} · {c.entry_code}</option>)}</select></label>
    {!challenges.length && !error && <div className="challengeWaiting"><Trophy size={40} /><h2>첫 챌린지를 만들어보세요.</h2><p>문제를 고르고 제한시간을 설정하면 입장코드가 생성됩니다.</p></div>}
    {board && <>
      <div className="challengeControls"><div><span>입장코드</span><strong className="challengeEntryCode">{board.challenge.entry_code}</strong><button className="ghostButton" onClick={() => navigator.clipboard.writeText(board.challenge.entry_code ?? "").catch(() => setError("입장코드를 직접 복사해주세요."))}>복사</button></div>
        <div><span>상태</span><strong>{phase === "waiting" ? "시작 전" : phase === "running" ? "진행 중" : "종료"}</strong><span>{board.challenge.ends_at && `${new Date(board.challenge.ends_at).toLocaleTimeString("ko-KR")} 마감`}</span></div>
        <div><span>참여 학생</span><strong>{board.participants.length}명</strong><span>{board.challenge.show_leaderboard ? "학생에게 순위 공개" : "결과는 교사만 조회"}</span></div>
        <div className="challengeTimeAction">{phase === "waiting" ? <><label>제한시간(분)<input type="number" min={1} max={480} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label><button className="primaryButton" disabled={busy} onClick={() => setConfirmation("start")}><Play size={16} />시작</button></> : <><label>추가 시간(분)<input type="number" min={1} max={480} value={extra} onChange={e => setExtra(Number(e.target.value))} /></label><button className="primaryButton" disabled={busy} onClick={() => setConfirmation("extend")}>{phase === "ended" ? "시간 추가 후 재개" : "시간 추가"}</button></>}</div>
      </div>
      <ChallengeResults challenge={board.challenge} participants={board.participants} submissions={board.submissions} onCell={inspect} />
      <p className="helperText">문항 칸을 누르면 제출 코드와 이력을 확인합니다. 정답 시간은 전체 시작 시각부터 서버가 정답 제출을 접수한 시각까지입니다. ★는 문항 최초 해결자입니다. 5초마다 갱신됩니다.</p>
      <details className="challengeEvents"><summary>시간 변경 이력 ({board.events?.length ?? 0})</summary>{board.events?.map(event => <p key={event.id}>{new Date(event.created_at).toLocaleString("ko-KR")} · {event.action === "start" ? "시작" : "추가 시간 부여"} {event.minutes}분</p>)}</details>
    </>}
    {creating && <ChallengeModal title="새 챌린지" wide onClose={() => setCreating(false)}><form onSubmit={create} className="challengeCreate"><label>챌린지 이름<input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="예: 2학년 1반 파이썬 수행평가" required /></label><label>제한시간(분)<input type="number" value={minutes} onChange={e => setMinutes(Number(e.target.value))} min={1} max={480} required /></label><label className="challengeCheckbox"><input type="checkbox" checked={publicBoard} onChange={e => setPublicBoard(e.target.checked)} />학생에게 순위와 최초 해결자 공개 (대회용)</label>
      <p className="helperText">기존 문제 중 비공개 문제도 선택할 수 있습니다. 선택 당시의 문제와 채점 기준이 이 챌린지에 저장됩니다.</p><label>문제 검색<input value={search} onChange={e => setSearch(e.target.value)} placeholder="문제 제목 또는 문제집 ID" /></label>
      <div className="challengeProblemPicker">{problems.filter(p => `${p.title} ${p.bookId} ${p.id}`.toLowerCase().includes(search.toLowerCase())).map(p => <label className="challengeCheckbox" key={p.id}><input type="checkbox" checked={chosen.includes(p.id)} disabled={!chosen.includes(p.id) && chosen.length >= 50} onChange={e => setChosen(ids => e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} /><span>{p.title}<small>{p.bookId} · {p.isPublished ? "공개" : "비공개"}</small></span></label>)}</div>
      <h3>출제 순서 ({chosen.length}/50)</h3><ol className="challengeChosen">{chosen.map((id, index) => <li key={id}><span>{problems.find(p => p.id === id)?.title}</span><button type="button" className="iconButton" disabled={index === 0} aria-label="문제 위로 이동" onClick={() => setChosen(ids => { const next = [...ids]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}><ArrowUp size={15} /></button><button type="button" className="iconButton" disabled={index === chosen.length - 1} aria-label="문제 아래로 이동" onClick={() => setChosen(ids => { const next = [...ids]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}><ArrowDown size={15} /></button><button type="button" className="iconButton" aria-label="선택 문제 제거" onClick={() => setChosen(ids => ids.filter(item => item !== id))}><X size={15} /></button></li>)}</ol>
      {error && <p className="modalError" role="alert">{error}</p>}<button className="primaryButton wideButton" disabled={busy || !chosen.length}>{busy ? "생성 중…" : "챌린지 및 입장코드 생성"}</button>
    </form></ChallengeModal>}
    {confirmation && board && <ChallengeModal title={confirmation === "start" ? "챌린지 시작" : "추가 시간 부여"} onClose={() => setConfirmation(null)}><p>{confirmation === "start" ? `지금부터 ${minutes}분 동안 문제가 공개되고 제출할 수 있습니다.` : phase === "ended" ? `지금부터 ${extra}분 동안 전체 학생의 제출이 다시 열립니다.` : `전체 학생의 마감 시간이 ${extra}분 연장됩니다.`}</p>{error && <p role="alert">{error}</p>}<button className="primaryButton wideButton" disabled={busy} onClick={() => void control()}>{busy ? "적용 중…" : "확인"}</button></ChallengeModal>}
    {history && <ChallengeModal title={history.title} wide onClose={() => setHistory(null)}><div className="challengeHistory">{history.rows.map(row => <article key={row.id}><strong>{statusLabel(row.status)} · 시작 후 {elapsedLabel(board?.challenge.started_at ?? null, row.received_at)}</strong><p>{row.feedback}</p><pre>{row.code}</pre></article>)}{!history.rows.length && <p>제출 기록이 없습니다.</p>}</div></ChallengeModal>}
  </section>;
}

function ChallengeResults({ challenge, participants, submissions, onCell }: Pick<ChallengeBoard, "challenge" | "participants" | "submissions"> & { onCell?: (participant: ChallengeParticipant, problem: Problem) => void }) {
  const first = firstSolvers(submissions);
  const rows = participants.map(participant => {
    const records = submissions.filter(s => s.participant_id === participant.id);
    return { participant, records, solved: new Set(records.filter(s => s.status === "accepted").map(s => s.problem_id)).size };
  }).sort((a, b) => b.solved - a.solved || a.participant.student_no.localeCompare(b.participant.student_no));
  return <div className="challengeResults"><table><caption>{onCell ? "학생별 제출 및 정답 현황" : "챌린지 순위 · 정답 수 기준 공동 순위"}</caption><thead><tr><th>순위</th><th>학번</th><th>이름</th><th>정답</th>{challenge.problem_snapshots.map((p, i) => <th key={p.id} title={p.title}>{i + 1}번<br /><small>{p.title}</small></th>)}</tr></thead><tbody>{rows.map(({ participant, records, solved }, index) => <tr key={participant.id}><td>{rows.findIndex(row => row.solved === solved) + 1}</td><td>{participant.student_no}</td><th>{participant.name}</th><td>{solved}/{challenge.problem_snapshots.length}</td>{challenge.problem_snapshots.map(problem => {
    const attempts = records.filter(s => s.problem_id === problem.id).sort((a, b) => a.received_at.localeCompare(b.received_at) || a.id.localeCompare(b.id));
    const accepted = attempts.find(s => s.status === "accepted");
    const firstSolver = first.get(problem.id)?.participant_id === participant.id;
    const content = <><strong>{firstSolver && <span title="문항 최초 해결자">★ </span>}{statusLabel(accepted ? "accepted" : attempts.at(-1)?.status)}</strong>{accepted && <span>{elapsedLabel(challenge.started_at, accepted.received_at)}</span>}{onCell && <small>{attempts.length}회 제출</small>}</>;
    return <td key={problem.id} className={accepted ? "challengeAccepted" : ""}>{onCell ? <button className="challengeCell" onClick={() => onCell(participant, problem)}>{content}</button> : <div className="challengeCell">{content}</div>}</td>;
  })}</tr>)}{!rows.length && <tr><td colSpan={4 + challenge.problem_snapshots.length}>입장한 학생이 없습니다.</td></tr>}</tbody></table></div>;
}
