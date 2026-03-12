"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type AccordionItem = {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  content: ReactNode;
  alwaysOpen?: boolean;
};

export default function SettingsAccordion({
  items,
}: {
  items: AccordionItem[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-[2px]">
      {items.map((item) => {
        const isOpen = item.alwaysOpen || openId === item.id;

        if (item.alwaysOpen) {
          return (
            <div
              key={item.id}
              className="bg-[var(--bg-surface)] border-y border-[var(--border-default)] -mx-4 px-4 py-5"
            >
              {item.content}
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className="bg-[var(--bg-surface)] border-y border-[var(--border-default)] -mx-4"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`settings-section-${item.id}`}
              className="flex items-center justify-between w-full px-4 min-h-[52px] cursor-pointer select-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                {item.icon}
                {item.label}
              </span>
              <span className="flex items-center gap-2">
                {item.badge}
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            <div
              id={`settings-section-${item.id}`}
              className={`overflow-hidden transition-all duration-250 ease-out ${
                isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-5">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
