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
  starterCode: string;
  hint: string;
  isPublished?: boolean;
};

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
  status: "accepted" | "wrong_answer" | "runtime_error";
  passed_count: number;
  total_count: number;
  feedback: string;
  created_at?: string;
};

export type SubmissionWithStudent = Submission & {
  students?: Pick<Student, "student_no" | "name"> | null;
};
