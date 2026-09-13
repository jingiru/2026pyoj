"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { yCollab, ySyncAnnotation, yUndoManagerKeymap } from "y-codemirror.next";
import { keymap } from "@codemirror/view";
import { EditorState, Prec } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import type { Student } from "@/lib/types";

type ActiveCode = { key: string; title: string; code: string };
type SharedCode = { doc: Y.Doc; awareness: Awareness; key: string; title: string; epoch: string; startedAt: number };
const remoteOrigin = "live-code-remote";
function pack(bytes: Uint8Array) { return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")); }
function unpack(value: string) {
  if (value.length > 2_000_000) throw new Error("메시지가 너무 큽니다.");
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export function useLiveCode(student: Student | null, active: ActiveCode | null, teacher = false) {
  const [shared, setShared] = useState<SharedCode | null>(null);
  const [status, setStatus] = useState("");
  const [online, setOnline] = useState(false);
  const latest = useRef(active); latest.current = active;
  const key = active?.key;
  useEffect(() => {
    setShared(null); setOnline(false); setStatus("");
    if (!student || student.is_guest || (!teacher && !key)) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !apiKey) { setStatus("실시간 지도는 서버에 연결된 환경에서 사용할 수 있습니다."); return; }
    const client = createClient(url, apiKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    let disposed = false;
    let current: SharedCode | null = null;
    let connected = false;
    let lastStudent = 0;
    let channel: ReturnType<typeof client.channel> | null = null;
    const timers: ReturnType<typeof setInterval>[] = [];
    const send = (payload: object) => { if (connected && channel) void channel.send({ type: "broadcast", event: "code", payload }); };
    const announce = () => { if (current && !teacher) send({ type: "snapshot", key: current.key, title: current.title, epoch: current.epoch, startedAt: current.startedAt, update: pack(Y.encodeStateAsUpdate(current.doc)) }); };
    const makeShared = (meta: Omit<SharedCode, "doc" | "awareness">, update?: Uint8Array) => {
      current?.awareness.destroy(); current?.doc.destroy();
      const doc = new Y.Doc();
      if (update) Y.applyUpdate(doc, update, remoteOrigin);
      else doc.getText("code").insert(0, latest.current?.code ?? "");
      const awareness = new Awareness(doc);
      const next = { ...meta, doc, awareness }; current = next;
      doc.on("update", (bytes: Uint8Array, origin: unknown) => {
        if (origin !== remoteOrigin) send({ type: "update", epoch: next.epoch, update: pack(bytes) });
      });
      awareness.on("update", ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
        if (origin !== remoteOrigin) send({ type: "awareness", epoch: next.epoch, update: pack(encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed])) });
      });
      awareness.setLocalStateField("user", { name: teacher ? "선생님" : student.name, role: teacher ? "teacher" : "student", color: teacher ? "#d97706" : "#2563eb", colorLight: teacher ? "#fef3c7" : "#dbeafe" });
      setShared(next); return next;
    };
    const credentials = async () => {
      const response = await fetch("/api/live-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: teacher ? "teacher" : "student", studentId: student.id, studentNo: student.student_no, name: student.name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "실시간 연결을 인증하지 못했습니다.");
      return data as { token: string; topic: string };
    };
    void (async () => {
      try {
        setStatus("실시간 연결 중…");
        const auth = await credentials(); if (disposed) return;
        await client.realtime.setAuth(auth.token); if (disposed) return;
        channel = client.channel(auth.topic, { config: { private: true, broadcast: { ack: true } } });
        channel.on("broadcast", { event: "code" }, ({ payload: p }) => {
          if (disposed || !p || typeof p.type !== "string") return;
          try {
            if (p.type === "request" && !teacher) { announce(); return; }
            if (p.type === "snapshot" && teacher && typeof p.key === "string" && typeof p.epoch === "string" && typeof p.update === "string") {
              if (!Number.isFinite(p.startedAt) || (current && p.startedAt < current.startedAt)) return;
              lastStudent = Date.now(); setOnline(true); setStatus("학생 코드에 연결됨");
              if (current?.epoch !== p.epoch) makeShared({ key: p.key, title: String(p.title), epoch: p.epoch, startedAt: p.startedAt }, unpack(p.update));
              else if (current) Y.applyUpdate(current.doc, unpack(p.update), remoteOrigin);
            } else if (current && p.epoch === current.epoch && typeof p.update === "string") {
              if (p.type === "update") Y.applyUpdate(current.doc, unpack(p.update), remoteOrigin);
              if (p.type === "awareness") applyAwarenessUpdate(current.awareness, unpack(p.update), remoteOrigin);
            }
          } catch { setStatus("코드 동기화를 다시 시도하고 있습니다."); }
        });
        channel.subscribe(state => {
          connected = state === "SUBSCRIBED";
          if (disposed) return;
          if (connected) {
            if (!teacher && !current) makeShared({ key: key!, title: latest.current!.title, epoch: crypto.randomUUID(), startedAt: Date.now() });
            if (teacher) { setStatus("학생이 코드 편집기를 열기를 기다리는 중…"); send({ type: "request" }); }
            else { setStatus("실시간 지도 연결됨"); announce(); }
          } else {
            setOnline(false);
            setStatus(`실시간 채널 연결 실패 (${state}). Supabase 채널 권한과 JWT 설정을 확인해주세요.`);
          }
        });
        timers.push(setInterval(() => {
          if (teacher) {
            send({ type: "request" });
            if (connected && Date.now() - lastStudent > 10000) { setOnline(false); setStatus("학생이 코드 편집기를 열기를 기다리는 중…"); }
          } else announce();
          if (current) send({ type: "awareness", epoch: current.epoch, update: pack(encodeAwarenessUpdate(current.awareness, [current.doc.clientID])) });
          // Bidirectional repair also recovers a teacher edit whose broadcast was lost.
          if (teacher && current) send({ type: "update", epoch: current.epoch, update: pack(Y.encodeStateAsUpdate(current.doc)) });
        }, 3000));
        timers.push(setInterval(() => { void credentials().then(async auth => { if (!disposed) await client.realtime.setAuth(auth.token); }).catch(() => { connected = false; setOnline(false); setStatus("인증이 만료되었습니다. 화면을 다시 열어주세요."); void client.removeAllChannels(); }); }, 240000));
      } catch (error) { if (!disposed) setStatus(error instanceof Error ? error.message : "실시간 연결에 실패했습니다."); }
    })();
    return () => {
      disposed = true; timers.forEach(clearInterval);
      current?.awareness.destroy(); current?.doc.destroy();
      void client.removeAllChannels();
    };
  }, [student?.id, student?.student_no, student?.name, student?.is_guest, key, teacher]);
  const extension = useMemo(() => shared ? [yCollab(shared.doc.getText("code"), shared.awareness), keymap.of(yUndoManagerKeymap)] : null, [shared]);
  return { shared, extension, status, online };
}

