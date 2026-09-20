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
  keywords: Set<string>;
  source: string;
  tree: ParsedNode;
};

export type CodeRequirementResult = {
  passed: boolean;
  feedback: string;
};

export function checkCodeRequirements(
  code: string,
  requirements: CodeRequirement[] | undefined
): CodeRequirementResult {
  if (!requirements || requirements.length === 0) {
    return { passed: true, feedback: "" };
  }

  const tree = buildTree(code);
  const facts = collectFacts(tree, code);

  for (const requirement of requirements) {
    const feedback = checkRequirement(requirement, facts);

    if (feedback) {
      return {
        passed: false,
        feedback
      };
    }
  }

  return {
    passed: true,
    feedback: ""
  };
}

function checkRequirement(
  requirement: CodeRequirement,
  facts: CodeFacts
) {
  switch (requirement.type) {
    case "print_arguments": {
      const passed = facts.printCalls.some(
        (call) =>
          directPrintArgumentCount(call, facts.source) >=
          requirement.minCount
      );

      return passed
        ? ""
        : `이 문제는 print() 안에 값을 ${requirement.minCount}개 이상 쉼표로 구분해 출력해야 해요.`;
    }

    case "operators": {
      const used = collectOutputFeatures(facts).operators;

      const missing = requirement.values.filter(
        (operator) => !used.has(operator)
      );

      return missing.length === 0
        ? ""
        : `출력값을 만드는 계산에 ${missing
            .map((value) => `\`${value}\``)
            .join(", ")} 연산자를 사용해주세요.`;
    }

    case "forbidden_keywords": {
      const used = requirement.values.filter((keyword) =>
        facts.keywords.has(keyword)
      );

      return used.length === 0
        ? ""
        : `${used
            .map((keyword) => `\`${keyword}\``)
            .join(", ")}를 사용하지 말고 문제에서 지정한 구조로 풀어주세요.`;
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

    case "for_list":
      return facts.printCalls.some((call) => hasAncestor(call, (node) => {
        if (node.name !== "ForStatement") return false;
        const iterable = node.children.find((child, index) => index > node.children.findIndex((item) => item.name === "in") && child.name !== "Body");
        if (!iterable) return false;
        if (iterable.name === "ArrayExpression") return true;
        if (iterable.name === "VariableName") {
          return latestAssignment(facts.source.slice(iterable.from, iterable.to), node.from, facts.assignments)?.value.name === "ArrayExpression";
        }
        return callName(iterable, facts.source) === "range" && collectOutputFeatures(facts).indexing > 0;
      })) ? "" : "리스트의 값을 for문으로 반복하여 출력해주세요. 리스트 직접 순회 또는 range()와 리스트 인덱싱을 사용할 수 있어요.";

    case "while_loop":
      return facts.printCalls.length > 0 && facts.printCalls.every((call) => {
        if (hasAncestor(call, (node) => node.name === "WhileStatement")) return true;
        let depends = false;
        const args = call.children.find((node) => node.name === "ArgList");
        if (args) walk(args, (node) => {
          if (node.name !== "VariableName") return;
          const assignment = latestAssignment(facts.source.slice(node.from, node.to), call.from, facts.assignments);
          if (assignment) depends ||= hasAncestor(assignment.value, (parent) => parent.name === "WhileStatement");
        });
        return depends;
      }) ? "" : "이 문제는 while문으로 출력하거나, while문에서 변경한 변수를 출력해야 해요.";

    case "for_if":
      return hasNestedStatement(facts.tree, "ForStatement", "IfStatement")
        ? ""
        : "for문 안에 if문을 넣어 문제를 해결해주세요.";

    case "while_true_if_break":
      return hasWhileTrueIfBreak(facts.tree, facts.source)
        ? ""
        : "반드시 while True 안에 if문을 넣고, if문 안에서 break로 반복을 끝내주세요.";

    case "forbidden_augmented_assignment":
      return ["+=", "-=", "*=", "/=", "//=", "%="].some((operator) =>
        facts.source.includes(operator)
      )
        ? "`+=`처럼 줄여 쓰지 말고 `n = n + 1`과 같은 모양으로 작성해주세요."
        : "";

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

      const missing = requirement.names.filter(
        (name) => !used.has(name)
      );

      return missing.length === 0
        ? ""
        : `출력값을 구할 때 ${missing
            .map((name) => `${name}()`)
            .join(", ")} 함수를 사용해주세요.`;
    }

    case "sorted_reverse":
      return collectOutputFeatures(facts).sortedReverse
        ? ""
        : "내림차순 정렬을 위해 sorted(..., reverse=True)를 사용해주세요.";
  }
}

/**
 * Python 코드를 CodeMirror의 Python parser로 분석하여
 * 우리가 사용하기 쉬운 트리 형태로 변환
 */
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

/**
 * 코드에서
 * - print()
 * - 변수 대입
 * 정보를 수집
 */
function collectFacts(
  tree: ParsedNode,
  source: string
): CodeFacts {
  const printCalls: ParsedNode[] = [];
  const assignments: Assignment[] = [];
  const keywords = new Set<string>();

  walk(tree, (node) => {
    if (["if", "for", "while"].includes(node.name)) {
      keywords.add(node.name);
    }

    if (
      node.name === "CallExpression" &&
      callName(node, source) === "print"
    ) {
      printCalls.push(node);
    }

    if (node.name === "AssignStatement" || node.name === "UpdateStatement") {
      const variable = node.children.find(
        (child) => child.name === "VariableName"
      );

      const assignIndex = node.children.findIndex(
        (child) => child.name === "AssignOp" || child.name === "UpdateOp"
      );

      const value = node.children
        .slice(assignIndex + 1)
        .find((child) => !isPunctuation(child.name));

      if (variable && value) {
        assignments.push({
          name: source.slice(variable.from, variable.to),
          position: node.from,
          value
        });
      }
    }
  });

  return {
    printCalls,
    assignments,
    keywords,
    source,
    tree
  };
}

function hasNestedStatement(tree: ParsedNode, outerName: string, innerName: string) {
  let found = false;
  walk(tree, (outer) => {
    if (outer.name !== outerName) return;
    walk(outer, (inner) => {
      if (inner !== outer && inner.name === innerName) found = true;
    });
  });
  return found;
}

function hasWhileTrueIfBreak(tree: ParsedNode, source: string) {
  let found = false;
  walk(tree, (whileNode) => {
    if (whileNode.name !== "WhileStatement" || !isWhileTrue(whileNode, source)) return;
    walk(whileNode, (ifNode) => {
      if (ifNode.name !== "IfStatement") return;
      walk(ifNode, (node) => {
        if (node.name === "BreakStatement" && nearestAncestor(node, "WhileStatement") === whileNode) {
          found = true;
        }
      });
    });
  });
  return found;
}

/**
 * Beginner-level preflight for the 11-2 curriculum. It deliberately checks only
 * constant-true loops and catches the common cases that would otherwise lock the
 * browser: no break, a break that cannot be reached, or a fixed condition value.
 * Runtime limits remain the final safety net because termination is undecidable
 * for arbitrary Python programs.
 */
export function hasPotentialInfiniteLoop(code: string) {
  const tree = buildTree(code);
  let risky = false;

  walk(tree, (whileNode) => {
    if (risky || whileNode.name !== "WhileStatement" || !isWhileTrue(whileNode, code)) return;
    const breaks: ParsedNode[] = [];
    walk(whileNode, (node) => {
      if (node.name === "BreakStatement" && nearestAncestor(node, "WhileStatement") === whileNode) {
        breaks.push(node);
      }
    });
    if (breaks.length === 0) {
      risky = true;
      return;
    }

    const loopSource = code.slice(whileNode.from, whileNode.to);
    const hasChangingInput = /\binput\s*\(/.test(loopSource);
    const hasUpdatedCondition = breaks.some((breakNode) => {
      const ifNode = nearestAncestor(breakNode, "IfStatement");
      if (!ifNode) return true;
      const condition = ifNode.children.find((child) => child.name !== "if" && child.name !== "Body");
      if (!condition) return false;
      const conditionSource = code.slice(condition.from, condition.to).trim();
      if (conditionSource === "True") return true;
      if (conditionSource === "False") return false;
      const names = new Set<string>();
      walk(condition, (node) => {
        if (node.name === "VariableName") names.add(code.slice(node.from, node.to));
      });
      return [...names].some((name) => variableCanReachBreak(name, conditionSource, loopSource));
    });
    if (!hasChangingInput && !hasUpdatedCondition) risky = true;
  });

  return risky;
}

function isWhileTrue(node: ParsedNode, source: string) {
  const condition = node.children.find((child) => child.name !== "while" && child.name !== "Body");
  if (!condition) return false;
  const value = source.slice(condition.from, condition.to).trim();
  return value === "True" || value === "1";
}

function nearestAncestor(node: ParsedNode, name: string) {
  let current = node.parent;
  while (current) {
    if (current.name === name) return current;
    current = current.parent;
  }
  return undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function variableCanReachBreak(name: string, conditionSource: string, loopSource: string) {
  const escapedName = escapeRegExp(name);
  const assignmentPattern = new RegExp(`\\b${escapedName}\\s*=(?!=)\\s*([^\\n#]+)`, "g");
  const assignments = [...loopSource.matchAll(assignmentPattern)].map((match) => match[1].trim());

  return assignments.some((value) => {
    if (/\binput\s*\(/.test(value)) return true;
    if (value === name) return false;

    const selfUpdate = value.match(new RegExp(`^${escapedName}\\s*([+-])\\s*(-?\\d+(?:\\.\\d+)?)$`));
    if (selfUpdate) return Number(selfUpdate[2]) !== 0;

    const fixedValue = value.match(/^(?:-?\d+(?:\.\d+)?|True|False|'[^']*'|"[^"]*")$/)?.[0];
    if (fixedValue) {
      const equalsFixed = new RegExp(
        `^(?:${escapedName}\\s*==\\s*${escapeRegExp(fixedValue)}|${escapeRegExp(fixedValue)}\\s*==\\s*${escapedName})$`
      );
      return equalsFixed.test(conditionSource);
    }

    return true;
  });
}

function hasAncestor(node: ParsedNode, predicate: (node: ParsedNode) => boolean) {
  let parent = node.parent;
  while (parent) {
    if (predicate(parent)) return true;
    parent = parent.parent;
  }
  return false;
}

/**
 * 실제 출력값을 만드는 데 사용된 기능을 수집
 *
 * 예:
 *
 * a = 4
 * a = a * 2
 * a = a + 3
 * print(a)
 *
 * print(a)에서 시작하여
 *
 * a = a + 3
 * ↓
 * a = a * 2
 * ↓
 * a = 4
 *
 * 순서로 역추적함.
 */
function collectOutputFeatures(facts: CodeFacts) {
  const features = {
    operators: new Set<string>(),
    functions: new Set<string>(),
    indexing: 0,
    slicing: 0,
    sortedReverse: false
  };

  for (const printCall of facts.printCalls) {
    const args = printCall.children.find(
      (child) => child.name === "ArgList"
    );

    if (!args) continue;

    collectFeatures(
      args,
      printCall.from,
      facts,
      features,
      new Set<string>()
    );
  }

  return features;
}

/**
 * 출력값이 만들어지는 과정을 재귀적으로 추적
 */
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
  /**
   * 산술 연산자
   * + - * / // % ** 등
   */
  if (node.name === "ArithOp") {
    features.operators.add(
      facts.source.slice(node.from, node.to)
    );
  }

  /**
   * 인덱싱 / 슬라이싱
   */
  if (node.name === "MemberExpression") {
    if (
      node.children.some(
        (child) => child.name === ":"
      )
    ) {
      features.slicing += 1;
    } else {
      features.indexing += 1;
    }
  }

  /**
   * 함수 사용
   */
  if (node.name === "CallExpression") {
    const name = callName(node, facts.source);

    if (name) {
      features.functions.add(name);
    }

    if (
      name === "sorted" &&
      /\breverse\s*=\s*True\b/.test(
        facts.source.slice(node.from, node.to)
      )
    ) {
      features.sortedReverse = true;
    }
  }

  /**
   * 변수라면 해당 변수가 가장 최근에
   * 어떤 값으로 저장되었는지 역추적
   *
   * 핵심 수정 부분:
   *
   * 기존에는 resolving에 변수 이름만 저장했기 때문에
   *
   * a = a + 3
   *
   * 에서 오른쪽 a를 다시 추적하지 못했음.
   *
   * 이제는
   *
   * 변수명 + 대입 위치
   *
   * 를 key로 사용함.
   *
   * 예:
   * a@10
   * a@20
   *
   * 서로 다른 a의 대입문으로 판단하므로
   * 이전 대입까지 계속 역추적 가능.
   */
  if (
    node.name === "VariableName" &&
    node.parent?.name !== "CallExpression"
  ) {
    const name = facts.source.slice(
      node.from,
      node.to
    );

    const assignment = latestAssignment(
      name,
      before,
      facts.assignments
    );

    if (assignment) {
      const resolvingKey =
        `${name}@${assignment.position}`;

      if (!resolving.has(resolvingKey)) {
        resolving.add(resolvingKey);

        collectFeatures(
          assignment.value,
          assignment.position,
          facts,
          features,
          resolving
        );

        resolving.delete(resolvingKey);
      }
    }
  }

  /**
   * 현재 노드의 자식들도 계속 검사
   */
  for (const child of node.children) {
    collectFeatures(
      child,
      before,
      facts,
      features,
      resolving
    );
  }
}

/**
 * 출력값이 변수 대입 결과에 의존하는지 검사
 *
 * 예:
 *
 * a = 10
 * print(a)
 *
 * → true
 */
function outputDependsOnAssignment(
  facts: CodeFacts
) {
  return facts.printCalls.some((printCall) => {
    const args = printCall.children.find(
      (child) => child.name === "ArgList"
    );

    if (!args) return false;

    let depends = false;

    walk(args, (node) => {
      if (
        node.name !== "VariableName" ||
        node.parent?.name === "CallExpression"
      ) {
        return;
      }

      const name = facts.source.slice(
        node.from,
        node.to
      );

      depends ||= Boolean(
        latestAssignment(
          name,
          printCall.from,
          facts.assignments
        )
      );
    });

    return depends;
  });
}

/**
 * 변수 재할당 사용 여부 검사
 *
 * 최초 대입:
 *
 * a = 4
 *
 * 재할당:
 *
 * a = a * 2
 *
 * 따라서 print() 이전에 같은 변수에
 * 대입이 최소 2번 있으면
 *
 * "재할당 1번 이상"
 *
 * 으로 판단.
 */
function outputDependsOnReassignment(
  facts: CodeFacts
) {
  return facts.printCalls.some((printCall) => {
    const args = printCall.children.find(
      (child) => child.name === "ArgList"
    );

    if (!args) return false;

    let depends = false;

    walk(args, (node) => {
      if (
        node.name !== "VariableName" ||
        node.parent?.name === "CallExpression"
      ) {
        return;
      }

      const name = facts.source.slice(
        node.from,
        node.to
      );

      const prior =
        facts.assignments.filter(
          (assignment) =>
            assignment.name === name &&
            assignment.position < printCall.from
        );

      /**
       * 최초 대입 1회
       * +
       * 재할당 최소 1회
       *
       * = 총 대입 횟수 2회 이상
       */
      depends ||= prior.length >= 2;
    });

    return depends;
  });
}

/**
 * for range() 내부에서 print()를 사용하는지 검사
 */
function hasPrintInsideForRange(
  facts: CodeFacts
) {
  return facts.printCalls.some((printCall) => {
    let ancestor = printCall.parent;

    while (ancestor) {
      if (
        ancestor.name === "ForStatement" &&
        ancestor.children.some(
          (child) =>
            child.name === "CallExpression" &&
            callName(
              child,
              facts.source
            ) === "range"
        )
      ) {
        return true;
      }

      ancestor = ancestor.parent;
    }

    return false;
  });
}

/**
 * print(a, b, c)
 *
 * → 인수 3개
 */
function directPrintArgumentCount(
  call: ParsedNode,
  source: string
) {
  const args = call.children.find(
    (child) => child.name === "ArgList"
  );

  if (!args) return 0;

  const commas = args.children.filter(
    (child) =>
      child.name === "," &&
      source.slice(child.from, child.to) === ","
  ).length;

  return commas + 1;
}

/**
 * 함수 호출 이름 얻기
 *
 * print(...)
 * → print
 *
 * range(...)
 * → range
 */
function callName(
  node: ParsedNode,
  source: string
) {
  const functionNode = node.children.find(
    (child) => child.name === "VariableName"
  );

  return functionNode
    ? source.slice(
        functionNode.from,
        functionNode.to
      )
    : "";
}

/**
 * 특정 위치 이전에 실행된
 * 가장 최근 변수 대입을 찾음
 */
function latestAssignment(
  name: string,
  before: number,
  assignments: Assignment[]
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.name === name &&
        assignment.position < before
    )
    .sort(
      (left, right) =>
        right.position - left.position
    )[0];
}

/**
 * 트리 전체 순회
 */
function walk(
  node: ParsedNode,
  visitor: (node: ParsedNode) => void
) {
  visitor(node);

  for (const child of node.children) {
    walk(child, visitor);
  }
}

/**
 * 대입문의 실제 값이 아닌 기호 제외
 */
function isPunctuation(name: string) {
  return (
    name === "AssignOp" ||
    name === "," ||
    name === "(" ||
    name === ")"
  );
}
