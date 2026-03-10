"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/ui/CustomSelect";

// ─── Types ────────────────────────────────────────────────────────────────

type LogEntry = {
  id: string;
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  statusCode: number;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseBody: unknown;
  errorCode?: string;
  errorMessage?: string;
  apiKeyName?: string;
  ip: string;
  phone?: string;
  messageId?: string;
  source: "WEB" | "API";
};

type DetailTab = "request" | "response" | "error";

// ─── Constants ────────────────────────────────────────────────────────────

const METHOD_BADGE: Record<string, string> = {
  GET: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  POST: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
};

const SOURCE_BADGE: Record<string, string> = {
  WEB: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  API: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

const ENDPOINT_OPTIONS = [
  { value: "all", label: "ทุก Endpoint" },
  { value: "/api/v1/sms/send", label: "/sms/send" },
  { value: "/api/v1/sms/batch", label: "/sms/batch" },
  { value: "/api/v1/sms/status", label: "/sms/status" },
  { value: "/api/v1/otp/generate", label: "/otp/generate" },
  { value: "/api/v1/otp/verify", label: "/otp/verify" },
  { value: "/api/v1/contacts", label: "/contacts" },
  { value: "/api/v1/balance", label: "/balance" },
  { value: "/api/v1/templates", label: "/templates" },
  { value: "/api/v1/auth/login", label: "/auth/login" },
];

function statusBadgeCls(code: number) {
  if (code < 300) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (code < 400) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-red-500/15 text-red-400 border-red-500/20";
}

function latencyCls(ms: number) {
  if (ms < 100) return "text-emerald-400";
  if (ms <= 500) return "text-amber-400";
  return "text-red-400";
}

function statusGroup(code: number) {
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked = { ...headers };
  if (masked.Authorization) {
    masked.Authorization = masked.Authorization.slice(0, 15) + "..." + masked.Authorization.slice(-4);
  }
  return masked;
}

function buildCurl(log: LogEntry): string {
  const parts = [`curl -X ${log.method}`];
  parts.push(`'https://api.smsok.com${log.url}'`);
  for (const [key, value] of Object.entries(log.requestHeaders)) {
    parts.push(`-H '${key}: ${key === "Authorization" ? value : value}'`);
  }
  if (log.requestBody && log.method !== "GET") {
    parts.push(`-d '${JSON.stringify(log.requestBody)}'`);
  }
  return parts.join(" \\\n  ");
}

function exportCsv(logs: LogEntry[]) {
  const header = "Timestamp,Method,Endpoint,Status,Latency (ms),IP,Source,API Key,Phone,Message ID,Error\n";
  const rows = logs.map((log) =>
    [
      log.timestamp,
      log.method,
      log.url,
      log.statusCode,
      log.latencyMs,
      log.ip,
      log.source,
      log.apiKeyName || "",
      log.phone || "",
      log.messageId || "",
      log.errorMessage || "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `api-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Mock Data ────────────────────────────────────────────────────────────

function generateMockLogs(count: number): LogEntry[] {
  const methods: LogEntry["method"][] = ["GET", "POST", "POST", "DELETE"];
  const endpoints = [
    "/api/v1/sms/send", "/api/v1/sms/batch", "/api/v1/otp/generate",
    "/api/v1/otp/verify", "/api/v1/contacts", "/api/v1/balance",
    "/api/v1/templates", "/api/v1/sms/status", "/api/v1/auth/login",
  ];
  const statuses = [200, 200, 200, 200, 201, 400, 401, 429, 500];
  const keyNames = ["Production Key", "Staging Key", "Test Key"];

  return Array.from({ length: count }, (_, i) => {
    const method = methods[i % methods.length];
    const url = endpoints[i % endpoints.length];
    const statusCode = statuses[i % statuses.length];
    const latencyMs = Math.floor(Math.random() * 800) + 20;
    const ts = new Date(Date.now() - i * 45000).toISOString();
    const isError = statusCode >= 400;
    const phone = `089${String(1000000 + i).slice(0, 7)}`;
    const messageId = `msg_${Date.now()}_${i}`;

    return {
      id: `log_${Date.now()}_${i}`,
      timestamp: ts,
      method,
      url,
      statusCode,
      latencyMs,
      requestHeaders: {
        Authorization: "Bearer sk_live_abc123def456ghi789jkl",
        "Content-Type": "application/json",
      },
      requestBody: method === "POST" ? {
        sender: "EasySlip",
        to: phone,
        message: "สวัสดีครับ ข้อความทดสอบ #" + (i + 1),
      } : null,
      responseBody: isError
        ? { error: { code: String(statusCode), message: statusCode === 401 ? "Invalid API Key" : statusCode === 429 ? "Rate limit exceeded" : "Bad request" } }
        : { id: messageId, status: "pending", credits_used: 1, credits_remaining: 1500 - i },
      errorCode: isError ? String(statusCode) : undefined,
      errorMessage: isError
        ? (statusCode === 401 ? "Invalid API Key" : statusCode === 429 ? "Rate limit exceeded (10/min)" : statusCode === 500 ? "Internal server error" : "Validation failed")
        : undefined,
      apiKeyName: keyNames[i % keyNames.length],
      ip: `203.154.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      phone,
      messageId: isError ? undefined : messageId,
      source: i % 3 === 0 ? "WEB" as const : "API" as const,
    };
  });
}

const ALL_LOGS = generateMockLogs(87);
const PAGE_SIZE = 20;

// ─── JSON Viewer ──────────────────────────────────────────────────────────

function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (data == null) return <p className="text-xs text-[var(--text-muted)] italic py-4">ไม่มีข้อมูล</p>;

  return (
    <div className="relative rounded-xl bg-black/40 border border-white/[0.04] overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        title="Copy"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
        )}
      </button>
      <pre className="p-4 pr-10 text-xs font-mono text-cyan-300/80 overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

// ─── Detail Tabs ──────────────────────────────────────────────────────────

function DetailPanel({ log }: { log: LogEntry }) {
  const [tab, setTab] = useState<DetailTab>("request");
  const [curlCopied, setCurlCopied] = useState(false);

  const tabs: { id: DetailTab; label: string; show: boolean }[] = [
    { id: "request", label: "Request", show: true },
    { id: "response", label: "Response", show: true },
    { id: "error", label: "Error", show: !!log.errorCode },
  ];

  function handleCopyCurl() {
    navigator.clipboard.writeText(buildCurl(log));
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }

  return (
    <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-white/[0.01]">
      {/* Meta row */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        {log.apiKeyName && (
          <span className="text-[var(--text-muted)]">
            API Key: <span className="text-[var(--text-secondary)]">{log.apiKeyName}</span>
          </span>
        )}
        <span className="text-[var(--text-muted)]">
          Source: <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${SOURCE_BADGE[log.source]}`}>{log.source}</span>
        </span>
        <span className="text-[var(--text-muted)]">
          IP: <span className="text-[var(--text-secondary)] font-mono">{log.ip}</span>
        </span>
        <span className="text-[var(--text-muted)]">
          Latency: <span className={`font-mono ${latencyCls(log.latencyMs)}`}>{log.latencyMs}ms</span>
        </span>
        {log.phone && (
          <span className="text-[var(--text-muted)]">
            Phone: <span className="text-[var(--text-secondary)] font-mono">{log.phone}</span>
          </span>
        )}
        {log.messageId && (
          <span className="text-[var(--text-muted)]">
            Msg ID: <span className="text-[var(--text-secondary)] font-mono text-[10px]">{log.messageId}</span>
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/[0.04] pb-px">
        {tabs.filter(t => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-all cursor-pointer ${
              tab === t.id
                ? "bg-white/[0.04] text-white border-b-2 border-violet-500"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]"
            }`}
          >
            {t.id === "error" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
            )}
            {t.label}
          </button>
        ))}

        {/* Copy cURL button */}
        <button
          onClick={handleCopyCurl}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] text-[var(--text-muted)] hover:text-white hover:border-violet-500/30 transition-all cursor-pointer"
        >
          {curlCopied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
              Copy cURL
            </>
          )}
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "request" && (
          <motion.div key="req" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">Headers</p>
            <JsonViewer data={maskHeaders(log.requestHeaders)} />
            {log.requestBody != null && (
              <>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-4 mb-2">Body</p>
                <JsonViewer data={log.requestBody} />
              </>
            )}
          </motion.div>
        )}
        {tab === "response" && (
          <motion.div key="res" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeCls(log.statusCode)}`}>
                {log.statusCode}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {log.statusCode < 300 ? "OK" : log.statusCode < 400 ? "Redirect" : log.statusCode < 500 ? "Client Error" : "Server Error"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">Body</p>
            <JsonViewer data={log.responseBody} />
          </motion.div>
        )}
        {tab === "error" && log.errorCode && (
          <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/15">
              <div className="flex items-center gap-3 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm font-semibold text-red-400">Error {log.errorCode}</span>
              </div>
              <p className="text-sm text-red-400/80">{log.errorMessage}</p>
              <p className="text-[11px] text-red-400/40 mt-3 italic">Stack trace hidden for security</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stagger ──────────────────────────────────────────────────────────────

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const rowVariant = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } } };

// ─── Main Component ───────────────────────────────────────────────────────

export default function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>(ALL_LOGS);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-refresh polling
  const refreshLogs = useCallback(() => {
    setLogs(generateMockLogs(87));
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refreshLogs, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, refreshLogs]);

  // Filter
  const filtered = logs.filter((log) => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      log.url.toLowerCase().includes(q) ||
      (log.phone && log.phone.includes(q)) ||
      (log.messageId && log.messageId.toLowerCase().includes(q)) ||
      log.ip.includes(q);
    const matchStatus = statusFilter === "all" || statusGroup(log.statusCode) === statusFilter;
    const matchMethod = methodFilter === "all" || log.method === methodFilter;
    const matchEndpoint = endpointFilter === "all" || log.url === endpointFilter;
    const matchSource = sourceFilter === "all" || log.source === sourceFilter;
    const logDate = new Date(log.timestamp);
    const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchMethod && matchEndpoint && matchSource && matchFrom && matchTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = Math.min((page - 1) * PAGE_SIZE + 1, filtered.length);
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

  function clearFilters() {
    setSearch(""); setStatusFilter("all"); setMethodFilter("all"); setEndpointFilter("all"); setSourceFilter("all"); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const hasFilters = search || statusFilter !== "all" || methodFilter !== "all" || endpointFilter !== "all" || sourceFilter !== "all" || dateFrom || dateTo;

  return (
    <motion.div
      className="p-4 md:p-8 max-w-[1400px] mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text-mixed">API Request Logs</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">ประวัติการเรียก API ทั้งหมด</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export CSV */}
          <motion.button
            onClick={() => exportCsv(filtered)}
            className="btn-glass px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </motion.button>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.03] border-white/[0.06] text-[var(--text-muted)] hover:border-white/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>

          {/* Manual refresh */}
          <motion.button
            onClick={refreshLogs}
            className="btn-glass px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            รีเฟรช
          </motion.button>
        </div>
      </div>

      {/* Filter Bar */}
      <motion.div
        className="glass p-4 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search: phone / messageID / endpoint */}
            <div className="relative flex-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="input-glass pl-9 text-sm"
                placeholder="ค้นหา เบอร์โทร, Message ID, IP, หรือ endpoint..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <CustomSelect
              value={endpointFilter}
              onChange={(v) => { setEndpointFilter(v); setPage(1); }}
              options={ENDPOINT_OPTIONS}
              className="min-w-[160px]"
            />
            <CustomSelect
              value={methodFilter}
              onChange={(v) => { setMethodFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "ทุก Method" },
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DELETE" },
              ]}
              className="min-w-[130px]"
            />
            <CustomSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "ทุกสถานะ" },
                { value: "2xx", label: "2xx Success" },
                { value: "3xx", label: "3xx Redirect" },
                { value: "4xx", label: "4xx Client Error" },
                { value: "5xx", label: "5xx Server Error" },
              ]}
              className="min-w-[160px]"
            />
            <CustomSelect
              value={sourceFilter}
              onChange={(v) => { setSourceFilter(v); setPage(1); }}
              options={[
                { value: "all", label: "ทุก Source" },
                { value: "WEB", label: "WEB" },
                { value: "API", label: "API" },
              ]}
              className="min-w-[120px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ตั้งแต่</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input-glass text-sm py-1.5 px-3 w-[150px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">ถึง</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input-glass text-sm py-1.5 px-3 w-[150px]" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors cursor-pointer">
                ล้างตัวกรอง
              </button>
            )}
            <span className="text-[11px] text-[var(--text-muted)] ml-auto">{filtered.length} รายการ</span>
          </div>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        className="glass overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[150px_70px_1fr_80px_80px_60px_130px] gap-x-3 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <span>เวลา</span>
          <span>Method</span>
          <span>Endpoint</span>
          <span className="text-center">Status</span>
          <span className="text-right">Latency</span>
          <span className="text-center">Source</span>
          <span className="text-right">IP Address</span>
        </div>

        {/* Rows */}
        <AnimatePresence mode="wait">
          {paginated.length > 0 ? (
            <motion.div key="rows" variants={stagger} initial="hidden" animate="show">
              {paginated.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <motion.div key={log.id} variants={rowVariant}>
                    {/* Row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className={`w-full grid grid-cols-1 md:grid-cols-[150px_70px_1fr_80px_80px_60px_130px] gap-x-3 gap-y-1 px-5 py-3.5 items-center text-left border-b border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? "bg-white/[0.02]" : ""}`}
                    >
                      {/* Timestamp */}
                      <span className="text-xs text-[var(--text-muted)] font-mono">{formatTimestamp(log.timestamp)}</span>

                      {/* Method */}
                      <span>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${METHOD_BADGE[log.method]}`}>
                          {log.method}
                        </span>
                      </span>

                      {/* URL */}
                      <span className="text-sm text-white font-mono truncate">{log.url}</span>

                      {/* Status */}
                      <span className="text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeCls(log.statusCode)}`}>
                          {log.statusCode}
                        </span>
                      </span>

                      {/* Latency */}
                      <span className={`text-xs font-mono text-right tabular-nums ${latencyCls(log.latencyMs)}`}>
                        {log.latencyMs}ms
                      </span>

                      {/* Source */}
                      <span className="text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${SOURCE_BADGE[log.source]}`}>
                          {log.source}
                        </span>
                      </span>

                      {/* IP Address */}
                      <span className="text-xs text-[var(--text-muted)] font-mono text-right truncate">
                        {log.ip}
                      </span>
                    </button>

                    {/* Expanded Detail — Tabbed */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <DetailPanel log={log} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">ไม่พบ request logs</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span>แสดง {showingFrom}–{showingTo} จาก {filtered.length} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                  ก่อนหน้า
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          p === page
                            ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                            : "hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <span className="sm:hidden">หน้า {page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ถัดไป
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
