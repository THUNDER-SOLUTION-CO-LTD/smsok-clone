"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  Check,
  Building2,
  User,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Loader2,
  Upload,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  // Step 1: Company Profile
  companyName: string;
  taxId: string;
  industry: string;
  logoFile: File | null;
  logoPreview: string | null;
  // Step 2: Sender Name
  senderName: string;
  // Step 3: Test SMS
  testPhone: string;
  testSending: boolean;
  testStatus: "idle" | "sending" | "delivered" | "success" | "error";
  testError: string | null;
}

const INDUSTRY_OPTIONS = [
  { value: "ecommerce", label: "อีคอมเมิร์ซ" },
  { value: "finance", label: "การเงิน / ธนาคาร" },
  { value: "healthcare", label: "สุขภาพ / การแพทย์" },
  { value: "education", label: "การศึกษา" },
  { value: "realestate", label: "อสังหาริมทรัพย์" },
  { value: "food", label: "อาหาร / ร้านอาหาร" },
  { value: "retail", label: "ค้าปลีก" },
  { value: "logistics", label: "ขนส่ง / โลจิสติกส์" },
  { value: "technology", label: "เทคโนโลยี" },
  { value: "marketing", label: "การตลาด / โฆษณา" },
  { value: "government", label: "หน่วยงานรัฐ" },
  { value: "other", label: "อื่นๆ" },
];

const ONBOARDING_KEY = "smsok_onboarding_completed";

// ─── Confetti Effect ──────────────────────────────────────────────────────────

