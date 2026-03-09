"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/settings";
import { blockNonNumeric, fieldCls } from "@/lib/form-utils";

type Props = {
  userId: string;
  initialName: string;
  initialPhone: string;
};

export default function ProfileEditForm({ userId, initialName, initialPhone }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [phoneError, setPhoneError] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function validatePhone(value: string) {
    if (value && !/^0[689]\d{8}$/.test(value)) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง (ตัวอย่าง: 0891234567)");
    } else {
      setPhoneError("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || phoneError) return;
    setResult(null);
    startTransition(async () => {
      try {
        await updateProfile(userId, { name: name.trim(), phone: phone || undefined });
        setResult({ type: "success", message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
      } catch (err) {
        setResult({ type: "error", message: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">ชื่อ</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldCls(name.trim().length < 2 && name.length > 0 ? "ชื่อสั้นเกินไป" : undefined, name)}
            placeholder="สมชาย ใจดี"
          />
          {name.trim().length < 2 && name.length > 0 && (
            <p className="text-red-400 text-xs mt-1">ชื่อต้องมีอย่างน้อย 2 ตัวอักษร</p>
          )}
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-medium">
            เบอร์โทรศัพท์
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onKeyDown={blockNonNumeric}
            onChange={(e) => { setPhone(e.target.value); validatePhone(e.target.value); }}
            className={fieldCls(phoneError, phone)}
            placeholder="0891234567"
          />
          {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
        </div>
      </div>

      {result && (
        <p className={`text-xs font-medium ${result.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {result.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending || !name.trim() || name.trim().length < 2 || !!phoneError}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            "บันทึกข้อมูล"
          )}
        </button>
      </div>
    </form>
  );
}
