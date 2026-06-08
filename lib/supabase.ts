import { createClient } from "@supabase/supabase-js";
import type { Student, Submission } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export async function findOrCreateStudent(studentNo: string, name: string) {
  if (!supabase) return createLocalStudent(studentNo, name);

  const normalizedName = name.trim();
  const { data: existing, error: selectError } = await supabase
    .from("students")
    .select("*")
    .eq("student_no", studentNo)
    .eq("name", normalizedName)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as Student;

  const { data, error } = await supabase
    .from("students")
    .insert({ student_no: studentNo, name: normalizedName })
    .select()
    .single();

  if (error) throw error;
  return data as Student;
}

export async function saveSubmission(submission: Submission) {
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

  if (error) throw error;
  return data as Submission;
}

export async function listSubmissions() {
  if (!supabase) return readLocalSubmissions();

  const { data, error } = await supabase
    .from("submissions")
    .select("*, students(student_no, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

function createLocalStudent(studentNo: string, name: string): Student {
  const key = `pyoj-student-${studentNo}-${name.trim()}`;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored) as Student;

  const student = {
    id: crypto.randomUUID(),
    student_no: studentNo,
    name: name.trim(),
    created_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(student));
  return student;
}

function readLocalSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("pyoj-submissions") ?? "[]");
}
