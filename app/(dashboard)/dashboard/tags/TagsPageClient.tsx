"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTag, updateTag, deleteTag } from "@/lib/actions/tags";
import { safeErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/app/components/ui/Toast";
import { TAG_COLORS } from "@/lib/tag-utils";
import type { TagItem } from "@/lib/types/api-responses";

// shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import { Plus, Pencil, Trash2, Tag, Loader2, Search, ArrowUpDown } from "lucide-react";

// ==========================================
// Types
// ==========================================

// TagItem imported from api-responses

// ==========================================
// Nansen-aligned color picker options
// ==========================================

const COLOR_OPTIONS = TAG_COLORS.map((c) => ({
  hex: c.hex,
  name: c.name,
  dotClass: c.dot,
}));

function getColorDotClass(hex: string) {
  const found = COLOR_OPTIONS.find((c) => c.hex === hex);
  return found ? found.dotClass : "bg-[var(--text-muted)]";
}

// ==========================================
// Zod schema
// ==========================================

const tagFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อแท็ก")
    .max(50, "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร"),
  color: z.string().min(1),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

// ==========================================
// Main Component
// ==========================================

export default function TagsPageClient({
  userId,
  initialTags,
}: {
  userId: string;
  initialTags: TagItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);

  // Form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: "", color: "#00FFA7" },
  });

  // ==========================================
  // Handlers
  // ==========================================

  function openCreate() {
    setEditingTag(null);
    form.reset({ name: "", color: "#00FFA7" });
    setShowDialog(true);
  }

  function openEdit(tag: TagItem) {
    setEditingTag(tag);
    form.reset({ name: tag.name, color: tag.color });
    setShowDialog(true);
  }

  function handleSubmit(data: TagFormValues) {
    startTransition(async () => {
      try {
        if (editingTag) {
          await updateTag(userId, editingTag.id, {
            name: data.name.trim(),
            color: data.color,
          });
          toast("success", "อัปเดตแท็กสำเร็จ!");
        } else {
          await createTag(userId, {
            name: data.name.trim(),
            color: data.color,
          });
          toast("success", "สร้างแท็กสำเร็จ!");
        }
        setShowDialog(false);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deletingTag) return;
    startTransition(async () => {
      try {
        await deleteTag(userId, deletingTag.id);
        toast("success", `ลบแท็ก "${deletingTag.name}" สำเร็จ`);
        setShowDeleteAlert(false);
        setDeletingTag(null);
        router.refresh();
      } catch (e) {
        toast("error", safeErrorMessage(e));
      }
    });
  }

  // ==========================================
  // Render
  // ==========================================

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTags = initialTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalContacts = initialTags.reduce((sum, t) => sum + t._count.contactTags, 0);
  const activeTags = initialTags.filter((t) => t._count.contactTags > 0).length;
  const unusedTags = initialTags.length - activeTags;

  return (
    <div className="pb-20 md:pb-8" style={{ padding: "var(--content-padding-y) var(--content-padding-x)" }}>
      {/* Page Header — DNA Part 1 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">แท็ก</h1>
          <p className="page-description">จัดการและจัดระเบียบแท็กรายชื่อผู้ติดต่อ</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          สร้างแท็ก
        </Button>
      </div>

      {/* Stats Cards — DNA Part 8 */}
      <div className="stats-grid">
        <div className="nansen-stat-card">
          <div className="label">แท็กทั้งหมด</div>
          <div className="value">{initialTags.length}</div>
          <div className="text-xs text-[var(--text-subdued)] mt-1">tags</div>
        </div>
        <div className="nansen-stat-card">
          <div className="label">ใช้งานอยู่</div>
          <div className="value">{activeTags}</div>
          <div className="text-xs text-[var(--text-subdued)] mt-1">มีรายชื่อ</div>
        </div>
        <div className="nansen-stat-card">
          <div className="label">ไม่ได้ใช้</div>
          <div className="value">{unusedTags}</div>
          <div className="text-xs text-[var(--text-subdued)] mt-1">ว่าง</div>
        </div>
        <div className="nansen-stat-card">
          <div className="label">รายชื่อทั้งหมด</div>
          <div className="value">{totalContacts.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-subdued)] mt-1">tagged contacts</div>
        </div>
      </div>

      {/* Filter Bar — DNA Part 1 */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subdued)]" />
          <input
            type="text"
            placeholder="ค้นหาแท็ก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nansen-input w-full pl-9"
          />
        </div>
      </div>

      {/* Tags Table — DNA Part 2 + Part 8 */}
      {filteredTags.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border-default)]">
            <table className="nansen-table">
              <thead>
                <tr>
                  <th style={{ width: 200 }}>
                    ชื่อแท็ก <ArrowUpDown className="inline w-3 h-3 sort-icon" />
                  </th>
                  <th style={{ width: 120 }}>สี</th>
                  <th style={{ width: 120 }} className="text-right">รายชื่อ</th>
                  <th style={{ width: 60 }} className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorDotClass(tag.color)}`}
                        />
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag-pill" style={{
                        background: `${tag.color}1a`,
                        color: tag.color,
                        borderColor: `${tag.color}33`,
                      }}>
                        <span className="dot" style={{ background: tag.color }} />
                        {COLOR_OPTIONS.find((c) => c.hex === tag.color)?.name || tag.color}
                      </span>
                    </td>
                    <td className="numeric">{tag._count.contactTags.toLocaleString()}</td>
                    <td className="text-center">
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(tag)}
                          className="w-7 h-7 rounded-lg hover:bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[var(--text-subdued)] hover:text-white transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingTag(tag); setShowDeleteAlert(true); }}
                          className="w-7 h-7 rounded-lg hover:bg-[rgba(239,68,68,0.06)] flex items-center justify-center text-[var(--text-subdued)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="nansen-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorDotClass(tag.color)}`}
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{tag.name}</div>
                    <div className="text-xs text-[var(--text-subdued)] mt-0.5">
                      {tag._count.contactTags} รายชื่อ
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(tag)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-subdued)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeletingTag(tag); setShowDeleteAlert(true); }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-subdued)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination info */}
          <div className="mt-4 text-right text-xs text-[var(--text-subdued)]">
            แสดง {filteredTags.length} จาก {initialTags.length} แท็ก
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="nansen-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(0,255,167,0.08)] border border-[rgba(0,255,167,0.15)] flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? "ไม่พบแท็ก" : "ยังไม่มีแท็ก"}
          </h3>
          <p className="text-sm text-[var(--text-subdued)] mb-6">
            {searchQuery ? `ไม่พบแท็กที่ตรงกับ "${searchQuery}"` : "สร้างแท็กเพื่อจัดกลุ่มรายชื่อของคุณ"}
          </p>
          {!searchQuery && (
            <Button
              onClick={openCreate}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              สร้างแท็กแรก
            </Button>
          )}
        </div>
      )}

      {/* ==========================================
          DIALOGS
          ========================================== */}

      {/* Create / Edit Tag Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {editingTag ? "แก้ไขแท็ก" : "สร้างแท็กใหม่"}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {editingTag
                ? "แก้ไขชื่อหรือสีของแท็ก"
                : "ตั้งชื่อและเลือกสีสำหรับแท็กใหม่"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      ชื่อแท็ก
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อแท็ก"
                        maxLength={50}
                        autoFocus
                        className="h-11 bg-[var(--bg-base)] border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(0,255,167,0.6)] focus:ring-[rgba(0,255,167,0.12)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Picker */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                      สี
                    </FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => field.onChange(c.hex)}
                          className={`w-7 h-7 rounded-full transition-all ${
                            field.value === c.hex
                              ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: c.hex,
                            ...(field.value === c.hex
                              ? { ringColor: c.hex }
                              : {}),
                          }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white bg-transparent"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] font-semibold"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </span>
                  ) : (
                    "บันทึก"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Tag AlertDialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ลบแท็ก &ldquo;{deletingTag?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              แท็กจะถูกลบจาก {deletingTag?._count.contactTags || 0}{" "}
              รายชื่อผู้ติดต่อ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white bg-transparent">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังลบ...
                </span>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
