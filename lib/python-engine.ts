import { pythonLanguage } from "@codemirror/lang-python";
import type { SyntaxNode } from "@lezer/common";

export type PythonEngine = "skulpt" | "pyodide";
export type PythonEnginePreference = "auto" | PythonEngine;
export type EngineOptions = { engine?: PythonEnginePreference; problemCode?: string };

// A deliberately small fast path. Unknown modules use CPython before any code
// runs. This is a routing policy, not a claim to detect all Python incompatibility.
const FAST_MODULES = new Set(["math", "random", "time"]);
const EXTENDED_NAMES = new Set([
  "eval", "exec", "compile", "__import__", "__builtins__", "globals", "locals",
  "vars", "dir", "getattr", "setattr", "delattr", "open", "memoryview", "bytearray",
  "bytes", "help", "breakpoint"
]);
const EXTENDED_SYNTAX = new Set([
  "MatchStatement", "AwaitExpression", "AsyncStatement", "TypeDefinition",
  "NamedExpression", "TypeAliasStatement"
]);
const DIRECTIVE = /^#\s*pyoj:\s*engine\s*=\s*(skulpt|pyodide)\s*$/i;

export function getProblemEngine(source: string): PythonEnginePreference {
  let engine: PythonEnginePreference = "auto";
  pythonLanguage.parser.parse(source).iterate({ enter(node) {
    if (node.name !== "Comment") return;
    const match = source.slice(node.from, node.to).match(DIRECTIVE);
    if (match) engine = match[1].toLowerCase() as PythonEngine;
  } });
  return engine;
}

/** Store the problem policy in the existing starter code, including snapshots. */
export function withProblemEngine(source: string, engine: PythonEnginePreference): string {
  const ranges: Array<[number, number]> = [];
  pythonLanguage.parser.parse(source).iterate({ enter(node) {
    if (node.name === "Comment" && DIRECTIVE.test(source.slice(node.from, node.to))) {
      const lineStart = source.lastIndexOf("\n", node.from - 1) + 1;
      const standalone = source.slice(lineStart, node.from).trim() === "";
      const lineEnd = source[node.to] === "\r" ? node.to + 2 : source[node.to] === "\n" ? node.to + 1 : node.to;
      ranges.push([standalone ? lineStart : node.from, standalone ? lineEnd : node.to]);
    }
  } });
  let code = source;
  for (const [from, to] of ranges.reverse()) code = code.slice(0, from) + code.slice(to);
  return engine === "auto" ? code : `# pyoj: engine=${engine}\n${code}`;
}

function importModules(node: SyntaxNode, code: string): string[] {
  const tokens: string[] = [];
  function leaves(item: SyntaxNode) {
    if (item.name === "Comment") return;
    if (!item.firstChild) { tokens.push(code.slice(item.from, item.to)); return; }
    for (let child: SyntaxNode | null = item.firstChild; child; child = child.nextSibling) leaves(child);
  }
  leaves(node);
  if (tokens[0] === "from") return [tokens.slice(1, tokens.indexOf("import")).join("").split(".")[0]];
  const modules: string[] = [];
  let needsModule = true;
  for (const token of tokens.slice(1)) {
    if (token === ",") needsModule = true;
    else if (needsModule) { modules.push(token); needsModule = false; }
  }
  return modules;
}

export function selectPythonEngine(code: string, options: EngineOptions = {}): PythonEngine {
  const fixed = getProblemEngine(options.problemCode ?? "");
  if (fixed !== "auto") return fixed;
  if (options.engine && options.engine !== "auto") return options.engine;
  const explicit = getProblemEngine(code);
  if (explicit !== "auto") return explicit;
  let extended = false;
  pythonLanguage.parser.parse(code).iterate({ enter(node) {
    if (node.type.isError || EXTENDED_SYNTAX.has(node.name) || node.name === "async" || node.name === ":=") extended = true;
    if (node.name === "VariableName" && EXTENDED_NAMES.has(code.slice(node.from, node.to))) extended = true;
    if (node.name === "ImportStatement" && importModules(node.node, code).some(name => !FAST_MODULES.has(name))) extended = true;
  } });
  return extended ? "pyodide" : "skulpt";
}