function ConfettiEffect() {
  const COLORS = [
    "var(--accent)",
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#A78BFA",
    "#F472B6",
    "#34D399",
    "#FBBF24",
  ];

  const [particles, setParticles] = useState<
    { left: number; delay: number; duration: number; size: number; color: string; rotation: number; round: boolean }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        rotation: Math.random() * 720,
        round: Math.random() > 0.5,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {particles.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: "-10px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.round ? "50%" : "2px",
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              transform: `rotate(${p.rotation}deg)`,
              opacity: 0,
            }}
          />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.3); }
        }
      `}</style>
    </div>
  );
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────

const STEP_LABELS = ["ข้อมูลบริษัท", "ชื่อผู้ส่ง", "ทดสอบ SMS"];

function StepProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  backgroundColor:
                    isCompleted || isActive ? "var(--accent)" : "transparent",
                  border:
                    isCompleted || isActive
                      ? "2px solid var(--accent)"
                      : "2px solid var(--border-default)",
                  color:
                    isCompleted || isActive
                      ? "var(--text-on-accent)"
                      : "var(--text-muted)",
                }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span>{step}</span>}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                  color: isActive
                    ? "var(--accent)"
                    : isCompleted
                      ? "var(--text-secondary)"
                      : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </div>

            {idx < STEP_LABELS.length - 1 && (
              <div
                className="w-16 h-0.5 mx-2 mb-5 transition-all duration-300"
                style={{
                  backgroundColor:
                    step < currentStep ? "var(--accent)" : "var(--border-default)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Company Profile ─────────────────────────────────────────────────

function Step1({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ logoFile: file, logoPreview: URL.createObjectURL(file) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          ข้อมูลบริษัท
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          กรอกข้อมูลพื้นฐานของบริษัทเพื่อเริ่มต้นใช้งาน
        </p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          ชื่อบริษัท <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <div className="relative">
          <Building2
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            className="pl-9"
            placeholder="บริษัท ตัวอย่าง จำกัด"
            value={state.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </div>
      </div>

      {/* Tax ID (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          เลขประจำตัวผู้เสียภาษี{" "}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            (ไม่บังคับ)
          </span>
        </label>
        <Input
          placeholder="0123456789012"
          maxLength={13}
          value={state.taxId}
          onChange={(e) => onChange({ taxId: e.target.value.replace(/\D/g, "") })}
        />
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          ประเภทธุรกิจ
        </label>
        <CustomSelect
          value={state.industry}
          onChange={(v) => onChange({ industry: v })}
          options={INDUSTRY_OPTIONS}
          placeholder="เลือกประเภทธุรกิจ..."
        />
      </div>

      {/* Logo Upload (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          โลโก้บริษัท{" "}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            (ไม่บังคับ)
          </span>
        </label>
        <div className="flex items-center gap-4">
          {/* Avatar preview */}
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "2px dashed var(--border-default)",
            }}
          >
            {state.logoPreview ? (
              <Image
                src={state.logoPreview}
                alt="Logo preview"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Building2 className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <span
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                อัปโหลด
              </span>
            </label>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              PNG, JPG ขนาดไม่เกิน 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Sender Name ─────────────────────────────────────────────────────

function Step2({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  const sanitized = state.senderName.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const isValid = sanitized.length >= 3 && sanitized.length <= 11;
  const tooShort = sanitized.length > 0 && sanitized.length < 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          ตั้งชื่อ Sender Name
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ชื่อที่ผู้รับจะเห็นแทนเบอร์โทรศัพท์ของคุณ
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Sender Name (3–11 ตัวอักษร, ภาษาอังกฤษ/ตัวเลข)
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            className="pl-9 uppercase tracking-widest"
            placeholder="MYSENDER"
            value={sanitized}
            maxLength={11}
            onChange={(e) =>
              onChange({
                senderName: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
              })
            }
          />
        </div>

        {tooShort && (
          <p className="text-xs text-[var(--error)]">ต้องมีอย่างน้อย 3 ตัวอักษร</p>
        )}
        {isValid && (
          <p className="text-xs" style={{ color: "var(--accent)" }}>
            ✓ รูปแบบถูกต้อง
          </p>
        )}
      </div>

      {/* Preview */}
      {sanitized.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            ตัวอย่างที่ผู้รับจะเห็น
          </p>
          {/* Phone mockup */}
          <div
            className="mx-auto max-w-[240px] rounded-2xl p-4"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "2px solid var(--border-default)",
            }}
          >
            <div className="text-center mb-3">
              <div
                className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1"
                style={{ backgroundColor: "var(--accent)", color: "var(--text-on-accent)" }}
              >
                {sanitized.charAt(0)}
              </div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {sanitized}
              </p>
            </div>
            <div
              className="rounded-lg p-2.5 text-xs"
              style={{
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              สวัสดีครับ นี่คือข้อความทดสอบจาก {sanitized}
            </div>
          </div>
        </div>
      )}

      {/* Info card */}
      <div
        className="rounded-lg p-4 flex gap-3"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
        }}
      >
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            ขั้นตอนการอนุมัติ
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            ชื่อผู้ส่งต้องได้รับอนุมัติจาก NBTC (1–3 วันทำการ)
            ในระหว่างนี้คุณยังสามารถส่ง SMS ด้วยเบอร์โทรศัพท์ปกติได้
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Test SMS ────────────────────────────────────────────────────────

function Step3({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  async function handleSend() {
    onChange({ testSending: true, testStatus: "sending", testError: null });

    try {
      const res = await fetch("/api/v1/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: state.testPhone,
          message: `ยินดีต้อนรับสู่ SMSOK! นี่คือ SMS ทดสอบจาก ${state.senderName || "SMSOK"}`,
          sender: state.senderName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `ส่งไม่สำเร็จ (${res.status})`);
      }

      // Simulate delivery status progression
      onChange({ testStatus: "delivered" });
      setTimeout(() => {
        onChange({ testStatus: "success", testSending: false });
      }, 1500);
    } catch (err) {
      onChange({
        testSending: false,
        testStatus: "error",
        testError: err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง",
      });
    }
  }

  const statusConfig = {
    idle: { label: "", color: "" },
    sending: { label: "กำลังส่ง...", color: "var(--text-muted)" },
    delivered: { label: "ส่งสำเร็จ กำลังรอการนำส่ง...", color: "var(--accent)" },
    success: { label: "นำส่งสำเร็จ!", color: "var(--accent)" },
    error: { label: state.testError || "เกิดข้อผิดพลาด", color: "var(--error)" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          ทดสอบส่ง SMS
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ส่ง SMS ทดสอบไปยังเบอร์ของคุณเพื่อตรวจสอบการตั้งค่า
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            เบอร์ทดสอบ
          </label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <Input
              type="tel"
              className="pl-9"
              placeholder="0812345678"
              maxLength={10}
              value={state.testPhone}
              onChange={(e) =>
                onChange({ testPhone: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>
        </div>
      </div>

      {/* Status display */}
      {state.testStatus !== "idle" && (
        <div
          className="rounded-lg p-4 flex items-center gap-3 transition-all"
          style={{
            backgroundColor:
              state.testStatus === "success"
                ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                : state.testStatus === "error"
                  ? "color-mix(in srgb, var(--error) 10%, transparent)"
                  : "var(--bg-base)",
            border: `1px solid ${
              state.testStatus === "success"
                ? "var(--accent)"
                : state.testStatus === "error"
                  ? "var(--error)"
                  : "var(--border-default)"
            }`,
          }}
        >
          {state.testStatus === "sending" && (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
          )}
          {state.testStatus === "delivered" && (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
          )}
          {state.testStatus === "success" && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Check className="w-4 h-4" style={{ color: "var(--text-on-accent)" }} />
            </div>
          )}
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: statusConfig[state.testStatus].color }}
            >
              {statusConfig[state.testStatus].label}
            </p>
            {state.testStatus === "success" && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                ตรวจสอบ SMS ที่เบอร์ {state.testPhone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Send button */}
      {state.testStatus !== "success" && (
        <Button
          className="w-full font-semibold"
          disabled={state.testPhone.length < 9 || state.testSending}
          onClick={handleSend}
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--text-on-accent)",
          }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {state.testSending ? "กำลังส่ง..." : "ส่ง SMS ทดสอบ"}
        </Button>
      )}

      {/* Skip option */}
      {state.testStatus === "idle" && (
        <p className="text-center">
          <button
            type="button"
            className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
            onClick={() => onChange({ testStatus: "success", testSending: false })}
          >
            ข้ามขั้นตอนนี้
          </button>
        </p>
      )}
    </div>
  );
}

// ─── Completion Card ──────────────────────────────────────────────────────────

function CompletionCard({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="text-center space-y-6 py-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
      >
        <PartyPopper className="w-10 h-10" style={{ color: "var(--accent)" }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ยินดีด้วย!
        </h2>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          คุณพร้อมใช้งาน SMSOK แล้ว
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          เราจะพาคุณชมหน้า Dashboard เพื่อเริ่มต้นใช้งาน
        </p>
      </div>

      <Button
        size="lg"
        className="w-full font-semibold"
        onClick={onGoToDashboard}
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--text-on-accent)",
        }}
      >
        เริ่มใช้งาน
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wizardState, setWizardState] = useState<WizardState>({
    companyName: "",
    taxId: "",
    industry: "",
    logoFile: null,
    logoPreview: null,
    senderName: "",
    testPhone: "",
    testSending: false,
    testStatus: "idle",
    testError: null,
  });

  // Check if onboarding already completed → redirect
  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (done === "true") {
      router.replace("/dashboard");
    }
  }, [router]);

  const updateState = useCallback((patch: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }, []);

  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    } else {
      // Mark onboarding as done
      localStorage.setItem(ONBOARDING_KEY, "true");
      setShowConfetti(true);
      setCompleted(true);
      // Hide confetti after 4 seconds
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleGoToDashboard() {
    // Set flag to show tour on dashboard
    localStorage.setItem("smsok_show_tour", "true");
    router.push("/dashboard");
  }

  function handleSkip() {
    handleNext();
  }

  const canProceed = (() => {
    if (currentStep === 1) return wizardState.companyName.trim().length >= 2;
    if (currentStep === 2) return wizardState.senderName.length >= 3;
    if (currentStep === 3) return wizardState.testStatus === "success";
    return true;
  })();

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-10"
      style={{ backgroundColor: "var(--bg-base, var(--bg-surface))" }}
    >
      {showConfetti && <ConfettiEffect />}

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            ยินดีต้อนรับสู่ SMSOK
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            ตั้งค่าง่ายๆ ใน 3 ขั้นตอน พร้อมส่ง SMS ทันที
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-8 shadow-sm"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {completed ? (
            <CompletionCard onGoToDashboard={handleGoToDashboard} />
          ) : (
            <>
              <StepProgressBar currentStep={currentStep} />

              {/* Step Content */}
              <div className="min-h-[380px]">
                {currentStep === 1 && <Step1 state={wizardState} onChange={updateState} />}
                {currentStep === 2 && <Step2 state={wizardState} onChange={updateState} />}
                {currentStep === 3 && <Step3 state={wizardState} onChange={updateState} />}
              </div>

              {/* Navigation */}
              <div
                className="flex items-center justify-between mt-8 pt-6"
                style={{ borderTop: "1px solid var(--border-default)" }}
              >
                <div>
                  {currentStep > 1 ? (
                    <Button variant="outline" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      ย้อนกลับ
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Skip link */}
                  {currentStep === 1 && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-sm underline underline-offset-2 transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ข้ามไปก่อน
                    </button>
                  )}

                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ขั้นตอน {currentStep}/3
                  </span>

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    style={{
                      backgroundColor: canProceed ? "var(--accent)" : undefined,
                      color: canProceed ? "var(--text-on-accent)" : undefined,
                    }}
                  >
                    {currentStep === 3 ? "เสร็จสิ้น" : "ถัดไป"}
                    {currentStep < 3 && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
