"use client";

import { useCallback, useEffect, useState } from "react";

type Op = "+" | "-" | "×" | "÷";

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

function format(value: string): string {
  if (value === "Error") return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return "Error";
  // Keep what the user typed while typing (e.g. trailing "." or "0").
  if (value.length <= 12) return value;
  return String(Number(n.toPrecision(12)));
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  // True right after an operator or "=", so the next digit starts a new number.
  const [freshEntry, setFreshEntry] = useState(true);

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (freshEntry || prev === "Error") return digit;
        if (prev === "0") return digit;
        return prev.length < 15 ? prev + digit : prev;
      });
      setFreshEntry(false);
    },
    [freshEntry],
  );

  const inputDot = useCallback(() => {
    setDisplay((prev) => {
      if (freshEntry || prev === "Error") return "0.";
      return prev.includes(".") ? prev : prev + ".";
    });
    setFreshEntry(false);
  }, [freshEntry]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setAccumulator(null);
    setPendingOp(null);
    setFreshEntry(true);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((prev) =>
      prev === "0" || prev === "Error"
        ? prev
        : prev.startsWith("-")
          ? prev.slice(1)
          : "-" + prev,
    );
  }, []);

  const percent = useCallback(() => {
    setDisplay((prev) => (prev === "Error" ? prev : String(Number(prev) / 100)));
    setFreshEntry(true);
  }, []);

  const chooseOp = useCallback(
    (op: Op) => {
      const current = Number(display);
      if (display === "Error" || !Number.isFinite(current)) return;

      if (accumulator !== null && pendingOp !== null && !freshEntry) {
        const result = compute(accumulator, current, pendingOp);
        if (!Number.isFinite(result)) {
          setDisplay("Error");
          setAccumulator(null);
          setPendingOp(null);
          setFreshEntry(true);
          return;
        }
        setAccumulator(result);
        setDisplay(format(String(result)));
      } else {
        setAccumulator(current);
      }
      setPendingOp(op);
      setFreshEntry(true);
    },
    [accumulator, display, freshEntry, pendingOp],
  );

  const equals = useCallback(() => {
    if (accumulator === null || pendingOp === null) return;
    const current = Number(display);
    const result = compute(accumulator, current, pendingOp);
    setDisplay(Number.isFinite(result) ? format(String(result)) : "Error");
    setAccumulator(null);
    setPendingOp(null);
    setFreshEntry(true);
  }, [accumulator, display, pendingOp]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (key >= "0" && key <= "9") inputDigit(key);
      else if (key === "." || key === ",") inputDot();
      else if (key === "+") chooseOp("+");
      else if (key === "-") chooseOp("-");
      else if (key === "*") chooseOp("×");
      else if (key === "/") { e.preventDefault(); chooseOp("÷"); }
      else if (key === "%") percent();
      else if (key === "Enter" || key === "=") { e.preventDefault(); equals(); }
      else if (key === "Escape") clearAll();
      else if (key === "Backspace") {
        setDisplay((prev) =>
          prev === "Error" || prev.length <= 1 ? "0" : prev.slice(0, -1),
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseOp, clearAll, equals, inputDigit, inputDot, percent]);

  const expression =
    accumulator !== null && pendingOp !== null
      ? `${format(String(accumulator))} ${pendingOp}`
      : "";

  return (
    <main className="calculator">
      <div className="display">
        <div className="expression" data-testid="expression">
          {expression}
        </div>
        <div className="value" data-testid="display">
          {display}
        </div>
      </div>

      <div className="keys">
        <button className="function" onClick={clearAll}>AC</button>
        <button className="function" onClick={toggleSign}>+/−</button>
        <button className="function" onClick={percent}>%</button>
        <button className="operator" onClick={() => chooseOp("÷")}>÷</button>

        <button onClick={() => inputDigit("7")}>7</button>
        <button onClick={() => inputDigit("8")}>8</button>
        <button onClick={() => inputDigit("9")}>9</button>
        <button className="operator" onClick={() => chooseOp("×")}>×</button>

        <button onClick={() => inputDigit("4")}>4</button>
        <button onClick={() => inputDigit("5")}>5</button>
        <button onClick={() => inputDigit("6")}>6</button>
        <button className="operator" onClick={() => chooseOp("-")}>−</button>

        <button onClick={() => inputDigit("1")}>1</button>
        <button onClick={() => inputDigit("2")}>2</button>
        <button onClick={() => inputDigit("3")}>3</button>
        <button className="operator" onClick={() => chooseOp("+")}>+</button>

        <button className="span-two" onClick={() => inputDigit("0")}>0</button>
        <button onClick={inputDot}>.</button>
        <button className="operator" onClick={equals}>=</button>
      </div>
    </main>
  );
}
