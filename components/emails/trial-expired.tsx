import * as React from "react";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  colors,
} from "./email-layout";

interface TrialExpiredEmailProps {
  name: string;
}

export default function TrialExpiredEmail({ name }: TrialExpiredEmailProps) {
  return (
    <EmailLayout preview={`${name} — Trial หมดแล้ว! เริ่มแพ็กเกจ Starter ฿500`}>
      <EmailHeading>Trial ของคุณหมดแล้ว</EmailHeading>

      <EmailText>
        สวัสดีครับ {name},
      </EmailText>

      <EmailText>
        โควต้า SMS ทดลองฟรีของคุณหมดอายุแล้ว
        บัญชีของคุณยังอยู่ ข้อมูลทั้งหมดยังครบ —
        แค่ซื้อแพ็กเกจเพื่อส่ง SMS ต่อได้ทันที
      </EmailText>

      {/* Starter Package Highlight */}
      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        <tr>
          <td
            style={{
              padding: "24px",
              backgroundColor: "rgba(0,226,181,0.06)",
              border: `1px solid rgba(0,226,181,0.2)`,
              borderRadius: "12px",
              textAlign: "center" as const,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.accent,
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
              }}
            >
              แพ็กเกจแนะนำ
            </p>
            <p
              style={{
                margin: "8px 0 4px",
                fontSize: "22px",
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              Starter — ฿500
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: colors.textSecondary,
              }}
            >
              500 SMS · อายุ 6 เดือน · ฿1.00/SMS
            </p>
          </td>
        </tr>
      </table>

      <EmailText>
        หรือเลือกแพ็กเกจอื่นที่เหมาะกับธุรกิจของคุณมากกว่า — ยิ่งซื้อเยอะ ยิ่งถูก
      </EmailText>

      <EmailButton href="{{pricing_url}}">
        เริ่มแพ็กเกจ Starter ฿500 →
      </EmailButton>

      <EmailDivider />

      {/* What you keep */}
      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        <tr>
          <td
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.textPrimary,
              paddingBottom: "8px",
            }}
          >
            บัญชีของคุณยังมี:
          </td>
        </tr>
        {[
          "รายชื่อผู้ติดต่อทั้งหมด",
          "ประวัติการส่ง SMS",
          "Sender Names ที่ลงทะเบียน",
          "API Keys ที่สร้างไว้",
        ].map((item, i) => (
          <tr key={i}>
            <td
              style={{
                padding: "3px 0",
                paddingLeft: "16px",
                fontSize: "13px",
                color: colors.textSecondary,
                lineHeight: "22px",
              }}
            >
              ✓ {item}
            </td>
          </tr>
        ))}
      </table>

      <EmailDivider />

      <EmailText>
        คำถาม? ติดต่อ support@smsok.com หรือ LINE @smsok
      </EmailText>
    </EmailLayout>
  );
}
