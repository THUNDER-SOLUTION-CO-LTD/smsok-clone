"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

type PillOption = {
  value: string;
  label: string;
};

export default function PillTabs({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PillOption[];
  className?: string;
  label?: string;
}) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      let nextIndex: number | null = null;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = options.length - 1;
      }

      if (nextIndex !== null) {
        onChange(options[nextIndex].value);
        tabsRef.current[nextIndex]?.focus();
      }
    },
    [value, options, onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex items-center gap-1 flex-wrap", className)}
    >
      {options.map((opt, index) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => { tabsRef.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
              isActive
                ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.2)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] border border-transparent",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
