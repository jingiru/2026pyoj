export type ImportedTestCase = {
  input: string;
  output: string;
  isSample: boolean;
};

export type ImportedProblem = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookOrder: number;
  order: number;
  title: string;
  statement: string;
  inputDescription: string;
  outputDescription: string;
  hint: string;
  starterCode: string;
  solutionCode: string;
  testCases: ImportedTestCase[];
};

export type ProblemImportResult = {
  total: number;
  inserted: number;
  updated: number;
  books: number;
  testCases: number;
  solutions: number;
  verifiedProblems: number;
  verifiedTestCases: number;
  verifiedSolutions: number;
  warnings: string[];
};
