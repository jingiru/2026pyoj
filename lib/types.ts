export type Problem = {
  id: string;
  bookId: string;
  order: number;
  title: string;
  statement: string;
  inputDescription: string;
  outputDescription: string;
  examples: TestCase[];
  testCases: TestCase[];
  showExample?: boolean;
  starterCode: string;
  hint: string;
  codeRequirements?: CodeRequirement[];
  isPublished?: boolean;
};

export type CodeRequirement =
  | { type: "print_arguments"; minCount: number }
  | { type: "operators"; values: Array<"+" | "-" | "*" | "/" | "//" | "%"> }
  | { type: "assigned_output" }
  | { type: "reassignment" }
  | { type: "for_range" }
  | { type: "indexing"; minCount: number }
  | { type: "slicing"; minCount: number }
  | { type: "functions"; names: Array<"sum" | "max" | "min" | "len" | "sorted"> }
  | { type: "sorted_reverse" };

export type ProblemBook = {
  id: string;
  order: number;
  title: string;
  description?: string;
  isPublished?: boolean;
};

export type TestCase = {
  input: string;
  output: string;
  isSample?: boolean;
};

export type Student = {
  id: string;
  student_no: string;
  name: string;
  created_at?: string;
};

export type Submission = {
  id?: string;
  student_id: string;
  problem_id: string;
  code: string;
  status: SubmissionStatus;
  passed_count: number;
  total_count: number;
  feedback: string;
  created_at?: string;
};

export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "code_requirement_failed";

export type SubmissionWithStudent = Submission & {
  students?: Pick<Student, "student_no" | "name"> | null;
};
