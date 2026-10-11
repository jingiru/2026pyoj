"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { AssessmentResult } from "@/lib/temporary-challenge-results";

type ResultProblem = AssessmentResult["problems"][number];
const statusLabel = (status: string | null) => ({ accepted: "정답", wrong_answer: "오답", runtime_error: "실행 오류", code_requirement_failed: "조건 미준수", pending: "채점 중" }[status ?? ""] ?? "미제출");

function RoundResult({ result, best }: { result: AssessmentResult; best: boolean }) {
  const [selected, setSelected] = useState<ResultProblem | null>(null);
  return <article className={`temporaryRound ${best ? "best" : ""}`}>
    <header><span>{result.title}</span><strong>{result.total === null ? "코드 이해도 채점 대기" : `${result.total} / 30점`}{best && <small>높은 점수</small>}</strong></header>
    <dl>{[["1점짜리", result.onePoint, 8], ["2점짜리", result.twoPoint, 12], ["코드 이해도", result.understanding, 10]].map(([label, score, max]) => <div key={label}><dt>{label} <small>최소 4점</small></dt><dd>{score === null ? "채점 대기" : `${score} / ${max}점`}</dd></div>)}</dl>
    <div className="temporaryProblemGrid">{result.problems.map(problem => {
      const state = problem.solved ? "correct" : problem.status === null ? "unsubmitted" : problem.status === "pending" ? "pending" : "wrong";
      const label = { correct: "정답", wrong: "오답", unsubmitted: "미제출", pending: "채점 중" }[state];
      return <button type="button" className={`temporaryProblemCard ${state} ${selected?.number === problem.number ? "selected" : ""}`} key={problem.number} aria-expanded={selected?.number === problem.number} aria-controls={`problem-detail-${result.round}`} onClick={() => setSelected(current => current?.number === problem.number ? null : problem)}><span>{problem.number}번</span><strong>{problem.title}</strong><b>{label}</b></button>;
    })}</div>
    <p className="helperText">문제를 누르면 상세 내용을 볼 수 있습니다. 정오답은 정답 제출 이력, 코드는 마지막 제출본 기준입니다.</p>
    {selected && <section className="temporaryProblem" id={`problem-detail-${result.round}`} aria-label={`${selected.number}번 문제 상세`}><header><h3>{selected.number}번 · {selected.title}</h3><button type="button" className="ghostButton" onClick={() => setSelected(null)}>상세 닫기</button></header><h4>문제</h4><p>{selected.statement}</p>{selected.inputDescription && <><h4>입력</h4><p>{selected.inputDescription}</p></>}{selected.outputDescription && <><h4>출력</h4><p>{selected.outputDescription}</p></>}{selected.examples?.map((example, index) => <div key={index}><h4>예제 {index + 1}</h4><pre>입력: {example.input}{"\n"}출력: {example.output}</pre></div>)}<h4>최종 제출 코드 · {statusLabel(selected.status)}</h4><pre>{selected.code ?? "제출한 코드가 없습니다."}</pre></section>}
  </article>;
}

export default function ChallengeResultsPage() {
  const [studentNo, setStudentNo] = useState(""), [name, setName] = useState("");
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function lookup(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResults(null);
    try {
      const response = await fetch("/api/challenges/results", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentNo, name }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "점수를 조회하지 못했습니다.");
      setResults(data.results);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "연결 상태를 확인하고 다시 시도해주세요."); }
    finally { setBusy(false); }
  }
  const totals = [1, 2].map(round => results?.filter(row => row.round === round && row.total !== null).reduce<number | null>((best, row) => best === null ? row.total : Math.max(best, row.total!), null) ?? null);
  const bestRound = totals[0] !== null && totals[1] !== null && totals[0] !== totals[1] ? (totals[0] > totals[1] ? 1 : 2) : null;
  return <main className="temporaryResultsPage"><header className="temporaryPageHeader"><div><p className="helperText">챌린지 수행평가</p><h1>점수 확인</h1></div><Link className="ghostButton" href="/">홈으로 돌아가기</Link></header><p className="helperText">학번과 이름을 입력해 종료된 1차·2차 수행평가 결과를 비교해보세요.</p>
    <form className="temporaryLookupForm" onSubmit={lookup}><label>학번<input value={studentNo} onChange={event => { setStudentNo(event.target.value.replace(/\D/g, "")); setResults(null); }} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="예: 1203" required /></label><label>이름<input value={name} onChange={event => { setName(event.target.value); setResults(null); }} maxLength={30} autoComplete="name" required /></label><button className="primaryButton" disabled={busy}>{busy ? "조회 중…" : "점수 조회"}</button></form>
    {error && <p role="alert" className="modalError">{error}</p>}
    <div className="temporaryResults" aria-live="polite">{[1, 2].map(round => <section className="temporaryRoundColumn" key={round}><h2>{round}차 수행평가</h2>{results === null ? <p className="temporaryEmpty">{busy ? "점수를 조회하고 있습니다…" : "학번과 이름을 입력하면 결과가 표시됩니다."}</p> : !results.some(row => row.round === round) ? <p className="temporaryEmpty">조회 가능한 참여 기록이 없습니다. 학번과 이름을 확인해주세요.</p> : results.filter(row => row.round === round).map((result, index) => <RoundResult key={`${studentNo}:${name}:${round}:${index}`} result={result} best={bestRound === round} />)}</section>)}</div>
  </main>;
}
