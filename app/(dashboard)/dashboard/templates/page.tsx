import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TemplatesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold gradient-text-mixed mb-2">
          เทมเพลตข้อความ
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          สร้างและจัดการเทมเพลตข้อความสำเร็จรูป
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-violet p-10 text-center mb-8 card-hover">
        <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-[var(--accent-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          เร็วๆ นี้
        </h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
          ระบบเทมเพลตข้อความกำลังพัฒนา เพื่อให้คุณสร้างและจัดการข้อความสำเร็จรูปได้อย่างง่ายดาย
        </p>
      </div>

      {/* Feature Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children mb-8">
        {/* Card 1 */}
        <div className="glass p-6 card-hover">
          <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[var(--accent-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            สร้างเทมเพลต
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            สร้างข้อความสำเร็จรูปพร้อมตัวแปร
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass p-6 card-hover">
          <div className="w-12 h-12 rounded-xl bg-[rgba(34,211,238,0.1)] flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            ตัวแปรอัตโนมัติ
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {"แทรก {name}, {code}, {date} อัตโนมัติ"}
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass p-6 card-hover">
          <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[var(--success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            แชร์กับทีม
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            ใช้เทมเพลตร่วมกันทั้งองค์กร
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="btn-glass px-5 py-2.5 text-sm font-medium"
        >
          กลับแดชบอร์ด
        </Link>
        <Link
          href="/dashboard/send"
          className="btn-primary px-5 py-2.5 text-sm font-medium"
        >
          ส่ง SMS ตอนนี้
        </Link>
      </div>
    </div>
  );
}
