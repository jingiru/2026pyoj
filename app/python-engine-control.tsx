"use client";

import { selectPythonEngine, type PythonEnginePreference } from "@/lib/python-engine";

export function PythonEngineControl({ code, value, onChange, disabled }: {
  code: string;
  value: PythonEnginePreference;
  onChange: (value: PythonEnginePreference) => void;
  disabled: boolean;
}) {
  const engine = selectPythonEngine(code, { engine: value });
  return <label className="pythonEngineControl">
    <select aria-label="Python 실행 환경" value={value} disabled={disabled}
      onChange={event => onChange(event.target.value as PythonEnginePreference)}>
      <option value="auto">자동 선택</option>
      <option value="pyodide">확장 Python (NumPy 등)</option>
    </select>
    <span>{engine === "skulpt" ? "기본 Python · 빠른 실행" : "확장 Python"}</span>
  </label>;
}

export function PythonEngineLabel({ code, problemCode }: { code: string; problemCode: string }) {
  return <span className="pythonEngineLabel">{selectPythonEngine(code, { problemCode }) === "skulpt" ? "기본 Python" : "확장 Python"}</span>;
}
