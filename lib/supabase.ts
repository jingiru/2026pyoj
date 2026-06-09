import { createClient, type PostgrestError } from "@supabase/supabase-js";
import type { Student, Submission, SubmissionWithStudent } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const hasAnySupabaseEnvironment = Boolean(supabaseUrl || supabaseKey);
const hasValidSupabaseEnvironment = Boolean(
  supabaseUrl && supabaseKey && isValidSupabaseUrl(supabaseUrl) && supabaseKey.length >= 20
);

export const isSupabaseConfigured = hasValidSupabaseEnvironment;

export const supabase = hasValidSupabaseEnvironment
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;

export class DataAccessError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "DataAccessError";
  }
}

export function getDataErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DataAccessError) {
    const suffix = error.code ? ` (${error.code})` : "";
    return `${error.message}${suffix}`;
  }

  return fallback;
}

export async function findOrCreateStudent(studentNo: string, name: string) {
  const normalizedStudentNo = studentNo.trim();
  const normalizedName = name.trim();

  assertSupabaseEnvironment();
  if (!supabase) return createLocalStudent(normalizedStudentNo, normalizedName);

  const existing = await findStudent(normalizedStudentNo, normalizedName);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("students")
    .insert({ student_no: normalizedStudentNo, name: normalizedName })
    .select("id, student_no, name, created_at")
    .single();

  if (!error) return data as Student;

  // Another request may have inserted the same student between select and insert.
  if (error.code === "23505") {
    const concurrentlyCreated = await findStudent(normalizedStudentNo, normalizedName);
    if (concurrentlyCreated) return concurrentlyCreated;
  }

  throw toDataAccessError(error, "학생 정보를 저장하지 못했어요.");
}

export async function saveSubmission(submission: Submission) {
  assertSupabaseEnvironment();
  if (!supabase) {
    const stored = readLocalSubmissions();
    const next = {
      ...submission,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    localStorage.setItem("pyoj-submissions", JSON.stringify([next, ...stored]));
    return next;
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      student_id: submission.student_id,
      problem_id: submission.problem_id,
      code: submission.code,
      status: submission.status,
      passed_count: submission.passed_count,
      total_count: submission.total_count,
      feedback: submission.feedback
    })
    .select()
    .single();

  if (error) throw toDataAccessError(error, "제출 기록을 저장하지 못했어요.");
  return data as Submission;
}

export async function listSubmissions(): Promise<SubmissionWithStudent[]> {
  assertSupabaseEnvironment();
  if (!supabase) return readLocalSubmissions();

  const { data, error } = await supabase
    .from("submissions")
    .select("*, students(student_no, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw toDataAccessError(error, "제출 기록을 불러오지 못했어요.");
  return (data ?? []) as SubmissionWithStudent[];
}

async function findStudent(studentNo: string, name: string) {
  const { data, error } = await supabase!
    .from("students")
    .select("id, student_no, name, created_at")
    .eq("student_no", studentNo)
    .eq("name", name)
    .maybeSingle();

  if (error) throw toDataAccessError(error, "학생 정보를 조회하지 못했어요.");
  return data as Student | null;
}

function toDataAccessError(error: PostgrestError, fallback: string) {
  console.error("[Supabase]", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });

  const messages: Record<string, string> = {
    "42P01": "필요한 테이블이 없어요. Supabase SQL Editor에서 schema.sql을 실행해주세요.",
    "42501": "Supabase 테이블 접근 권한 또는 RLS 정책을 확인해주세요.",
    "42703": "테이블 컬럼 구성이 앱과 일치하지 않아요. schema.sql을 다시 확인해주세요.",
    PGRST116: "조건에 맞는 데이터가 여러 건이에요. students의 고유 제약조건을 확인해주세요."
  };

  return new DataAccessError(messages[error.code] ?? fallback, error.code, { cause: error });
}

function assertSupabaseEnvironment() {
  if (hasAnySupabaseEnvironment && !hasValidSupabaseEnvironment) {
    throw new DataAccessError(
      "Supabase 환경변수가 누락됐거나 형식이 잘못됐어요. URL과 publishable/anon key를 함께 확인해주세요.",
      "CONFIG"
    );
  }
}

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function createLocalStudent(studentNo: string, name: string): Student {
  const key = `pyoj-student-${studentNo}-${name}`;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored) as Student;

  const student = {
    id: crypto.randomUUID(),
    student_no: studentNo,
    name,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(student));
  return student;
}

function readLocalSubmissions(): SubmissionWithStudent[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem("pyoj-submissions") ?? "[]") as SubmissionWithStudent[];
  } catch {
    localStorage.removeItem("pyoj-submissions");
    return [];
  }
}
