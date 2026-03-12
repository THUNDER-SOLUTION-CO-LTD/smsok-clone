import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Good / Bad Example ──

function ExampleBadge({
  label,
  good,
}: {
  label: string;
  good: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-mono font-medium border ${
        good
          ? "bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)] border-[rgba(var(--accent-rgb),0.2)]"
          : "bg-[rgba(var(--error-rgb,239,68,68),0.08)] text-[var(--error)] border-[rgba(var(--error-rgb,239,68,68),0.2)]"
      }`}
    >
      {good ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

// ── Section ──

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg p-6 bg-[var(--bg-surface)] border border-[var(--border-default)]">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
        <Icon size={20} className="text-[var(--accent)]" />
        {title}
      </h2>
      <div className="space-y-3 text-sm text-[var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

// ── Bullet ──

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-[var(--accent)]" />
      <span>{children}</span>
    </div>
  );
}

// ── Main Page ──

export default function SenderNameGuidePage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/dashboard/senders"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70 text-[var(--text-muted)]"
        >
          <ArrowLeft size={16} />
          กลับหน้า Sender Names
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            วิธีตั้งชื่อผู้ส่งที่ดี
          </h1>
          <p className="text-sm mt-2 text-[var(--text-muted)]">
            คู่มือตั้ง Sender Name สำหรับ SMS ในประเทศไทย
          </p>
        </div>

        <div className="space-y-6">
          {/* กฎพื้นฐาน */}
          <Section icon={Shield} title="กฎพื้นฐาน">
            <Bullet>
              ความยาว <strong className="text-[var(--text-primary)]">3-11 ตัวอักษร</strong> เท่านั้น
            </Bullet>
            <Bullet>
              ใช้ได้เฉพาะ <strong className="text-[var(--text-primary)]">A-Z, a-z, 0-9</strong> และช่องว่าง
            </Bullet>
            <Bullet>
              ห้ามใช้อักขระพิเศษ เช่น <code className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--error)]">! @ # $ % & *</code>
            </Bullet>
            <Bullet>
              ห้ามขึ้นต้นด้วยช่องว่าง หรือตัวเลข
            </Bullet>
            <Bullet>
              ห้ามใช้คำที่เป็นชื่อหน่วยงานราชการ ธนาคาร หรือแบรนด์อื่นที่ไม่ใช่ของคุณ
            </Bullet>
          </Section>

          {/* ตัวอย่าง */}
          <Section icon={MessageSquare} title="ตัวอย่าง">
            <p className="font-medium text-[var(--text-primary)]">
              ชื่อที่ดี
            </p>
            <div className="flex flex-wrap gap-2">
              <ExampleBadge label="SMSOK" good />
              <ExampleBadge label="MyShop" good />
              <ExampleBadge label="BankABC" good />
              <ExampleBadge label="ThaiMart" good />
              <ExampleBadge label="OTP Svc" good />
            </div>

            <p className="font-medium mt-4 text-[var(--text-primary)]">
              ชื่อที่ไม่ดี
            </p>
            <div className="flex flex-wrap gap-2">
              <ExampleBadge label="0812345678" good={false} />
              <ExampleBadge label="!!SALE!!" good={false} />
              <ExampleBadge label="AB" good={false} />
              <ExampleBadge label="ชื่อยาวเกินสิบเอ็ด" good={false} />
              <ExampleBadge label="SCB Bank" good={false} />
            </div>
          </Section>

          {/* ข้อจำกัด Operator */}
          <Section icon={Smartphone} title="ข้อจำกัด Operator ไทย">
            <div className="rounded-lg overflow-hidden border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-base)]">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-muted)]">
                      Operator
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-muted)]">
                      ข้อกำหนด
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { op: "AIS", rule: "ต้องลงทะเบียนชื่อก่อนใช้งาน ใช้เวลา 1-3 วันทำการ" },
                    { op: "True", rule: "ต้องลงทะเบียนชื่อก่อนใช้งาน ใช้เวลา 1-3 วันทำการ" },
                    { op: "dtac", rule: "ต้องลงทะเบียนชื่อก่อนใช้งาน ใช้เวลา 1-3 วันทำการ" },
                    { op: "NT", rule: "ใช้ชื่อที่ลงทะเบียนกับ operator อื่นได้" },
                  ].map((row) => (
                    <tr
                      key={row.op}
                      className="border-t border-[var(--border-default)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {row.op}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {row.rule}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 rounded-lg p-3 mt-2 bg-[rgba(var(--warning-rgb,245,158,11),0.05)] border border-[rgba(var(--warning-rgb,245,158,11),0.15)]">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[var(--warning)]" />
              <p className="text-xs text-[var(--warning)]">
                Operator ทุกรายในไทยกำหนดให้ต้อง <strong>ลงทะเบียน Sender Name ก่อนใช้งาน</strong> ตามข้อกำหนดของ กสทช.
                ส่งคำขอผ่าน SMSOK แล้วเราจะดำเนินการลงทะเบียนให้
              </p>
            </div>
          </Section>

          {/* Tips */}
          <Section icon={CheckCircle2} title="เคล็ดลับตั้งชื่อให้ผ่านอนุมัติเร็ว">
            <Bullet>
              ใช้ชื่อที่ตรงกับ <strong className="text-[var(--text-primary)]">ชื่อธุรกิจ/แบรนด์จริง</strong> ของคุณ
            </Bullet>
            <Bullet>
              ระบุ <strong className="text-[var(--text-primary)]">วัตถุประสงค์การใช้งาน</strong> ให้ชัดเจน เช่น &ldquo;ส่ง OTP&rdquo; หรือ &ldquo;แจ้งโปรโมชัน&rdquo;
            </Bullet>
            <Bullet>
              หลีกเลี่ยงชื่อที่อาจสับสนกับหน่วยงานราชการ ธนาคาร หรือแบรนด์ดัง
            </Bullet>
            <Bullet>
              ชื่อสั้น กระชับ จดจำง่าย ดีกว่าชื่อยาว
            </Bullet>
            <Bullet>
              เตรียมเอกสารยืนยันตัวตนธุรกิจ (ทะเบียนบริษัท/ร้านค้า) เผื่อถูกขอเพิ่มเติม
            </Bullet>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
            render={<Link href="/dashboard/senders" />}
          >
            ยื่นคำขอ Sender Name
          </Button>
        </div>
      </div>
    </div>
  );
}
