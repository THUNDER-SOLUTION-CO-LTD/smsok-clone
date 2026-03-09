"use client";

import { useState } from "react";

const packages = [
  { name: "A", price: 500, bonus: 0, total: 500, sms: 2273, cost: "0.220", senders: 5, duration: "6 เดือน", best: false },
  { name: "B", price: 1000, bonus: 10, total: 1100, sms: 5000, cost: "0.200", senders: 10, duration: "12 เดือน", best: false },
  { name: "C", price: 10000, bonus: 15, total: 11500, sms: 52273, cost: "0.191", senders: 15, duration: "24 เดือน", best: true },
  { name: "D", price: 50000, bonus: 20, total: 60000, sms: 272727, cost: "0.183", senders: 20, duration: "24 เดือน", best: false },
  { name: "E", price: 100000, bonus: 25, total: 125000, sms: 568182, cost: "0.176", senders: -1, duration: "36 เดือน", best: false },
  { name: "F", price: 300000, bonus: 30, total: 390000, sms: 1772727, cost: "0.169", senders: -1, duration: "36 เดือน", best: false },
  { name: "G", price: 500000, bonus: 40, total: 700000, sms: 3181818, cost: "0.157", senders: -1, duration: "36 เดือน", best: false },
  { name: "H", price: 1000000, bonus: 50, total: 1500000, sms: 6818182, cost: "0.147", senders: -1, duration: "36 เดือน", best: false },
];

