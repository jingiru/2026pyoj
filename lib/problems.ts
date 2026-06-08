import type { Problem } from "./types";

export const problems: Problem[] = [
  {
    id: "print-int-01",
    order: 1,
    title: "정수 출력 01",
    unit: "출력",
    level: "start",
    statement: "1을 출력하세요.",
    inputDescription: "입력은 없습니다.",
    outputDescription: "1을 출력합니다.",
    examples: [{ input: "", output: "1" }],
    testCases: [{ input: "", output: "1" }],
    starterCode: "print(1)",
    hint: "print() 안에 출력하고 싶은 값을 넣으면 됩니다."
  },
  {
    id: "repeat-char-02",
    order: 2,
    title: "변수와 입력 02",
    unit: "입력과 변수",
    level: "practice",
    statement:
      "사용자로부터 어떤 문자를 입력 받아 10번 반복하여 출력하는 프로그램을 작성하세요.",
    inputDescription: "1개의 문자가 주어집니다.",
    outputDescription: "문자를 10번 반복하여 출력합니다.",
    examples: [{ input: "a", output: "aaaaaaaaaa" }],
    testCases: [
      { input: "b", output: "bbbbbbbbbb" },
      { input: "1", output: "1111111111" },
      { input: "*", output: "**********" },
      { input: "가", output: "가가가가가가가가가가" },
      { input: "x", output: "xxxxxxxxxx" }
    ],
    starterCode: "ch = input()\nprint(ch * 10)",
    hint: "문자열도 곱셈을 사용할 수 있어요. 예: 'a' * 3"
  },
  {
    id: "sum-two-03",
    order: 3,
    title: "덧셈 연습 03",
    unit: "자료형",
    level: "practice",
    statement: "두 정수를 입력 받아 합을 출력하는 프로그램을 작성하세요.",
    inputDescription: "첫 줄에 정수 a, 둘째 줄에 정수 b가 주어집니다.",
    outputDescription: "a와 b의 합을 출력합니다.",
    examples: [{ input: "2\n3", output: "5" }],
    testCases: [
      { input: "1\n4", output: "5" },
      { input: "10\n20", output: "30" },
      { input: "-3\n7", output: "4" },
      { input: "0\n0", output: "0" }
    ],
    starterCode: "a = int(input())\nb = int(input())\nprint(a + b)",
    hint: "input()으로 받은 값은 문자라서 int()로 정수로 바꿔야 합니다."
  },
  {
    id: "even-odd-04",
    order: 4,
    title: "짝수 홀수 04",
    unit: "조건문",
    level: "challenge",
    statement: "정수 하나를 입력 받아 짝수면 even, 홀수면 odd를 출력하세요.",
    inputDescription: "정수 1개가 주어집니다.",
    outputDescription: "짝수는 even, 홀수는 odd를 출력합니다.",
    examples: [{ input: "8", output: "even" }],
    testCases: [
      { input: "2", output: "even" },
      { input: "9", output: "odd" },
      { input: "0", output: "even" },
      { input: "-5", output: "odd" }
    ],
    starterCode: "n = int(input())\nif n % 2 == 0:\n    print('even')\nelse:\n    print('odd')",
    hint: "% 연산자는 나머지를 구합니다."
  }
];

export function getProblem(problemId: string) {
  return problems.find((problem) => problem.id === problemId) ?? problems[0];
}
