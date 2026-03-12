"use client";

import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { FileText, Loader2, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/* ─── Zod Schema ─── */

const companySchema = z.object({
  companyName: z.string().min(1, "กรุณากรอกชื่อบริษัท"),
  taxId: z.string().regex(/^\d{13}$/, "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก"),
  branch: z.string().min(1),
  branchCode: z.string().regex(/^\d{5}$/, "รหัสสาขาต้องเป็นตัวเลข 5 หลัก"),
  address: z.string().min(1, "กรุณากรอกที่อยู่"),
});

const individualSchema = z.object({
  companyName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  taxId: z.string().regex(/^\d{13}$/, "เลขบัตรประชาชนต้องมี 13 หลัก"),
  branch: z.literal("INDIVIDUAL"),
  branchCode: z.literal("00000"),
  address: z.string().min(1, "กรุณากรอกที่อยู่"),
});

/* ─── Types ─── */

interface TaxProfile {
  isCompany: boolean;
  companyName: string;
  taxId: string;
  branchType: "headquarters" | "branch";
  branchNumber: string;
  address: string;
}

const INITIAL_PROFILE: TaxProfile = {
  isCompany: false,
  companyName: "",
  taxId: "",
  branchType: "headquarters",
  branchNumber: "",
  address: "",
};

/* ─── Helpers ─── */

function formatTaxId(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 1) return digits;
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 1));
  if (digits.length > 1) parts.push(digits.slice(1, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 12));
  if (digits.length > 12) parts.push(digits.slice(12, 13));
  return parts.join("-");
}

