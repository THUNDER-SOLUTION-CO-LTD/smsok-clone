"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Send,
  AlertTriangle,
  Plus,
  Check,
  Copy,
  X,
  Loader2,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Trash2,
  FlaskConical,
  ChevronRight,
  Clock,
  Zap,
  Shield,
  RotateCw,
  ExternalLink,
  Pencil,
} from "lucide-react";
import PageLayout, {
  PageHeader,
  StatsRow,
  StatCard,
  TableWrapper,
} from "@/components/blocks/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatThaiDate, timeAgo } from "@/lib/format-thai-date";
import {
  WEBHOOK_EVENTS,
  WEBHOOK_EVENT_GROUPS,
  EVENT_PRESETS,
  getEventsByGroup,
  getGroupDef,
  type WebhookEventId,
  type WebhookEventGroup,
} from "@/lib/webhook-events";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type WebhookStatus = "active" | "paused" | "error";

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  failCount: number;
  deliveryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryLog {
  id: string;
  event: string;
  statusCode: number | null;
  latency: number | null;
  success: boolean;
  createdAt: string;
  payload?: unknown;
  response?: unknown;
}

interface TestResult {
  success: boolean;
  statusCode: number | null;
  latency: number | null;
  error?: string;
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function getStatus(item: WebhookItem): WebhookStatus {
  if (!item.active) return "paused";
  if (item.failCount >= 5) return "error";
  return "active";
}

const STATUS_CONFIG: Record<WebhookStatus, { label: string; color: string; glow: string }> = {
  active: { label: "ใช้งาน", color: "var(--success)", glow: "var(--success)" },
  paused: { label: "หยุดชั่วคราว", color: "var(--warning)", glow: "var(--warning)" },
  error: { label: "ผิดพลาด", color: "var(--error)", glow: "var(--error)" },
};

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function StatusDot({ status }: { status: WebhookStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: cfg.color }}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.glow}80` }}
      />
      {cfg.label}
    </span>
  );
}

function EventBadge({ event }: { event: string }) {
  const prefix = event.split(".")[0];
  const group = getGroupDef(prefix);
  return (
    <span
      className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-md"
      style={{
        background: group?.bgColor ?? "rgba(255,255,255,0.05)",
        color: group?.color ?? "var(--text-secondary)",
      }}
    >
      {event}
    </span>
  );
}

/* ─── Event Selector ─── */

function EventSelector({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  function toggle(event: string) {
    const next = new Set(selected);
    if (next.has(event)) next.delete(event);
    else next.add(event);
    onChange(next);
  }

  function toggleGroup(events: string[]) {
    const allSelected = events.every((e) => selected.has(e));
    const next = new Set(selected);
    if (allSelected) {
      for (const e of events) next.delete(e);
    } else {
      for (const e of events) next.add(e);
    }
    onChange(next);
  }

  function applyPreset(events: string[]) {
    const next = new Set(selected);
    for (const e of events) next.add(e);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Preset
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.events)}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped events */}
      {WEBHOOK_EVENT_GROUPS.map((group) => {
        const events = getEventsByGroup(group.key);
        if (events.length === 0) return null;
        const allSelected = events.every((e) => selected.has(e.id));
        const someSelected = events.some((e) => selected.has(e.id));

        return (
          <div key={group.key} className="bg-black/20 border border-[var(--border-default)] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold" style={{ color: group.color }}>
                {group.label}
              </span>
              <button
                type="button"
                onClick={() => toggleGroup(events.map((e) => e.id))}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                style={{
                  background: allSelected ? "rgba(var(--accent-rgb),0.12)" : someSelected ? "rgba(var(--accent-rgb),0.06)" : "rgba(255,255,255,0.04)",
                  color: allSelected || someSelected ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>
            <div className="space-y-1">
              {events.map((ev) => {
                const checked = selected.has(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggle(ev.id)}
                    className="w-full flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: checked ? "rgba(var(--accent-rgb),0.06)" : "transparent",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border"
                      style={{
                        background: checked ? "var(--accent)" : "transparent",
                        borderColor: checked ? "var(--accent)" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {checked && <Check className="w-2.5 h-2.5" style={{ color: "var(--text-on-accent)" }} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">{ev.id}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-2">{ev.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Detail Panel — tabs: Overview, Events, Test, Deliveries
   ═══════════════════════════════════════════════════════════ */

type DetailTab = "overview" | "events" | "test" | "deliveries";

function DetailPanel({
  webhook,
  onClose,
  onRefresh,
}: {
  webhook: WebhookItem;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [detail, setDetail] = useState<{ secret?: string } | null>(null);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [editingEvents, setEditingEvents] = useState<Set<string>>(new Set(webhook.events));
  const [savingEvents, setSavingEvents] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState(false);
  const [editUrl, setEditUrl] = useState(webhook.url);
  const [savingUrl, setSavingUrl] = useState(false);

  const status = getStatus(webhook);

  // Fetch detail (masked secret)
  useEffect(() => {
    fetch(`/api/v1/webhooks/${webhook.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const wh = data?.webhook ?? data?.data?.webhook ?? data?.data ?? data;
        setDetail({ secret: wh?.secret ?? "••••••••" });
      })
      .catch(() => setDetail({ secret: "••••••••" }));
  }, [webhook.id]);

  // Fetch logs when Deliveries tab opens
  useEffect(() => {
    if (tab !== "deliveries") return;
    setLogsLoading(true);
    fetch(`/api/v1/webhooks/${webhook.id}/logs`)
      .then((r) => r.json())
      .then((data) => {
        const items = data?.data?.logs ?? data?.logs ?? [];
        setLogs(items);
      })
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, [webhook.id, tab]);

  // Test webhook
  async function handleTest() {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhook.id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      const result = data?.data ?? data;
      setTestResult({
        success: result?.success ?? res.ok,
        statusCode: result?.statusCode ?? result?.status ?? (res.ok ? 200 : 500),
        latency: result?.latency ?? result?.latencyMs ?? null,
        error: result?.error ?? undefined,
      });
    } catch (err) {
      setTestResult({
        success: false,
        statusCode: null,
        latency: null,
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setTestLoading(false);
    }
  }

  // Save events
  async function handleSaveEvents() {
    setSavingEvents(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: Array.from(editingEvents) }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("อัปเดต events สำเร็จ");
      onRefresh();
    } catch {
      toast.error("ไม่สามารถอัปเดต events ได้");
    } finally {
      setSavingEvents(false);
    }
  }

  // Save URL
  async function handleSaveUrl() {
    if (!editUrl.trim() || editUrl === webhook.url) {
      setEditingUrl(false);
      return;
    }
    try {
      const parsed = new URL(editUrl);
      if (parsed.protocol !== "https:") {
        toast.error("ต้องเป็น HTTPS เท่านั้น");
        return;
      }
    } catch {
      toast.error("URL ไม่ถูกต้อง");
      return;
    }
    setSavingUrl(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("อัปเดต URL สำเร็จ");
      setEditingUrl(false);
      onRefresh();
    } catch {
      toast.error("ไม่สามารถอัปเดต URL ได้");
    } finally {
      setSavingUrl(false);
    }
  }

  // Rotate secret
  async function handleRotateSecret() {
    setRotating(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhook.id}/rotate-secret`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newSecret = data?.data?.secret ?? data?.secret;
      if (newSecret) {
        setDetail({ secret: newSecret });
        toast.success("Rotate secret สำเร็จ — คัดลอกเก็บไว้ จะแสดงครั้งเดียว");
      }
    } catch {
      toast.error("ไม่สามารถ rotate secret ได้");
    } finally {
      setRotating(false);
    }
  }

  function copySecret() {
    if (detail?.secret) {
      navigator.clipboard.writeText(detail.secret).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const tabs: { key: DetailTab; label: string; icon: typeof Globe }[] = [
    { key: "overview", label: "ภาพรวม", icon: Globe },
    { key: "events", label: "Events", icon: Zap },
    { key: "test", label: "ทดสอบ", icon: FlaskConical },
    { key: "deliveries", label: "ประวัติส่ง", icon: Clock },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={status} />
          </div>
          <p className="text-[12px] font-mono text-[var(--text-muted)] truncate">{webhook.url}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-3"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-default)] px-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-all cursor-pointer ${
                tab === t.key
                  ? "text-[var(--accent)] border-[var(--accent)]"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">URL</p>
              {editingUrl ? (
                <div className="space-y-2">
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="font-mono text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveUrl();
                      if (e.key === "Escape") { setEditingUrl(false); setEditUrl(webhook.url); }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveUrl}
                      disabled={savingUrl}
                      className="cursor-pointer gap-1.5"
                      style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
                    >
                      {savingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      บันทึก
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingUrl(false); setEditUrl(webhook.url); }}
                      className="cursor-pointer"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[12px] font-mono text-[var(--text-secondary)] bg-black/30 rounded-lg px-3 py-2 truncate">
                    {webhook.url}
                  </code>
                  <button
                    type="button"
                    onClick={() => { setEditUrl(webhook.url); setEditingUrl(true); }}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                    title="แก้ไข URL"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <a href={webhook.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">สถานะ</p>
                <div className="mt-1"><StatusDot status={status} /></div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Events</p>
                <p className="text-lg font-semibold text-white mt-1">{webhook.events.length}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Deliveries</p>
                <p className="text-lg font-semibold text-white mt-1">{webhook.deliveryCount}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Fail streak</p>
                <p className="text-lg font-semibold mt-1" style={{ color: webhook.failCount > 0 ? "var(--error)" : "var(--success)" }}>
                  {webhook.failCount}
                </p>
              </div>
            </div>

            {/* Secret */}
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                <Shield className="w-3 h-3 inline mr-1" />
                Signing Secret
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/30 border border-[var(--border-default)] rounded-lg px-3 py-2 font-mono text-[12px] text-[var(--text-muted)] overflow-hidden text-ellipsis whitespace-nowrap">
                  {detail?.secret ?? "—"}
                </div>
                <Button type="button" variant="outline" size="icon" onClick={copySecret} className="w-8 h-8 cursor-pointer flex-shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRotateSecret}
                  disabled={rotating}
                  className="w-8 h-8 cursor-pointer flex-shrink-0"
                  title="Rotate secret"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${rotating ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Rotate จะสร้าง secret ใหม่ — secret เก่าจะใช้ไม่ได้ทันที
              </p>
            </div>

            <div className="text-[11px] text-[var(--text-muted)]">
              สร้างเมื่อ {formatThaiDate(webhook.createdAt)}
            </div>
          </div>
        )}

        {/* ── Events ── */}
        {tab === "events" && (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--text-secondary)]">
              เลือก events ที่ต้องการรับแจ้งเตือน ({editingEvents.size} เลือกแล้ว)
            </p>
            <EventSelector selected={editingEvents} onChange={setEditingEvents} />
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSaveEvents}
                disabled={savingEvents || editingEvents.size === 0}
                className="cursor-pointer gap-1.5"
                style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
              >
                {savingEvents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                บันทึก Events
              </Button>
            </div>
          </div>
        )}

        {/* ── Test ── */}
        {tab === "test" && (
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--text-secondary)]">
              ส่ง test event ไปยัง webhook เพื่อทดสอบว่า endpoint ตอบรับถูกต้อง
            </p>

            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Test Payload
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                ระบบจะส่ง test event พร้อม sample payload ไปยัง webhook URL ของคุณ พร้อม HMAC signature ที่ถูกต้อง
              </p>
            </div>

            <Button
              type="button"
              onClick={handleTest}
              disabled={testLoading}
              className="w-full cursor-pointer gap-2"
              style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
            >
              {testLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              ส่ง Test Event
            </Button>

            {/* Test Result Card */}
            {testResult && (
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: testResult.success ? "rgba(var(--success-rgb),0.3)" : "rgba(var(--error-rgb),0.3)",
                  background: testResult.success ? "rgba(var(--success-rgb),0.05)" : "rgba(var(--error-rgb),0.05)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-[var(--success)]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
                  )}
                  <span className="text-sm font-semibold" style={{ color: testResult.success ? "var(--success)" : "var(--error)" }}>
                    {testResult.success ? "สำเร็จ" : "ล้มเหลว"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="text-[var(--text-muted)]">HTTP Status</p>
                    <p className="font-mono font-semibold text-white">{testResult.statusCode ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Latency</p>
                    <p className="font-mono font-semibold text-white">
                      {testResult.latency != null ? `${testResult.latency}ms` : "—"}
                    </p>
                  </div>
                </div>
                {testResult.error && (
                  <p className="text-[11px] text-[var(--error)] mt-2">{testResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Deliveries ── */}
        {tab === "deliveries" && (
          <div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">ยังไม่มีประวัติการส่ง</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div key={log.id} className="bg-black/20 border border-[var(--border-default)] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: log.success ? "var(--success)" : "var(--error)",
                        }}
                      />
                      <EventBadge event={log.event} />
                      <span className="text-[11px] font-mono text-[var(--text-muted)] ml-auto">
                        {log.statusCode ?? "—"}
                      </span>
                      {log.latency != null && (
                        <span className="text-[10px] text-[var(--text-muted)]">{log.latency}ms</span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {timeAgo(log.createdAt)}
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`}
                      />
                    </button>
                    {expandedLog === log.id && (
                      <div className="border-t border-[var(--border-default)] px-3 py-3 grid grid-cols-1 gap-2">
                        {log.payload != null && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Payload</p>
                            <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-black/30 rounded-lg p-2 overflow-x-auto max-h-32">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.response != null && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Response</p>
                            <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-black/30 rounded-lg p-2 overflow-x-auto max-h-32">
                              {typeof log.response === "string" ? log.response : JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        )}
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {formatThaiDate(log.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Create Webhook Dialog — 2 phases: Configure → Go Live
   ═══════════════════════════════════════════════════════════ */

function CreateWebhookDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (createdId?: string) => void;
}) {
  const [phase, setPhase] = useState<"configure" | "success">("configure");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [createdSecret, setCreatedSecret] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [copied, setCopied] = useState(false);

  function reset() {
    setPhase("configure");
    setUrl("");
    setUrlError(null);
    setSelectedEvents(new Set());
    setSaving(false);
    setCreatedSecret("");
    setCreatedId("");
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateUrl(value: string): string | null {
    if (!value.trim()) return null;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") return "ต้องเป็น HTTPS เท่านั้น";
      return null;
    } catch {
      return "URL ไม่ถูกต้อง";
    }
  }

  async function handleCreate() {
    const err = validateUrl(url);
    if (err) { setUrlError(err); return; }
    if (selectedEvents.size === 0) { toast.error("เลือกอย่างน้อย 1 event"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          events: Array.from(selectedEvents),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? errData?.message ?? "สร้าง webhook ไม่สำเร็จ");
      }
      const data = await res.json();
      const wh = data?.webhook ?? data?.data?.webhook ?? data?.data ?? data;
      setCreatedSecret(wh?.plaintextSecret ?? wh?.secret ?? "");
      setCreatedId(wh?.id ?? "");
      setPhase("success");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(createdSecret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] max-h-[85vh] overflow-y-auto">
        {phase === "configure" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">เพิ่ม Webhook</DialogTitle>
              <DialogDescription className="text-[13px] text-[var(--text-muted)]">
                กำหนด URL ปลายทางและเลือก events ที่ต้องการรับแจ้งเตือน
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              {/* URL */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Endpoint URL <span className="normal-case">(HTTPS เท่านั้น)</span>
                </label>
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError(validateUrl(e.target.value));
                  }}
                  placeholder="https://example.com/webhook/smsok"
                  className={`font-mono text-sm ${urlError ? "border-[var(--error)]" : ""}`}
                />
                {urlError && <p className="text-[11px] mt-1 text-[var(--error)]">{urlError}</p>}
              </div>

              {/* Events */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Events ({selectedEvents.size} เลือกแล้ว)
                </label>
                <EventSelector selected={selectedEvents} onChange={setSelectedEvents} />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="cursor-pointer">
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={saving || !url.trim() || !!urlError || selectedEvents.size === 0}
                className="cursor-pointer gap-1.5"
                style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                สร้าง Webhook
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-[var(--success)]" />
                สร้าง Webhook สำเร็จ
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[var(--text-muted)]">
                คัดลอก Signing Secret เก็บไว้ — จะแสดงครั้งเดียวเท่านั้น
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Secret */}
              <div className="bg-[rgba(var(--success-rgb),0.05)] border border-[rgba(var(--success-rgb),0.2)] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[var(--success)] uppercase tracking-wider mb-2">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Signing Secret
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[12px] font-mono text-white bg-black/30 rounded-lg px-3 py-2 break-all select-all">
                    {createdSecret || "—"}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={copySecret} className="w-9 h-9 cursor-pointer flex-shrink-0">
                    {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-[var(--warning)] mt-2">
                  Secret จะไม่แสดงอีก — คัดลอกเก็บไว้ตอนนี้
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer gap-1.5"
                  onClick={() => {
                    const id = createdId;
                    reset();
                    onClose();
                    onCreated(id);
                  }}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  ทดสอบ
                </Button>
                <Button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 cursor-pointer gap-1.5"
                  style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
                >
                  เสร็จสิ้น
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/v1/webhooks");
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูล webhooks");
      const data = await res.json();
      const items = data?.data?.webhooks ?? data?.webhooks ?? data?.data ?? [];
      setWebhooks(
        (Array.isArray(items) ? items : []).map((w: Record<string, unknown>) => ({
          id: w.id as string,
          url: w.url as string,
          events: (w.events as string[]) ?? [],
          active: w.active !== false,
          failCount: (w.failCount as number) ?? 0,
          deliveryCount: (w.deliveryCount as number) ?? (w._count as Record<string, number>)?.logs ?? 0,
          createdAt: w.createdAt as string,
          updatedAt: w.updatedAt as string,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // Toggle active
  async function handleToggle(webhook: WebhookItem) {
    setTogglingId(webhook.id);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !webhook.active }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(webhook.active ? "หยุด webhook สำเร็จ" : "เปิดใช้งาน webhook สำเร็จ");
      fetchWebhooks();
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานะ webhook ได้");
    } finally {
      setTogglingId(null);
    }
  }

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("ลบ webhook สำเร็จ");
      setDeleteTarget(null);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      fetchWebhooks();
    } catch {
      toast.error("ไม่สามารถลบ webhook ได้");
    } finally {
      setDeleting(false);
    }
  }

  const selectedWebhook = webhooks.find((w) => w.id === selectedId) ?? null;
  const activeCount = webhooks.filter((w) => w.active).length;
  const errorCount = webhooks.filter((w) => w.failCount >= 5).length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryCount, 0);

  return (
    <PageLayout>
      <PageHeader
        title="Webhooks"
        count={webhooks.length}
        description="รับการแจ้งเตือนอัตโนมัติเมื่อมี event เกิดขึ้น"
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 cursor-pointer shrink-0"
            style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Webhook
          </Button>
        }
      />

      {/* Stats */}
      <StatsRow columns={3}>
        <StatCard
          icon={<Globe className="w-4 h-4" style={{ color: "var(--success)" }} />}
          iconColor="16,185,129"
          value={activeCount}
          label="Active"
        />
        <StatCard
          icon={<Send className="w-4 h-4" style={{ color: "var(--info)" }} />}
          iconColor="59,130,246"
          value={totalDeliveries}
          label="Total Deliveries"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" style={{ color: errorCount > 0 ? "var(--error)" : "var(--success)" }} />}
          iconColor={errorCount > 0 ? "239,68,68" : "16,185,129"}
          value={errorCount}
          label="Error"
        />
      </StatsRow>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16 flex-col gap-3">
          <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button type="button" onClick={fetchWebhooks} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">
            ลองอีกครั้ง
          </button>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex items-center justify-center py-16 flex-col">
          <Globe className="w-10 h-10 mb-3 text-[var(--text-muted)]" />
          <p className="text-base font-semibold text-white mb-1">ยังไม่มี Webhook</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">เพิ่ม webhook เพื่อรับการแจ้งเตือนเมื่อมี event เกิดขึ้น</p>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Webhook
          </Button>
        </div>
      ) : (
        <TableWrapper>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header)]">
                  {["URL", "Events", "สถานะ", "Deliveries", "Fail", ""].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider first:pl-5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhooks.map((hook) => {
                  const status = getStatus(hook);
                  return (
                    <tr
                      key={hook.id}
                      className={`border-b border-[var(--table-border)] hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        selectedId === hook.id ? "bg-[rgba(var(--accent-rgb),0.03)]" : ""
                      }`}
                      onClick={() => setSelectedId(hook.id)}
                    >
                      <td className="px-5 py-3.5 max-w-[250px]">
                        <span className="text-[12px] font-mono text-[var(--text-secondary)] truncate block" title={hook.url}>
                          {hook.url}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(var(--accent-rgb),0.08)", color: "var(--accent)", border: "1px solid rgba(var(--accent-rgb),0.15)" }}
                        >
                          {hook.events.length} events
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusDot status={status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-[var(--text-secondary)] tabular-nums">{hook.deliveryCount}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[13px] tabular-nums font-medium"
                          style={{ color: hook.failCount > 0 ? "var(--error)" : "var(--text-muted)" }}
                        >
                          {hook.failCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggle(hook)}
                            disabled={togglingId === hook.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                            title={hook.active ? "หยุด" : "เปิดใช้งาน"}
                          >
                            {togglingId === hook.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
                            ) : hook.active ? (
                              <PauseCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(hook)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[rgba(var(--error-rgb),0.1)] transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--error)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      )}

      {/* Detail Side Panel */}
      {selectedWebhook && (
        <DetailPanel
          webhook={selectedWebhook}
          onClose={() => setSelectedId(null)}
          onRefresh={fetchWebhooks}
        />
      )}

      {/* Create Dialog */}
      <CreateWebhookDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(createdId) => {
          fetchWebhooks();
          if (createdId) setSelectedId(createdId);
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ลบ Webhook</DialogTitle>
            <DialogDescription>
              ต้องการลบ webhook &ldquo;{deleteTarget?.url}&rdquo;? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              ประวัติการส่งทั้งหมดจะถูกลบด้วย
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer gap-1.5"
              style={{ background: "rgba(var(--error-rgb),0.1)", color: "var(--error)" }}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              ลบ Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
