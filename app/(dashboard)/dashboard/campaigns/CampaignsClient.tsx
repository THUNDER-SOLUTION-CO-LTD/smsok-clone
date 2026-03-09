"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CampaignsClient() {
  return (
    <motion.div
      className="p-6 md:p-8 max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="glass p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Campaigns
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight gradient-text-mixed">
              จัดการแคมเปญได้จากศูนย์กลางเดียว
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              หน้านี้ถูกเตรียมไว้สำหรับ workflow การส่งแบบเป็นชุดและติดตามผลรายแคมเปญ
              ระหว่างนี้สามารถเริ่มส่งข้อความจากหน้า Send และตรวจผลลัพธ์ย้อนหลังได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/send"
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              ส่งข้อความตอนนี้
            </Link>
            <Link
              href="/dashboard/messages"
              className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              ดูประวัติการส่ง
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
