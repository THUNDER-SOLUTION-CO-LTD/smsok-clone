"use client";

import { register } from "@/lib/actions";
import Link from "next/link";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await register(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 mesh-bg relative">
      {/* Extra ambient orb */}
      <div className="fixed top-[30%] right-[10%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-sky-400 transition-all group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-bold neon-blue">SMSOK</span>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="glass p-8 sm:p-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white mb-1">สมัครสมาชิก</h1>
            <p className="text-white/30 text-sm">สมัครฟรี รับ 500 เครดิตทันที</p>
          </div>

          {state?.error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm text-center animate-shake">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">ชื่อ-นามสกุล</label>
              <input type="text" name="name" required className="input-glass" placeholder="สมชาย ใจดี" />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">อีเมล</label>
              <input type="email" name="email" required className="input-glass" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">เบอร์โทร</label>
              <input type="tel" name="phone" className="input-glass" placeholder="0891234567" />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">รหัสผ่าน (8 ตัวขึ้นไป)</label>
              <input type="password" name="password" required minLength={8} className="input-glass" placeholder="••••••••" />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  กำลังสมัคร...
                </span>
              ) : (
                <>
                  สมัครฟรี — รับ 500 เครดิต
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/25 text-sm mt-6">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors">
              เข้าสู่ระบบ →
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
