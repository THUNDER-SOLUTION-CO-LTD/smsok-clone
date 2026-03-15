"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createTemplate } from "@/lib/actions/templates";
import { safeErrorMessage } from "@/lib/error-messages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PageLayout, { PageHeader } from "@/components/blocks/PageLayout";
import { SmsCharCounter, UnicodeWarning } from "@/components/sms/SmsCharCounter";
import { PhonePreview } from "@/components/sms/PhonePreview";
import { VariableInsertButtons } from "@/components/sms/VariableInsert";

/* ─── Schema ─── */

const templateSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณาตั้งชื่อเทมเพลต")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  category: z.enum(["general", "otp", "marketing", "notification"]),
  content: z
    .string()
    .min(1, "กรุณากรอกข้อความ")
    .max(1000, "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

type FormValues = z.infer<typeof templateSchema>;

/* ─── Category Config ─── */

const CATEGORIES: { key: FormValues["category"]; label: string; dot: string }[] = [
  { key: "general", label: "ทั่วไป", dot: "bg-[var(--text-muted)]" },
  { key: "otp", label: "OTP", dot: "bg-[var(--accent)]" },
  { key: "marketing", label: "การตลาด", dot: "bg-[var(--warning)]" },
  { key: "notification", label: "แจ้งเตือน", dot: "bg-[var(--accent-secondary)]" },
];

/* ─── Main ─── */

export default function NewTemplatePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", category: "general", content: "" },
  });

  const contentValue = form.watch("content");

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = form.getValues("content");
      const newContent =
        current.substring(0, start) + variable + current.substring(end);
      form.setValue("content", newContent, { shouldValidate: true });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + variable.length;
        textarea.focus();
      }, 0);
    } else {
      form.setValue("content", form.getValues("content") + variable, {
        shouldValidate: true,
      });
    }
  }

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      try {
        await createTemplate({
          name: data.name.trim(),
          content: data.content,
          category: data.category,
        });
        toast.success("สร้างเทมเพลตสำเร็จ!");
        router.push("/dashboard/templates");
      } catch (e) {
        toast.error(safeErrorMessage(e) || "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <PageLayout>
      <PageHeader
        title="สร้างเทมเพลตใหม่"
        actions={
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปเทมเพลต
          </Link>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ─── Left: Form ─── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Template Info Card */}
              <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-6">
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  ข้อมูลเทมเพลต
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                          ชื่อเทมเพลต <span className="text-[var(--error)]">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="เช่น ยืนยัน OTP, โปรโมชั่นประจำเดือน"
                            maxLength={100}
                            className="h-11 bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                          หมวดหมู่
                        </FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORIES.map(({ key, label, dot }) => {
                            const isSelected = field.value === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => field.onChange(key)}
                                className={`px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 border ${
                                  isSelected
                                    ? "border-[rgba(var(--accent-rgb),0.5)] bg-[rgba(var(--accent-rgb),0.04)] text-[var(--text-primary)]"
                                    : "border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:border-[rgba(var(--accent-rgb),0.2)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${dot}`} />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* Message Content Card */}
              <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">
                          ข้อความ <span className="text-[var(--error)]">*</span>
                        </FormLabel>
                        <span
                          className={`text-[10px] font-mono ${
                            field.value.length > 900
                              ? "text-[var(--error)]"
                              : field.value.length > 700
                                ? "text-[var(--warning)]"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {field.value.length}/1,000
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="พิมพ์ข้อความ... ใช้ {{name}} สำหรับตัวแปร"
                          maxLength={1000}
                          rows={8}
                          className="bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg resize-y min-h-[160px] focus:border-[rgba(var(--accent-rgb),0.6)] focus:ring-[rgba(var(--accent-rgb),0.12)]"
                          {...field}
                          ref={(el) => {
                            field.ref(el);
                            (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                          }}
                        />
                      </FormControl>

                      {/* SMS Counter */}
                      {field.value && (
                        <div className="mt-2">
                          <SmsCharCounter message={field.value} />
                        </div>
                      )}
                      <UnicodeWarning message={field.value} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Variable Insert Buttons */}
                <div className="mt-4">
                  <VariableInsertButtons onInsert={insertVariable} />
                </div>
              </Card>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3">
                <Link href="/dashboard/templates">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--border-default)] text-[var(--text-secondary)]"
                  >
                    ยกเลิก
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isValid}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg-base)] gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      สร้างเทมเพลต
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ─── Right: Live Preview ─── */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">
                <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-6">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-4">
                    ตัวอย่าง (Live Preview)
                  </h3>
                  <PhonePreview
                    message={contentValue}
                    senderName="SMSOK"
                    showSampleData
                  />
                </Card>

                {/* Quick Tips */}
                <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] p-4">
                  <h4 className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2.5">
                    เคล็ดลับ
                  </h4>
                  <ul className="space-y-1.5 text-[12px] text-[var(--text-muted)] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      ใช้ตัวแปร เช่น {"{{name}}"} เพื่อส่งข้อความเฉพาะบุคคล
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      ข้อความภาษาไทย = 70 ตัวอักษร/SMS (UCS-2)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      ข้อความภาษาอังกฤษ = 160 ตัวอักษร/SMS (GSM-7)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--warning)] mt-1.5 shrink-0" />
                      หลายส่วน SMS จะเพิ่มค่าส่ง — ตรวจสอบ segment counter
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