export function LiveStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const live = useLiveCode(student, null, true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose); onCloseRef.current = onClose;
  const writableRef = useRef(false); writableRef.current = live.online;
  const guard = useMemo(() => EditorState.transactionFilter.of(transaction =>
    transaction.docChanged && !writableRef.current && !transaction.annotation(ySyncAnnotation) ? [] : transaction
  ), []);
  const undoGuard = useMemo(() => Prec.highest(keymap.of(yUndoManagerKeymap.map(binding => ({
    ...binding, run: view => writableRef.current ? binding.run!(view) : true
  })))), []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); previous?.focus(); };
  }, []);
  return <div className="modalBackdrop" onMouseDown={onClose}>
    <section ref={dialogRef} className="liveCodeModal" role="dialog" aria-modal="true" aria-labelledby="live-code-title" onMouseDown={event => event.stopPropagation()}>
      <header><div><h2 id="live-code-title">{student.student_no} {student.name} · 학생 화면 보기</h2><p role="status">{live.status}</p></div><button ref={closeRef} className="ghostButton" onClick={onClose}>닫기</button></header>
      {live.shared && <CodeMirror key={live.shared.epoch} value={live.shared.doc.getText("code").toString()} extensions={[python(), undoGuard, live.extension!, guard]} basicSetup={{ history: false }} readOnly={!live.online} editable={live.online} height="100%" />}
    </section>
  </div>;
}
