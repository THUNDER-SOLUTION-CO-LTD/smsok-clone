"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Receipt,
  Eye,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { type Order } from "@/types/order"
import { formatBaht } from "@/types/purchase"
import { formatThaiDateOnly } from "@/lib/format-thai-date"

function formatNumber(n: number): string {
  return n.toLocaleString("th-TH")
}

function openDocument(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(!!orderId)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/v1/orders/${orderId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`Order fetch failed: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data) setOrder(data)
        else setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [orderId])

  // Fallback values from search params (legacy support)
  const smsQty = order?.sms_count ?? (Number(searchParams.get("sms") || searchParams.get("credits")) || 0)
  const bonusSms = order?.bonus_sms ?? 0
  const netAmount = order?.net_amount ?? 0
  const vatAmount = order?.vat_amount ?? 0
  const whtAmount = order?.wht_amount ?? 0
  const totalAmount = order?.total_amount ?? (Number(searchParams.get("total")) ?? 0)
  const payAmount = order?.pay_amount ?? totalAmount
  const orderNumber = order?.order_number ?? searchParams.get("txn") ?? ""
  const packageName = order?.package_name ?? ""
  const paidDate = order?.paid_at ? formatThaiDateOnly(order.paid_at) : formatThaiDateOnly(new Date())

  // Document links
  const documents = [
    {
      label: "ใบแจ้งหนี้",
      number: order?.invoice_number ?? null,
      url: order?.invoice_url ?? (order?.invoice_number ? `/api/v1/orders/${order.id}/documents/invoice` : null),
    },
    {
      label: "ใบกำกับภาษี",
      number: order?.tax_invoice_number ?? null,
      url: order?.tax_invoice_url ?? (order?.tax_invoice_number ? `/api/v1/orders/${order.id}/documents/tax-invoice` : null),
    },
    {
      label: "ใบเสร็จรับเงิน",
      number: order?.receipt_number ?? null,
      url: order?.receipt_url ?? (order?.receipt_number ? `/api/v1/orders/${order.id}/documents/receipt` : null),
    },
  ]

  const hasAnyDocument = documents.some((d) => d.number)

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-surface)" }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    )
  }

  if (!orderId || (fetchError && !order)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="w-full max-w-lg flex flex-col items-center gap-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(var(--error-rgb, 239,68,68), 0.1)", border: "1px solid rgba(var(--error-rgb, 239,68,68), 0.2)" }}
          >
            <AlertTriangle size={32} style={{ color: "var(--error, #ef4444)" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {!orderId ? "ไม่พบหมายเลขคำสั่งซื้อ" : "กรุณาตรวจสอบคำสั่งซื้อในหน้าประวัติการสั่งซื้อ"}
          </p>
          <button
            onClick={() => router.push("/dashboard/billing/orders")}
            className="px-6 py-2.5 text-sm font-medium rounded-lg transition-colors"
            style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          >
            ดูประวัติคำสั่งซื้อ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="w-full max-w-lg flex flex-col items-center gap-8">
        {/* Success Animation */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            <CheckCircle2 size={44} strokeWidth={2} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            ชำระเงินสำเร็จ!
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {smsQty > 0 ? `${formatNumber(smsQty + bonusSms)} SMS ถูกเพิ่มเข้าบัญชีแล้ว` : "การชำระเงินเสร็จสมบูรณ์"}
          </p>
        </div>

        {/* Receipt Card */}
        <div
          className="w-full rounded-lg p-6 flex flex-col gap-0"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="flex items-center gap-2 pb-4"
            style={{ color: "var(--text-primary)" }}
          >
            <Receipt size={18} />
            <span className="font-semibold text-base">สรุปคำสั่งซื้อ</span>
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          <div className="flex flex-col gap-3 py-4">
            {orderNumber && <ReceiptRow label="หมายเลขคำสั่งซื้อ" value={orderNumber} />}
            <ReceiptRow label="วันที่ชำระ" value={paidDate} />
            {packageName && <ReceiptRow label="แพ็กเกจ" value={packageName} />}
            <ReceiptRow label="จำนวน SMS" value={`${formatNumber(smsQty)} SMS`} />
            {bonusSms > 0 && (
              <ReceiptRow label="โบนัส SMS" value={`+${formatNumber(bonusSms)} SMS`} accent />
            )}
            <ReceiptRow label="วิธีชำระ" value="โอนเงิน + ยืนยันสลิป" />
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          <div className="flex flex-col gap-2 py-4">
            {netAmount > 0 && <ReceiptRow label="ยอดก่อน VAT" value={formatBaht(netAmount)} />}
            {vatAmount > 0 && <ReceiptRow label="VAT 7%" value={formatBaht(vatAmount)} />}
            {whtAmount > 0 && <ReceiptRow label="หัก ณ ที่จ่าย 3%" value={`-${formatBaht(whtAmount)}`} />}
          </div>

          <hr style={{ borderColor: "var(--border-default)" }} />

          <div className="flex items-center justify-between py-4">
            <span
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              ยอดที่ชำระ
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {formatBaht(payAmount)}
            </span>
          </div>

          {(smsQty > 0 || bonusSms > 0) && (
            <>
              <hr style={{ borderColor: "var(--border-default)" }} />
              <div className="flex items-center justify-between pt-4">
                <span style={{ color: "var(--text-secondary)" }} className="text-sm">
                  SMS ที่ได้รับทั้งหมด
                </span>
                <span
                  className="text-base font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  +{formatNumber(smsQty + bonusSms)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Documents Section */}
        {hasAnyDocument && (
          <div
            className="w-full rounded-lg p-6 flex flex-col gap-0"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              className="flex items-center gap-2 pb-4"
              style={{ color: "var(--text-primary)" }}
            >
              <FileText size={18} />
              <span className="font-semibold text-base">เอกสารของคุณ</span>
            </div>

            <hr style={{ borderColor: "var(--border-default)" }} />

            <div className="flex flex-col gap-2 pt-4">
              {documents.map((doc) => {
                if (!doc.number || !doc.url) return null
                return (
                  <div
                    key={doc.label}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-md"
                        style={{
                          width: 32,
                          height: 32,
                          background: "rgba(var(--accent-rgb),0.08)",
                        }}
                      >
                        <FileText size={16} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {doc.label}
                        </p>
                        <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                          {doc.number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-8 px-2"
                        style={{ color: "var(--text-secondary)" }}
                        onClick={() => openDocument(doc.url!)}
                      >
                        <Eye size={14} />
                        ดู
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-8 px-2"
                        style={{ color: "var(--accent)" }}
                        onClick={() => openDocument(doc.url! + (doc.url!.includes("?") ? "&" : "?") + "download=1")}
                      >
                        <Download size={14} />
                        PDF
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {orderId && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => router.push(`/dashboard/billing/orders/${orderId}`)}
            >
              <ExternalLink size={16} />
              ดูรายละเอียดคำสั่งซื้อ
            </Button>
          )}
          <Button
            className="w-full gap-2"
            style={{
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} />
            กลับหน้า Dashboard
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
          ใบเสร็จจะถูกส่งไปที่อีเมลของคุณด้วย
        </p>
      </div>
    </div>
  )
}

function ReceiptRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  )
}
