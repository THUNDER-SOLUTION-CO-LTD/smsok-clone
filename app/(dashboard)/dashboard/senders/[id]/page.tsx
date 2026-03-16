"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
  Download,
  ZoomIn,
  X,
  Loader2,
  Calendar,
  Hash,
  Send,
  ExternalLink,
} from "lucide-react";
import { formatThaiDate, formatThaiDateOnly } from "@/lib/format-thai-date";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/skeletons/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SenderDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string | null;
  fileSize?: number;
  mimeType: string | null;
  verified: boolean;
  createdAt: string;
}

interface SenderHistory {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

interface SenderDetail {
  id: string;
  name: string;
  status: string;
  accountType: string | null;
  rejectNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  documents: SenderDocument[];
  urls: { id: string; domain: string }[];
  history: SenderHistory[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  APPROVED: { label: "อนุมัติแล้ว", color: "var(--success)", bg: "var(--success-bg)", icon: CheckCircle2 },
  PENDING: { label: "รออนุมัติ", color: "var(--warning)", bg: "var(--warning-bg)", icon: Clock },
  DRAFT: { label: "ร่าง", color: "var(--text-muted)", bg: "var(--bg-surface)", icon: FileText },
  REJECTED: { label: "ถูกปฏิเสธ", color: "var(--error)", bg: "var(--danger-bg)", icon: XCircle },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  company_certificate: "หนังสือรับรองบริษัท",
  id_card: "สำเนาบัตรประชาชน",
  power_of_attorney: "หนังสือมอบอำนาจ",
  name_authorization: "เอกสารยืนยันสิทธิ์",
  other: "อื่นๆ",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sender, setSender] = useState<SenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  // ---- Fetch ----
  const fetchSender = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/senders/name/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("ไม่พบ Sender Name");
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }
      const data = await res.json();
      setSender(data.senderName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSender();
  }, [fetchSender]);

  // ---- Upload handler ----
  async function handleUpload(files: FileList) {
    if (!sender) return;

    const remaining = MAX_FILES - sender.documents.length;
    if (remaining <= 0) {
      toast.error(`แนบเอกสารได้สูงสุด ${MAX_FILES} ไฟล์`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);

    // Validate
    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" — รองรับเฉพาะ JPG, PNG, PDF`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" — ขนาดต้องไม่เกิน 5MB`);
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of toUpload) {
        formData.append("documents", file);
      }

      const res = await fetch(`/api/v1/senders/${id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "อัปโหลดไม่สำเร็จ");
      }

      toast.success(`อัปโหลด ${toUpload.length} ไฟล์สำเร็จ`);
      await fetchSender();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <Skeleton className="h-5 w-32 rounded-lg mb-6" />
        <Skeleton className="h-8 w-64 rounded-lg mb-2" />
        <Skeleton className="h-4 w-48 rounded-lg mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg mb-4" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  // ---- Error ----
  if (error || !sender) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <Link
          href="/dashboard/senders"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          กลับไปหน้าชื่อผู้ส่ง
        </Link>
        <div className="rounded-lg p-8 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <XCircle size={40} className="mx-auto mb-3" style={{ color: "var(--error)" }} />
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{error ?? "ไม่พบข้อมูล"}</p>
          <p className="text-xs text-[var(--text-muted)]">กรุณาตรวจสอบลิงก์หรือลองใหม่</p>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[sender.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = sc.icon;
  const canUpload = ["DRAFT", "PENDING"].includes(sender.status);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/senders"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        กลับไปหน้าชื่อผู้ส่ง
      </Link>

      {/* ========== Header ========== */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {sender.name}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ color: sc.color, background: sc.bg }}
            >
              <StatusIcon className="size-3" />
              {sc.label}
            </span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {sender.accountType ?? "ทั่วไป"} — สร้างเมื่อ {formatThaiDateOnly(sender.createdAt)}
          </p>
        </div>
      </div>

      {/* ========== Rejection Note ========== */}
      {sender.status === "REJECTED" && sender.rejectNote && (
        <div
          className="rounded-lg p-4 mb-6 flex items-start gap-3"
          style={{ background: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" style={{ color: "var(--error)" }} />
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: "var(--error)" }}>เหตุผลที่ถูกปฏิเสธ</p>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{sender.rejectNote}</p>
          </div>
        </div>
      )}

      {/* ========== Info Cards ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <Calendar className="size-4 text-[var(--text-muted)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {sender.submittedAt ? formatThaiDateOnly(sender.submittedAt) : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">วันที่ยื่นคำขอ</p>
          </div>
        </div>
        <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <CheckCircle2 className="size-4" style={{ color: sender.approvedAt ? "var(--success)" : "var(--text-muted)" }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {sender.approvedAt ? formatThaiDateOnly(sender.approvedAt) : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">วันที่อนุมัติ</p>
          </div>
        </div>
        <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <Clock className="size-4" style={{ color: sender.expiresAt ? "var(--warning)" : "var(--text-muted)" }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {sender.expiresAt ? formatThaiDateOnly(sender.expiresAt) : "ไม่มีกำหนด"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">วันหมดอายุ</p>
          </div>
        </div>
      </div>

      {/* ========== Documents Section ========== */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            เอกสารประกอบ ({sender.documents.length}/{MAX_FILES})
          </h2>
          {canUpload && sender.documents.length < MAX_FILES && (
            <Button
              size="sm"
              className="h-[32px] gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดเอกสาร"}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
              }
            }}
          />
        </div>

        {sender.documents.length === 0 ? (
          /* Empty state */
          <div className="text-center py-8">
            <div
              className="w-14 h-14 mx-auto mb-3 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <FileText className="size-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-primary)] mb-1">ยังไม่มีเอกสาร</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              อัปโหลดหนังสือรับรองบริษัท หรือเอกสารที่เกี่ยวข้อง (JPG, PNG, PDF — สูงสุด 5MB/ไฟล์)
            </p>
            {canUpload && (
              <Button
                size="sm"
                className="h-[36px] gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-4" />
                อัปโหลดเอกสาร
              </Button>
            )}
          </div>
        ) : (
          /* Document grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sender.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                {/* Preview */}
                {doc.fileUrl && isImageMime(doc.mimeType) ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={doc.fileUrl}
                      alt={doc.fileName}
                      className="w-full h-[140px] object-contain cursor-pointer"
                      style={{ background: "var(--bg-elevated)" }}
                      onClick={() => setLightbox({ url: doc.fileUrl!, name: doc.fileName })}
                    />
                    <button
                      type="button"
                      onClick={() => setLightbox({ url: doc.fileUrl!, name: doc.fileName })}
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      style={{ background: "rgba(11,17,24,0.7)", backdropFilter: "blur(4px)" }}
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="h-[140px] flex flex-col items-center justify-center gap-2">
                    <FileText size={32} className={doc.mimeType === "application/pdf" ? "text-[var(--error)]" : "text-[var(--text-muted)]"} />
                    {doc.fileUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(doc.fileUrl!, "_blank")}
                        className="text-[11px] font-medium text-[var(--accent)] hover:underline"
                      >
                        {doc.mimeType === "application/pdf" ? "ดู PDF →" : "ดาวน์โหลด →"}
                      </button>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="px-3 py-2.5 border-t border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-primary)] truncate font-medium">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                    </span>
                    {doc.fileSize && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    )}
                    {doc.verified && (
                      <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "var(--success)" }}>
                        <CheckCircle2 className="size-2.5" />
                        ตรวจสอบแล้ว
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload hint */}
        {canUpload && sender.documents.length > 0 && sender.documents.length < MAX_FILES && (
          <p className="text-[10px] text-[var(--text-muted)] mt-3 text-center">
            แนบได้อีก {MAX_FILES - sender.documents.length} ไฟล์ — รองรับ JPG, PNG, PDF (สูงสุด 5MB/ไฟล์)
          </p>
        )}
      </div>

      {/* ========== URLs ========== */}
      {sender.urls.length > 0 && (
        <div
          className="rounded-lg p-5 mb-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            โดเมนที่เกี่ยวข้อง
          </h2>
          <div className="space-y-2">
            {sender.urls.map((url) => (
              <div
                key={url.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                <ExternalLink className="size-3.5 text-[var(--text-muted)]" />
                <span className="text-[var(--text-primary)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {url.domain}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== History Timeline ========== */}
      {sender.history.length > 0 && (
        <div
          className="rounded-lg p-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            ประวัติ
          </h2>
          <div className="space-y-0">
            {sender.history.map((h, idx) => {
              const isLast = idx === sender.history.length - 1;
              return (
                <div key={h.id} className="flex gap-3">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: idx === 0 ? "var(--accent)" : "var(--border-default)" }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 my-1" style={{ background: "var(--border-default)" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={cn("pb-4", isLast && "pb-0")}>
                    <p className="text-xs text-[var(--text-primary)] font-medium">
                      {h.action}
                      {h.fromStatus && h.toStatus && (
                        <span className="text-[var(--text-muted)]"> — {h.fromStatus} → {h.toStatus}</span>
                      )}
                    </p>
                    {h.note && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{h.note}</p>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {formatThaiDate(h.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== Lightbox ========== */}
      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-[800px] bg-[var(--bg-base)] border-[var(--border-default)] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
            <DialogTitle className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {lightbox?.name}
            </DialogTitle>
            <div className="flex items-center gap-1">
              {lightbox?.url && (
                <Button variant="ghost" size="icon-sm" onClick={() => window.open(lightbox.url, "_blank")}>
                  <Download size={14} />
                </Button>
              )}
            </div>
          </div>
          <div className="p-5 text-center max-h-[70vh] overflow-auto">
            {lightbox?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox.url}
                alt={lightbox.name}
                className="max-w-full max-h-[60vh] object-contain rounded-md mx-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
