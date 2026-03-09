"use client";

import { useState } from "react";
import Link from "next/link";

type Message = {
  id: string;
  recipient: string;
  content: string;
  senderName: string;
  status: string;
  creditCost: number;
  createdAt: Date;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const statusConfig: Record<string, { badge: string; label: string }> = {
  delivered: { badge: "badge badge-success", label: "ส่งสำเร็จ" },
  sent: { badge: "badge badge-info", label: "ส่งแล้ว" },
  pending: { badge: "badge badge-warning", label: "รอส่ง" },
  failed: { badge: "badge badge-error", label: "ล้มเหลว" },
};

export default function MessagesClient({
  messages,
  pagination,
}: {
  messages: Message[];
  pagination: Pagination;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = messages.filter((msg) => {
    const matchSearch =
      !search ||
      msg.recipient.includes(search) ||
      msg.content.toLowerCase().includes(search.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || msg.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">ประวัติการส่ง</h2>
          <p className="text-sm text-white/40 mt-1">
            ประวัติการส่ง SMS ทั้งหมด ({pagination.total} รายการ)
          </p>
        </div>
        <Link
          href="/dashboard/send"
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2"
        >
          ส่ง SMS
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input-glass pl-10"
            placeholder="ค้นหาเบอร์โทร, ข้อความ, ชื่อผู้ส่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-glass cursor-pointer appearance-none pr-10 min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all" className="bg-[#0a0f1a] text-white">ทุกสถานะ</option>
            <option value="delivered" className="bg-[#0a0f1a] text-white">ส่งสำเร็จ</option>
            <option value="sent" className="bg-[#0a0f1a] text-white">ส่งแล้ว</option>
            <option value="pending" className="bg-[#0a0f1a] text-white">รอส่ง</option>
            <option value="failed" className="bg-[#0a0f1a] text-white">ล้มเหลว</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">ผู้รับ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">ข้อความ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">ชื่อผู้ส่ง</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">สถานะ</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">เครดิต</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((msg) => {
                  const status = statusConfig[msg.status] || statusConfig.pending;
                  return (
                    <tr key={msg.id} className="table-row">
                      <td className="px-5 py-3.5 text-white/70 font-mono text-xs">{msg.recipient}</td>
                      <td className="px-5 py-3.5 text-white/40 text-xs max-w-[200px] truncate hidden md:table-cell">{msg.content}</td>
                      <td className="px-5 py-3.5 text-white/50 text-xs">{msg.senderName}</td>
                      <td className="px-5 py-3.5">
                        <span className={status.badge}>{status.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-white/50 font-mono text-xs">{msg.creditCost}</td>
                      <td className="px-5 py-3.5 text-white/30 text-xs">
                        {new Date(msg.createdAt).toLocaleString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Result count */}
          <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between text-xs text-white/30">
            <span>
              {search || statusFilter !== "all"
                ? `พบ ${filtered.length} จาก ${messages.length} รายการ`
                : `หน้า ${pagination.page} จาก ${pagination.totalPages}`}
            </span>
            <span>{pagination.total} ข้อความทั้งหมด</span>
          </div>
        </div>
      ) : messages.length > 0 ? (
        /* No results from search */
        <div className="glass p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <p className="text-sm text-white/25 mb-1">ไม่พบผลลัพธ์</p>
          <p className="text-xs text-white/15">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
        </div>
      ) : (
        /* Empty state */
        <div className="glass p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="text-sm text-white/25 mb-1">ยังไม่มีข้อความ</p>
          <p className="text-xs text-white/15 mb-5">ส่ง SMS แรกของคุณเลย</p>
          <Link
            href="/dashboard/send"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            ส่ง SMS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
