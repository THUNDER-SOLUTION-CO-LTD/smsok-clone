import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OtpPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold gradient-text-mixed mb-2">OTP API</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          สร้างและยืนยันรหัส OTP ผ่าน API
        </p>
      </div>

      {/* Endpoints */}
      <div className="glass p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">API Endpoints</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-violet-400 bg-violet-500/10">POST</span>
            <code className="text-[13px] font-mono text-[var(--text-secondary)] flex-1">/api/v1/otp/generate</code>
            <span className="text-[12px] text-[var(--text-muted)]">สร้างรหัส OTP</span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-violet-400 bg-violet-500/10">POST</span>
            <code className="text-[13px] font-mono text-[var(--text-secondary)] flex-1">/api/v1/otp/verify</code>
            <span className="text-[12px] text-[var(--text-muted)]">ยืนยันรหัส OTP</span>
          </div>
        </div>
      </div>

      {/* Generate Example */}
      <div className="glass p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">สร้างรหัส OTP</h2>
        <div className="rounded-xl p-4 overflow-x-auto" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <pre className="text-[12px] font-mono text-cyan-400/80 whitespace-pre">{`curl -X POST https://api.smsok.com/api/v1/otp/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "0891234567", "length": 6, "expiresIn": 300}'`}</pre>
        </div>
        <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">Response:</p>
          <pre className="text-[12px] font-mono text-emerald-400/80 whitespace-pre">{`{"success": true, "refCode": "ABC123", "expiresAt": "2024-01-01T00:05:00Z"}`}</pre>
        </div>
      </div>

      {/* Verify Example */}
      <div className="glass p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ยืนยันรหัส OTP</h2>
        <div className="rounded-xl p-4 overflow-x-auto" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <pre className="text-[12px] font-mono text-cyan-400/80 whitespace-pre">{`curl -X POST https://api.smsok.com/api/v1/otp/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "0891234567", "otpCode": "123456", "refCode": "ABC123"}'`}</pre>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/api-docs" className="btn-glass px-5 py-2.5 text-sm font-medium">
          ดู API Docs ทั้งหมด
        </Link>
        <Link href="/dashboard/api-keys" className="btn-primary px-5 py-2.5 text-sm font-medium">
          สร้าง API Key
        </Link>
      </div>
    </div>
  );
}
