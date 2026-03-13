"use client";

import Link from "next/link";
import {
  Shield,
  Link2,
  ClipboardList,
  Clock,
  ArrowRight,
  FileText,
  Check,
  Circle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { cn } from "@/lib/utils";

/* ─── Config ─── */

const PDPA_CARDS = [
  {
    icon: Shield,
    accentColor: "var(--accent)",
    accentRgb: "var(--accent-rgb)",
    title: "การจัดการความยินยอม",
    description: "จัดการ consent ของผู้ติดต่อแต่ละรายและส่งออกรายงาน",
    href: "/dashboard/settings/pdpa/consent",
    action: "จัดการ",
    badge: null,
    stat: { value: "94.2%", label: "อัตราความยินยอม" },
  },
  {
    icon: Link2,
    accentColor: "var(--accent-blue)",
    accentRgb: "71,121,255",
    title: "ลิงก์ยกเลิกการรับ",
    description: "สร้างและจัดการ opt-out link สำหรับใส่ใน SMS ทุกข้อความ",
    href: "/dashboard/settings/pdpa/optout",
    action: "ตั้งค่า",
    badge: null,
    stat: { value: "เปิดใช้", label: "สถานะ" },
  },
  {
    icon: ClipboardList,
    accentColor: "var(--warning)",
    accentRgb: "var(--warning-rgb)",
    title: "คำขอสิทธิ์ข้อมูล",
    description: "จัดการ data subject rights requests ตาม PDPA",
    href: "/dashboard/settings/pdpa/requests",
    action: "จัดการ",
    badge: {
      text: "3 รอดำเนินการ",
      color: "var(--warning)",
      bg: "rgba(var(--warning-rgb),0.1)",
      border: "rgba(var(--warning-rgb),0.15)",
    },
    stat: { value: "3", label: "รอดำเนินการ" },
  },
  {
    icon: Clock,
    accentColor: "var(--accent-purple)",
    accentRgb: "var(--accent-purple-rgb)",
    title: "นโยบายเก็บข้อมูล",
    description: "ตั้งค่า retention period และ auto-purge ของข้อมูล",
    href: "/dashboard/settings/pdpa/retention",
    action: "ตั้งค่า",
    badge: {
      text: "ตั้งค่าแล้ว",
      color: "var(--success)",
      bg: "rgba(var(--success-rgb),0.1)",
      border: "rgba(var(--success-rgb),0.15)",
    },
    stat: { value: "5", label: "นโยบายที่ตั้งค่า" },
  },
];

const LEGAL_DOCS = [
  { name: "Privacy Policy (TH)", done: true, href: "/privacy" },
  { name: "Privacy Policy (EN)", done: true, href: "/privacy?lang=en" },
  { name: "Terms of Service", done: true, href: "/legal/terms" },
  { name: "Acceptable Use Policy", done: false, href: "/acceptable-use" },
  { name: "Cookie Policy", done: false, href: "/cookie-policy" },
];

/* ─── Main Component ─── */

export default function PdpaHubPage() {
  const completedDocs = LEGAL_DOCS.filter((d) => d.done).length;
  const totalDocs = LEGAL_DOCS.length;
  const completionPct = Math.round((completedDocs / totalDocs) * 100);

  return (
    <PageLayout>
      <PageHeader
        title="PDPA และความเป็นส่วนตัว"
        description="จัดการการยินยอมและข้อมูลส่วนบุคคลตาม PDPA"
      />

      {/* ─── Hub Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-children">
        {PDPA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group card-conic bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden block"
            >
              {/* Top accent line */}
              <div
                className="h-[2px] transition-opacity duration-300 group-hover:opacity-100 opacity-40"
                style={{
                  background: `linear-gradient(90deg, transparent, ${card.accentColor}, transparent)`,
                }}
              />

              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: `rgba(${card.accentRgb},0.1)`,
                      boxShadow: `0 0 0 1px rgba(${card.accentRgb},0.1)`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: card.accentColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {card.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                    </div>

                    <p className="text-[13px] text-[var(--text-secondary)] mb-3 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>

                    {/* Badge + Action */}
                    <div className="flex items-center justify-between">
                      {card.badge ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                          style={{
                            background: card.badge.bg,
                            color: card.badge.color,
                            border: `1px solid ${card.badge.border}`,
                          }}
                        >
                          {card.badge.text.includes("รอ") && (
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                              style={{ background: card.badge.color }}
                            />
                          )}
                          {card.badge.text}
                        </span>
                      ) : (
                        <span />
                      )}

                      <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                        {card.action}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Legal Documents ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--bg-muted)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                เอกสารทางกฎหมาย
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                เอกสาร PDPA ที่จำเป็นสำหรับการให้บริการ
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                {completedDocs}/{totalDocs}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-default)]">
          {LEGAL_DOCS.map((doc) => (
            <div
              key={doc.name}
              className={cn(
                "flex items-center justify-between px-5 py-3.5 transition-colors",
                "hover:bg-[var(--bg-surface-hover)]"
              )}
            >
              <div className="flex items-center gap-3">
                {doc.done ? (
                  <div className="w-5 h-5 rounded-full bg-[rgba(var(--success-rgb),0.15)] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[var(--success)]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[var(--border-default)] flex items-center justify-center">
                    <Circle className="w-2 h-2 text-[var(--text-muted)]" />
                  </div>
                )}
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    doc.done
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  )}
                >
                  {doc.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {doc.done ? (
                  <Link
                    href={doc.href}
                    className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  >
                    ดู
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent)]">
                    สร้าง
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
