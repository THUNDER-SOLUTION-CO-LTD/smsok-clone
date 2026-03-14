import * as React from "react";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailHighlight,
  colors,
} from "./email-layout";

interface TrialEndingEmailProps {
  name: string;
  daysLeft?: number;
  remainingCredits: number;
}

export default function TrialEndingEmail({
  name,
  daysLeft = 2,
  remainingCredits,
}: TrialEndingEmailProps) {
  return (
    <EmailLayout preview={`${name} — Trial หมดใน ${daysLeft} วัน! อัปเกรดเพื่อส่ง SMS ต่อ`}>
      <EmailHeading>Trial หมดใน {daysLeft} วัน</EmailHeading>

      <EmailText>
        สวัสดีครับ {name},
      </EmailText>

      <EmailText>
        โควต้า SMS ทดลองฟรีของคุณจะหมดอายุในอีก {daysLeft} วัน
        คุณยังเหลือ SMS อีก {remainingCredits.toLocaleString()} ข้อความ
      </EmailText>

      {/* Alert Box */}
      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        <tr>
          <td
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#f59e0b",
              lineHeight: "22px",
            }}
          >
            ⏰ หลัง Trial หมดอายุ คุณจะไม่สามารถส่ง SMS ได้
            จนกว่าจะซื้อแพ็กเกจใหม่
          </td>
        </tr>
      </table>

      <EmailText>
        อัปเกรดตอนนี้เพื่อส่ง SMS ต่อได้ไม่ขาดตอน:
      </EmailText>

      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        {[
          { name: "Starter", price: "฿500", sms: "500 SMS" },
          { name: "Basic", price: "฿1,000", sms: "1,100 SMS", popular: true },
          { name: "Growth", price: "฿10,000", sms: "11,500 SMS" },
        ].map((pkg) => (
          <tr key={pkg.name}>
            <td
              style={{
                padding: "8px 16px",
                backgroundColor: pkg.popular
                  ? "rgba(0,226,181,0.06)"
                  : colors.bgElevated,
                border: `1px solid ${pkg.popular ? "rgba(0,226,181,0.2)" : colors.border}`,
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                width="100%"
              >
                <tr>
                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                    }}
                  >
                    {pkg.name}
                    {pkg.popular && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: colors.accent,
                        }}
                      >
                        Popular
                      </span>
                    )}
                  </td>
                  <td
                    align="right"
                    style={{
                      fontSize: "14px",
                      color: colors.textSecondary,
                    }}
                  >
                    {pkg.price}{" "}
                    <span style={{ color: colors.textMuted, fontSize: "12px" }}>
                      / {pkg.sms}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        ))}
      </table>

      <EmailButton href="{{pricing_url}}">
        เลือกแพ็กเกจ →
      </EmailButton>

      <EmailDivider />

      <EmailText>
        ต้องการปรึกษาก่อนตัดสินใจ? ตอบกลับอีเมลนี้
        หรือติดต่อ support@smsok.com
      </EmailText>
    </EmailLayout>
  );
}
