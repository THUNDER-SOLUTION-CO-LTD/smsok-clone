"use client";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Webhook,
  Activity,
  Shield,
  Receipt,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard/settings/team", icon: Users, label: "จัดการทีม" },
  { href: "/dashboard/settings/roles", icon: ShieldCheck, label: "Roles" },
  { href: "/dashboard/settings/webhooks", icon: Webhook, label: "Webhooks" },
  { href: "/dashboard/settings/activity", icon: Activity, label: "Activity Log" },
  { href: "/dashboard/settings/privacy", icon: Shield, label: "Privacy" },
  { href: "/dashboard/billing", icon: Receipt, label: "Billing" },
];

export default function MobileQuickLinks() {
  return (
    <div className="mt-4 mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-secondary)] opacity-60 mb-2.5">
        ลิงก์ด่วน
      </p>
      <div className="grid grid-cols-2 gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] p-3.5 min-h-[48px] flex items-center gap-2.5 active:scale-[0.97] active:bg-[rgba(var(--accent-rgb),0.04)] transition-transform"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Icon className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
