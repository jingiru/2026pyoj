type RunResult = {
  output: string;
  error?: string;
};

export function runBeginnerPython(code: string, stdin: string): RunResult {
  const inputs = stdin.replace(/\r\n/g, "\n").split("\n");
  let inputIndex = 0;
  const variables = new Map<string, string | number>();
  const output: string[] = [];

  try {
    const lines = code
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.startsWith("#")) continue;

      const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (assignment) {
        variables.set(assignment[1], evaluateExpression(assignment[2], variables, readInput));
        continue;
      }

      const printCall = line.match(/^print\s*\((.*)\)$/);
      if (printCall) {
        output.push(String(evaluateExpression(printCall[1], variables, readInput)));
        continue;
      }

      return {
        output: output.join("\n"),
        error: "아직 실습 IDE는 print, input, 변수, int(), +, * 위주로 실행할 수 있어요."
      };
    }

    return { output: output.join("\n") || "출력 없음" };
  } catch (error) {
    return {
      output: output.join("\n"),
      error: error instanceof Error ? error.message : "코드를 실행하지 못했어요."
    };
  }

  function readInput() {
    const value = inputs[inputIndex] ?? "";
    inputIndex += 1;
    return value;
  }
}

function evaluateExpression(
  expression: string,
  variables: Map<string, string | number>,
  readInput: () => string
): string | number {
  let expr = expression.trim();

  if (/^input\s*\(\s*\)$/.test(expr)) return readInput();
  if (/^int\s*\(\s*input\s*\(\s*\)\s*\)$/.test(expr)) return Number(readInput());

  const intVariable = expr.match(/^int\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)$/);
  if (intVariable) return Number(variables.get(intVariable[1]) ?? 0);

  if (/^['"].*['"]$/.test(expr)) return expr.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
  if (variables.has(expr)) return variables.get(expr)!;

  const multiply = expr.match(/^(.+?)\s*\*\s*(.+)$/);
  if (multiply) {
    const left = evaluateExpression(multiply[1], variables, readInput);
    const right = evaluateExpression(multiply[2], variables, readInput);
    if (typeof left === "string" && typeof right === "number") return left.repeat(right);
    if (typeof left === "number" && typeof right === "string") return right.repeat(left);
    return Number(left) * Number(right);
  }

  const plus = expr.match(/^(.+?)\s*\+\s*(.+)$/);
  if (plus) {
    const left = evaluateExpression(plus[1], variables, readInput);
    const right = evaluateExpression(plus[2], variables, readInput);
    if (typeof left === "number" && typeof right === "number") return left + right;
    return `${left}${right}`;
  }

  throw new Error(`이 표현식은 아직 실행할 수 없어요: ${expression}`);
}
