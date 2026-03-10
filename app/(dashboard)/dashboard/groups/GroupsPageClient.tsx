"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createGroup, updateGroup, deleteGroup } from "@/lib/actions/groups";

type Group = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { members: number };
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariant = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

export default function GroupsPageClient({ userId, initialGroups }: { userId: string; initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openCreate() { setName(""); setEditId(null); setError(""); setShowForm(true); }
  function openEdit(g: Group) { setName(g.name); setEditId(g.id); setError(""); setShowForm(true); }

  function handleSave() {
    if (!name.trim()) { setError("กรุณากรอกชื่อกลุ่ม"); return; }
    setError("");
    startTransition(async () => {
      try {
        if (editId) {
          const updated = await updateGroup(userId, editId, { name: name.trim() });
          setGroups(prev => prev.map(g => g.id === editId ? { ...g, name: updated.name } : g));
        } else {
          const created = await createGroup(userId, { name: name.trim() });
          setGroups(prev => [{ ...created, _count: { members: 0 } }, ...prev]);
        }
        setShowForm(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  function handleDelete(groupId: string) {
    startTransition(async () => {
      await deleteGroup(userId, groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setDeleteConfirm(null);
    });
  }

  return (
    <motion.div className="p-6 md:p-8 max-w-5xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight gradient-text-mixed">กลุ่ม</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{groups.length} กลุ่มทั้งหมด</p>
        </div>
        <motion.button
          onClick={openCreate}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="btn-primary px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          สร้างกลุ่ม
        </motion.button>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div className="relative glass p-6 w-full max-w-sm z-10" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}>
              <h3 className="text-lg font-bold text-white mb-5">{editId ? "แก้ไขกลุ่ม" : "สร้างกลุ่มใหม่"}</h3>
              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-white font-medium uppercase tracking-wider mb-2">ชื่อกลุ่ม</label>
                <input
                  type="text" maxLength={100} autoFocus
                  value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  className="input-glass w-full" placeholder="ชื่อกลุ่ม..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={handleSave} disabled={isPending} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer">
                  {isPending ? "กำลังบันทึก..." : editId ? "บันทึก" : "สร้าง"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div className="relative glass p-6 w-full max-w-sm z-10 text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ลบกลุ่ม</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">รายชื่อสมาชิกในกลุ่มนี้จะถูกถอดออกทั้งหมด</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm cursor-pointer">ยกเลิก</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50 cursor-pointer">ลบ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups Grid */}
      {groups.length > 0 ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <motion.div key={g.id} variants={cardVariant} className="glass card-glow p-5 group flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/[0.08] border border-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-500/[0.12] group-hover:border-violet-500/20 transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{g.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{g._count.members} สมาชิก</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(g)} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-[var(--text-muted)] hover:text-slate-200 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button onClick={() => setDeleteConfirm(g.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="glass p-16 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีกลุ่ม</p>
          <p className="text-xs text-[var(--text-muted)] mb-6">สร้างกลุ่มเพื่อจัดส่ง SMS เป็นหมวดหมู่</p>
          <button onClick={openCreate} className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            สร้างกลุ่มแรก
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