const benefits = [
  {
    title: "ราคาถูกที่สุด",
    desc: "เริ่มต้นเพียง 0.147 บาท/SMS",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "ส่งเร็วทันใจ",
    desc: "ส่งถึงปลายทางภายใน 3 วินาที",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "ทดลองฟรี",
    desc: "สมัครวันนี้รับฟรี 500 เครดิต",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    title: "ซัพพอร์ต 24/7",
    desc: "ทีมงานพร้อมช่วยเหลือตลอด",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "SMS API",
    desc: "เชื่อมต่อง่ายด้วย RESTful API",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "ส่ง SMS ผ่านเว็บ",
    desc: "พิมพ์ข้อความ เลือกเบอร์ กดส่ง — ง่ายแค่นั้น",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    title: "SMS API",
    desc: "RESTful API พร้อม SDK สำหรับ Node.js, Python, PHP",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "สมุดโทรศัพท์",
    desc: "จัดการรายชื่อ กลุ่ม นำเข้า CSV ได้",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    title: "รายงาน Realtime",
    desc: "ติดตามสถานะ SMS แบบเรียลไทม์ Export CSV ได้",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const faqs = [
  { q: "ทดลองใช้ได้ไหม?", a: "สมัครฟรีวันนี้ ได้ 500 เครดิตทดลองส่ง SMS ทันที ไม่ต้องเติมเงิน" },
  { q: "Sender name ใช้เวลาอนุมัตินานไหม?", a: "1-2 วันทำการ ระหว่างรออนุมัติสามารถใช้ชื่อ default ส่ง SMS ได้เลย" },
  { q: "ชำระเงินยังไง?", a: "รองรับโอนเงินผ่านธนาคาร, PromptPay QR Code — ยืนยันสลิปอัตโนมัติ" },
  { q: "เบอร์ถูก block ทำยังไง?", a: "ติดต่อทีม support เพื่อทำ whitelist ให้ฟรี" },
  { q: "API รองรับภาษาอะไร?", a: "RESTful API รองรับทุกภาษาโปรแกรม มี SDK สำหรับ Node.js, Python, PHP" },
];

function fmt(n: number) {
  return n.toLocaleString("th-TH");
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }} />

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 bg-[#06060C]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold neon-purple">SMSOK</span>
            <span className="text-xs text-white/30 font-medium tracking-widest">CLONE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#why" className="hover:text-white transition-colors">ทำไมต้องเรา</a>
            <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
            <a href="#pricing" className="hover:text-white transition-colors">ราคา</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="btn-glass px-4 py-2 text-sm">เข้าสู่ระบบ</a>
            <a href="/register" className="btn-primary px-4 py-2 text-sm">สมัครฟรี</a>
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/60 hover:text-white transition-colors p-2 cursor-pointer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-3">
            <a href="#why" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-2 transition-colors">ทำไมต้องเรา</a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-2 transition-colors">ฟีเจอร์</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-2 transition-colors">ราคา</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white py-2 transition-colors">FAQ</a>
            <div className="flex gap-3 pt-2">
              <a href="/login" className="btn-glass px-4 py-2 text-sm flex-1 text-center">เข้าสู่ระบบ</a>
              <a href="/register" className="btn-primary px-4 py-2 text-sm flex-1 text-center">สมัครฟรี</a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-sm font-medium">
            ส่ง SMS ง่าย รวดเร็ว ราคาถูก
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">แพลตฟอร์มส่ง</span>{" "}
            <span className="neon-purple">SMS</span>
            <br />
            <span className="text-white/80">ที่ธุรกิจไว้วางใจ</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            ส่ง SMS ผ่านเว็บหรือ API ได้ทันที ราคาเริ่มต้น 0.147 บาท/ข้อความ
            <br />สมัครวันนี้รับฟรี 500 เครดิต
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center">
              สมัครฟรี — รับ 500 เครดิต
            </a>
            <a href="#pricing" className="btn-glass px-8 py-3.5 text-base rounded-xl w-full sm:w-auto text-center">
              ดูราคา
            </a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-white/30">
            <span>✓ ไม่มีค่าแรกเข้า</span>
            <span>✓ เริ่มใช้ได้ทันที</span>
            <span>✓ ซัพพอร์ต 24/7</span>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ทำไมต้อง <span className="neon-purple">SMSOK</span>?
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-xl mx-auto">
            บริการส่ง SMS ที่ครบทุกฟีเจอร์ ในราคาที่ถูกที่สุด
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="glass p-6 text-center group hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                <div className="text-purple-400/70 mb-4 flex justify-center group-hover:text-purple-400 transition-colors">{b.icon}</div>
                <h3 className="font-semibold text-white mb-2 text-sm md:text-base">{b.title}</h3>
                <p className="text-xs md:text-sm text-white/40">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ฟีเจอร์<span className="neon-violet">ครบ</span>ทุกความต้องการ
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-xl mx-auto">
            ไม่ว่าจะส่งผ่านเว็บหรือ API เรามีทุกอย่างที่คุณต้องการ
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass p-8 flex gap-5 group hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                <div className="text-violet-400/60 flex-shrink-0 group-hover:text-violet-400 transition-colors">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            เลือก<span className="neon-purple">แพ็กเกจ</span>ที่เหมาะกับคุณ
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-xl mx-auto">
            ยิ่งซื้อมาก ยิ่งถูก — โบนัสสูงสุด 50%
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`glass p-6 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.12)] ${
                  pkg.best ? "border-purple-500/40 shadow-[0_0_40px_rgba(139,92,246,0.15)] scale-[1.02]" : ""
                }`}
              >
                {pkg.best && (
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                    Best Seller
                  </div>
                )}
                <div className="text-sm text-white/40 mb-1">SMSOK {pkg.name}</div>
                <div className="text-3xl font-bold text-white mb-1">
                  ฿{fmt(pkg.price)}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-sm text-green-400 mb-4">+{pkg.bonus}% โบนัส</div>
                )}
                {pkg.bonus === 0 && <div className="mb-4" />}
                <div className="space-y-2 text-sm text-white/50 flex-1">
                  <div className="flex justify-between">
                    <span>SMS</span>
                    <span className="text-white">{fmt(pkg.sms)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ราคา/SMS</span>
                    <span className="text-white">฿{pkg.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sender Names</span>
                    <span className="text-white">{pkg.senders === -1 ? "ไม่จำกัด" : pkg.senders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ระยะเวลา</span>
                    <span className="text-white">{pkg.duration}</span>
                  </div>
                </div>
                <button
                  className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                    pkg.best
                      ? "btn-primary"
                      : "btn-glass"
                  }`}
                >
                  เลือกแพ็กเกจ
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto glass p-12 text-center relative overflow-hidden" style={{ animation: "pulse-glow 4s ease-in-out infinite" }}>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ต้องการแพ็กเกจพิเศษ?
          </h2>
          <p className="text-white/40 mb-8">
            สำหรับธุรกิจที่ส่ง SMS มากกว่า 1 ล้านข้อความ/เดือน ติดต่อเราเพื่อรับราคาพิเศษ
          </p>
          <button className="btn-primary px-8 py-3.5 text-base rounded-xl cursor-pointer">
            ติดต่อฝ่ายขาย
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            คำถาม<span className="neon-violet">ที่พบบ่อย</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="glass group">
                <summary className="p-6 cursor-pointer font-semibold text-white flex items-center justify-between list-none">
                  {faq.q}
                  <span className="text-white/30 group-open:rotate-45 transition-transform duration-200 text-xl">+</span>
                </summary>
                <div className="px-6 pb-6 text-white/50 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold neon-purple">SMSOK</span>
            <span className="text-xs text-white/30 tracking-widest">CLONE</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white transition-colors">เงื่อนไขการใช้งาน</a>
            <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-white transition-colors">ติดต่อเรา</a>
          </div>
          <div className="text-sm text-white/20">
            &copy; 2026 SMSOK Clone
          </div>
        </div>
      </footer>
    </div>
  );
}
