import { pythonLanguage } from "@codemirror/lang-python";
import type { CodeRequirement } from "./types";

type ParsedNode = {
  name: string;
  from: number;
  to: number;
  parent?: ParsedNode;
  children: ParsedNode[];
};

type Assignment = {
  name: string;
  position: number;
  value: ParsedNode;
};

type CodeFacts = {
  printCalls: ParsedNode[];
  assignments: Assignment[];
  source: string;
};

export type CodeRequirementResult = {
  passed: boolean;
  feedback: string;
};

export function checkCodeRequirements(
  code: string,
  requirements: CodeRequirement[] | undefined
): CodeRequirementResult {
  if (!requirements || requirements.length === 0) return { passed: true, feedback: "" };

  const tree = buildTree(code);
  const facts = collectFacts(tree, code);

  for (const requirement of requirements) {
    const feedback = checkRequirement(requirement, facts);
    if (feedback) return { passed: false, feedback };
  }

  return { passed: true, feedback: "" };
}

function checkRequirement(requirement: CodeRequirement, facts: CodeFacts) {
  switch (requirement.type) {
    case "print_arguments": {
      const passed = facts.printCalls.some(
        (call) => directPrintArgumentCount(call, facts.source) >= requirement.minCount
      );
      return passed
        ? ""
        : `이 문제는 print() 안에 값을 ${requirement.minCount}개 이상 쉼표로 구분해 출력해야 해요.`;
    }
    case "operators": {
      const used = collectOutputFeatures(facts).operators;
      const missing = requirement.values.filter((operator) => !used.has(operator));
      return missing.length === 0
        ? ""
        : `출력값을 만드는 계산에 ${missing.map((value) => `\`${value}\``).join(", ")} 연산자를 사용해주세요.`;
    }
    case "assigned_output":
      return outputDependsOnAssignment(facts)
        ? ""
        : "값을 변수에 저장한 뒤, 그 변수를 사용해 출력해주세요.";
    case "reassignment":
      return outputDependsOnReassignment(facts)
        ? ""
        : "변수의 값을 순서대로 다시 저장한 뒤 최종 변수를 출력해주세요.";
    case "for_range":
      return hasPrintInsideForRange(facts)
        ? ""
        : "print()를 직접 반복해서 쓰지 말고, for문과 range()를 사용해 출력해주세요.";
    case "indexing": {
      const count = collectOutputFeatures(facts).indexing;
      return count >= requirement.minCount
        ? ""
        : `출력값을 가져올 때 인덱싱([])을 ${requirement.minCount}번 이상 사용해주세요. 인덱스는 양수와 음수 모두 사용할 수 있어요.`;
    }
    case "slicing": {
      const count = collectOutputFeatures(facts).slicing;
      return count >= requirement.minCount
        ? ""
        : `출력값을 만들 때 슬라이싱([시작:끝])을 ${requirement.minCount}번 이상 사용해주세요.`;
    }
    case "functions": {
      const used = collectOutputFeatures(facts).functions;
      const missing = requirement.names.filter((name) => !used.has(name));
      return missing.length === 0
        ? ""
        : `출력값을 구할 때 ${missing.map((name) => `${name}()`).join(", ")} 함수를 사용해주세요.`;
    }
    case "sorted_reverse":
      return collectOutputFeatures(facts).sortedReverse
        ? ""
        : "내림차순 정렬을 위해 sorted(..., reverse=True)를 사용해주세요.";
  }
}

function buildTree(source: string) {
  const syntaxTree = pythonLanguage.parser.parse(source);
  const cursor = syntaxTree.cursor();

  function visit(parent?: ParsedNode): ParsedNode {
    const node: ParsedNode = {
      name: cursor.name,
      from: cursor.from,
      to: cursor.to,
      parent,
      children: []
    };
    if (cursor.firstChild()) {
      do {
        node.children.push(visit(node));
      } while (cursor.nextSibling());
      cursor.parent();
    }
    return node;
  }

  return visit();
}

function collectFacts(tree: ParsedNode, source: string): CodeFacts {
  const printCalls: ParsedNode[] = [];
  const assignments: Assignment[] = [];

  walk(tree, (node) => {
    if (node.name === "CallExpression" && callName(node, source) === "print") {
      printCalls.push(node);
    }
    if (node.name === "AssignStatement") {
      const variable = node.children.find((child) => child.name === "VariableName");
      const assignIndex = node.children.findIndex((child) => child.name === "AssignOp");
      const value = node.children.slice(assignIndex + 1).find((child) => !isPunctuation(child.name));
      if (variable && value) {
        assignments.push({
          name: source.slice(variable.from, variable.to),
          position: node.from,
          value
        });
      }
    }
  });

  return { printCalls, assignments, source };
}

function collectOutputFeatures(facts: CodeFacts) {
  const features = {
    operators: new Set<string>(),
    functions: new Set<string>(),
    indexing: 0,
    slicing: 0,
    sortedReverse: false
  };

  for (const printCall of facts.printCalls) {
    const args = printCall.children.find((child) => child.name === "ArgList");
    if (!args) continue;
    collectFeatures(args, printCall.from, facts, features, new Set());
  }

  return features;
}

function collectFeatures(
  node: ParsedNode,
  before: number,
  facts: CodeFacts,
  features: {
    operators: Set<string>;
    functions: Set<string>;
    indexing: number;
    slicing: number;
    sortedReverse: boolean;
  },
  resolving: Set<string>
) {
  if (node.name === "ArithOp") {
    features.operators.add(facts.source.slice(node.from, node.to));
  }
  if (node.name === "MemberExpression") {
    if (node.children.some((child) => child.name === ":")) features.slicing += 1;
    else features.indexing += 1;
  }
  if (node.name === "CallExpression") {
    const name = callName(node, facts.source);
    if (name) features.functions.add(name);
    if (name === "sorted" && /\breverse\s*=\s*True\b/.test(facts.source.slice(node.from, node.to))) {
      features.sortedReverse = true;
    }
  }
  if (node.name === "VariableName" && node.parent?.name !== "CallExpression") {
    const name = facts.source.slice(node.from, node.to);
    if (!resolving.has(name)) {
      const assignment = latestAssignment(name, before, facts.assignments);
      if (assignment) {
        resolving.add(name);
        collectFeatures(assignment.value, assignment.position, facts, features, resolving);
        resolving.delete(name);
      }
    }
  }

  for (const child of node.children) {
    collectFeatures(child, before, facts, features, resolving);
  }
}

function outputDependsOnAssignment(facts: CodeFacts) {
  return facts.printCalls.some((printCall) => {
    const args = printCall.children.find((child) => child.name === "ArgList");
    if (!args) return false;
    let depends = false;
    walk(args, (node) => {
      if (node.name !== "VariableName" || node.parent?.name === "CallExpression") return;
      const name = facts.source.slice(node.from, node.to);
      depends ||= Boolean(latestAssignment(name, printCall.from, facts.assignments));
    });
    return depends;
  });
}

function outputDependsOnReassignment(facts: CodeFacts) {
  return facts.printCalls.some((printCall) => {
    const args = printCall.children.find((child) => child.name === "ArgList");
    if (!args) return false;
    let depends = false;
    walk(args, (node) => {
      if (node.name !== "VariableName" || node.parent?.name === "CallExpression") return;
      const name = facts.source.slice(node.from, node.to);
      const prior = facts.assignments.filter(
        (assignment) => assignment.name === name && assignment.position < printCall.from
      );
      depends ||= prior.length >= 2;
    });
    return depends;
  });
}

function hasPrintInsideForRange(facts: CodeFacts) {
  return facts.printCalls.some((printCall) => {
    let ancestor = printCall.parent;
    while (ancestor) {
      if (
        ancestor.name === "ForStatement" &&
        ancestor.children.some(
          (child) => child.name === "CallExpression" && callName(child, facts.source) === "range"
        )
      ) {
        return true;
      }
      ancestor = ancestor.parent;
    }
    return false;
  });
}

function directPrintArgumentCount(call: ParsedNode, source: string) {
  const args = call.children.find((child) => child.name === "ArgList");
  if (!args) return 0;
  const commas = args.children.filter(
    (child) => child.name === "," && source.slice(child.from, child.to) === ","
  ).length;
  return commas + 1;
}

function callName(node: ParsedNode, source: string) {
  const functionNode = node.children.find((child) => child.name === "VariableName");
  return functionNode ? source.slice(functionNode.from, functionNode.to) : "";
}

function latestAssignment(name: string, before: number, assignments: Assignment[]) {
  return assignments
    .filter((assignment) => assignment.name === name && assignment.position < before)
    .sort((left, right) => right.position - left.position)[0];
}

function walk(node: ParsedNode, visitor: (node: ParsedNode) => void) {
  visitor(node);
  for (const child of node.children) walk(child, visitor);
}

function isPunctuation(name: string) {
  return name === "AssignOp" || name === "," || name === "(" || name === ")";
}