function unformatTaxId(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

/* ─── Component ─── */

export default function TaxProfileSection() {
  const [profile, setProfile] = useState<TaxProfile>(INITIAL_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isIndividualSaved, setIsIndividualSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch("/api/v1/settings/tax-profile");
      if (res.ok) {
        const data = await res.json();
        const tp = data?.taxProfile;
        if (tp) {
          const isIndividual = tp.branch === "INDIVIDUAL";
          if (isIndividual) {
            // Individual: fullName stored in companyName, idCard stored in taxId
            setProfile({
              isCompany: false,
              companyName: tp.companyName || "",
              taxId: tp.taxId ? formatTaxId(tp.taxId) : "",
              branchType: "headquarters",
              branchNumber: "",
              address: tp.address || "",
            });
            setIsIndividualSaved(true);
          } else {
            const isHq = !tp.branch || tp.branch === "สำนักงานใหญ่";
            setProfile({
              isCompany: true,
              companyName: tp.companyName || "",
              taxId: tp.taxId ? formatTaxId(tp.taxId) : "",
              branchType: isHq ? "headquarters" : "branch",
              branchNumber: tp.branchCode || "",
              address: tp.address || "",
            });
          }
        }
      }
    } catch {
      // No existing profile
    }
    setLoaded(true);
  }, [loaded]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleCompany = async (checked: boolean) => {
    // Clear form when switching types to prevent data mixing
    if (checked !== profile.isCompany) {
      setProfile({
        ...INITIAL_PROFILE,
        isCompany: checked,
      });
    }
    await loadProfile();
  };

  const handleTaxIdChange = (value: string) => {
    const digits = unformatTaxId(value);
    if (digits.length <= 13) {
      setProfile((p) => ({ ...p, taxId: formatTaxId(value) }));
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    const isIndividual = !profile.isCompany;

    const payload = isIndividual
      ? {
          companyName: profile.companyName.trim(), // fullName stored in companyName
          taxId: unformatTaxId(profile.taxId),     // idCard stored in taxId
          branch: "INDIVIDUAL" as const,
          branchCode: "00000" as const,
          address: profile.address.trim(),
        }
      : {
          companyName: profile.companyName.trim(),
          taxId: unformatTaxId(profile.taxId),
          branch: profile.branchType === "headquarters"
            ? "สำนักงานใหญ่"
            : `สาขาที่ ${profile.branchNumber}`,
          branchCode: profile.branchType === "headquarters"
            ? "00000"
            : profile.branchNumber.padStart(5, "0"),
          address: profile.address.trim(),
        };

    const schema = isIndividual ? individualSchema : companySchema;
    const result = schema.safeParse(payload);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/settings/tax-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      }
      setSaved(true);
      toast.success("บันทึกข้อมูลภาษีสำเร็จ");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 md:p-8">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
          <FileText size={16} className="text-[var(--accent)]" />
        </div>
        ข้อมูลภาษี
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-5 ml-[42px]">ข้อมูลสำหรับออกใบกำกับภาษี</p>

      {/* Customer type toggle */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleToggleCompany(false)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            !profile.isCompany
              ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)]"
              : "bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--text-muted)]"
          }`}
        >
          บุคคลธรรมดา
        </button>
        <button
          type="button"
          onClick={() => handleToggleCompany(true)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            profile.isCompany
              ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)]"
              : "bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--text-muted)]"
          }`}
        >
          นิติบุคคล
        </button>
      </div>

      {/* Individual form */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: !profile.isCompany ? "500px" : "0px",
          opacity: !profile.isCompany ? 1 : 0,
        }}
      >
        <div className="pt-3 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              ชื่อ-นามสกุล <span className="text-[var(--error)]">*</span>
            </label>
            <Input
              value={profile.companyName}
              onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="ชื่อ นามสกุล"
            />
          </div>

          {/* ID Card */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              เลขบัตรประชาชน <span className="text-[var(--error)]">*</span>
            </label>
            <Input
              value={profile.taxId}
              onChange={(e) => handleTaxIdChange(e.target.value)}
              placeholder="0-0000-00000-00-0"
              className="font-mono tracking-wider"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">เลขบัตรประชาชน 13 หลัก</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              ที่อยู่ <span className="text-[var(--error)]">*</span>
            </label>
            <Textarea
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error */}
          {error && !profile.isCompany && (
            <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.05)] border border-[rgba(var(--error-rgb,239,68,68),0.1)] rounded-lg px-3 py-2">
              <XCircle size={14} />
              {error}
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : saved ? (
              <>
                <Check size={14} />
                บันทึกแล้ว
              </>
            ) : (
              "บันทึก"
            )}
          </Button>
        </div>
      </div>

      {/* Company form */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: profile.isCompany ? "600px" : "0px",
          opacity: profile.isCompany ? 1 : 0,
        }}
      >
        <div className="pt-3 space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              ชื่อบริษัท <span className="text-[var(--error)]">*</span>
            </label>
            <Input
              value={profile.companyName}
              onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="บริษัท ... จำกัด"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              เลขประจำตัวผู้เสียภาษี (Tax ID) <span className="text-[var(--error)]">*</span>
            </label>
            <Input
              value={profile.taxId}
              onChange={(e) => handleTaxIdChange(e.target.value)}
              placeholder="0-0000-00000-00-0"
              className="font-mono tracking-wider"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">เลขประจำตัวผู้เสียภาษี 13 หลัก</p>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              สาขา
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, branchType: "headquarters", branchNumber: "" }))}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  profile.branchType === "headquarters"
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)]"
                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--text-muted)]"
                }`}
              >
                สำนักงานใหญ่
              </button>
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, branchType: "branch" }))}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  profile.branchType === "branch"
                    ? "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] border border-[rgba(var(--accent-rgb),0.3)]"
                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--text-muted)]"
                }`}
              >
                สาขาที่...
              </button>
              {profile.branchType === "branch" && (
                <Input
                  value={profile.branchNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, branchNumber: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                  placeholder="00001"
                  className="w-24 font-mono text-center"
                />
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
              ที่อยู่ <span className="text-[var(--error)]">*</span>
            </label>
            <Textarea
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error */}
          {error && profile.isCompany && (
            <div className="flex items-center gap-2 text-sm text-[var(--error)] bg-[rgba(var(--error-rgb,239,68,68),0.05)] border border-[rgba(var(--error-rgb,239,68,68),0.1)] rounded-lg px-3 py-2">
              <XCircle size={14} />
              {error}
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            style={{ background: "var(--accent)", color: "var(--text-on-accent)" }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : saved ? (
              <>
                <Check size={14} />
                บันทึกแล้ว
              </>
            ) : (
              "บันทึก"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
