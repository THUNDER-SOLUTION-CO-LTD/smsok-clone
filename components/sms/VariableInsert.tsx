"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ChevronDown } from "lucide-react";

export const SMS_VARIABLES = [
  { label: "ชื่อ", value: "{{name}}", description: "ชื่อผู้รับ" },
  { label: "รหัส", value: "{{code}}", description: "รหัส OTP / ยืนยัน" },
  { label: "วันที่", value: "{{date}}", description: "วันที่ปัจจุบัน" },
  { label: "จำนวนเงิน", value: "{{amount}}", description: "จำนวนเงิน" },
  { label: "เบอร์โทร", value: "{{phone}}", description: "เบอร์โทรผู้รับ" },
  { label: "Order ID", value: "{{order_id}}", description: "เลข Order" },
];

export function VariableInsertButtons({
  onInsert,
  compact = false,
}: {
  onInsert: (variable: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1.5">
        แทรกตัวแปร
      </label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {SMS_VARIABLES.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => onInsert(value)}
            className={`rounded-lg font-mono bg-[rgba(var(--accent-rgb),0.06)] text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.12)] border border-[rgba(var(--accent-rgb),0.1)] transition-all flex items-center gap-1 ${
              compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"
            }`}
          >
            <Plus className={compact ? "w-2 h-2" : "w-2.5 h-2.5"} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useVariableAutocomplete(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onInsert: (variable: string) => void,
) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterText, setFilterText] = useState("");

  const filteredVars = SMS_VARIABLES.filter(
    (v) =>
      v.label.toLowerCase().includes(filterText.toLowerCase()) ||
      v.value.toLowerCase().includes(filterText.toLowerCase()),
  );

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);

    const match = textBefore.match(/\{\{(\w*)$/);
    if (match) {
      setFilterText(match[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);

      const rect = textarea.getBoundingClientRect();
      const lineHeight = 20;
      const lines = textBefore.split("\n");
      const currentLineNum = lines.length - 1;
      setSuggestionPos({
        top: rect.top + (currentLineNum + 1) * lineHeight + 4,
        left: rect.left + 16,
      });
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions || filteredVars.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredVars.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredVars.length) % filteredVars.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredVars[selectedIndex];
        if (selected) {
          onInsert(selected.value);
          setShowSuggestions(false);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, filteredVars, selectedIndex, onInsert],
  );

  const closeSuggestions = useCallback(() => setShowSuggestions(false), []);

  return {
    showSuggestions,
    suggestionPos,
    selectedIndex,
    filteredVars,
    handleInput,
    handleKeyDown,
    closeSuggestions,
    setSelectedIndex,
  };
}

export function VariableSuggestionDropdown({
  show,
  position,
  variables,
  selectedIndex,
  onSelect,
  onHover,
}: {
  show: boolean;
  position: { top: number; left: number };
  variables: typeof SMS_VARIABLES;
  selectedIndex: number;
  onSelect: (variable: string) => void;
  onHover: (index: number) => void;
}) {
  if (!show || variables.length === 0) return null;

  return (
    <div
      className="fixed z-50 w-[200px] max-h-[180px] overflow-y-auto rounded-lg border shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      {variables.map((v, i) => (
        <button
          key={v.value}
          type="button"
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(v.value)}
          className={`w-full text-left px-3 py-2 text-[12px] flex items-center justify-between transition-colors ${
            i === selectedIndex
              ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.02)]"
          }`}
        >
          <span className="font-medium">{v.label}</span>
          <span className="font-mono text-[10px] opacity-60">{v.value}</span>
        </button>
      ))}
    </div>
  );
}
