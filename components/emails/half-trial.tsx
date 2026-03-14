import * as React from "react";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailHighlight,
} from "./email-layout";

interface HalfTrialEmailProps {
  name: string;
  remainingCredits: number;
  totalCredits?: number;
}

export default function HalfTrialEmail({
  name,
  remainingCredits,
  totalCredits = 500,
}: HalfTrialEmailProps) {
  const usedCredits = totalCredits - remainingCredits;

  return (
    <EmailLayout preview={`${name} — เหลือ ${remainingCredits} SMS ฟรี! ดูสรุปการใช้งาน`}>
      <EmailHeading>เหลือ {remainingCredits.toLocaleString()} SMS ฟรี</EmailHeading>

      <EmailText>
        สวัสดีครับ {name},
      </EmailText>

      <EmailText>
        คุณใช้ SMS ทดลองฟรีไปแล้ว {usedCredits.toLocaleString()} ข้อความ จากทั้งหมด{" "}
        {totalCredits.toLocaleString()} ข้อความ — เยี่ยมเลย!
      </EmailText>

      {/* Usage Bar */}
      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        <tr>
          <td style={{ padding: "8px 0 20px" }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
              <tr>
                <td
                  style={{
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: "#20252c",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((usedCredits / totalCredits) * 100)}%`,
                      height: "8px",
                      borderRadius: "4px",
                      backgroundColor: "#00E2B5",
                    }}
                  />
                </td>
              </tr>
            </table>
            <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
              <tr>
                <td
                  style={{
                    paddingTop: "6px",
                    fontSize: "12px",
                    color: "#8a95a0",
                  }}
                >
                  ใช้ไปแล้ว {usedCredits.toLocaleString()}
                </td>
                <td
                  align="right"
                  style={{
                    paddingTop: "6px",
                    fontSize: "12px",
                    color: "#00E2B5",
                    fontWeight: 600,
                  }}
                >
                  เหลือ {remainingCredits.toLocaleString()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <EmailText>
        เมื่อ SMS ฟรีหมด คุณสามารถซื้อแพ็กเกจเพิ่มได้ทันที
        เริ่มต้นที่ ฿500 (500 SMS) — ส่งต่อได้ไม่ขาดตอน
      </EmailText>

      <EmailButton href="{{pricing_url}}">
        ดูแพ็กเกจและราคา →
      </EmailButton>

      <EmailDivider />

      <EmailText>
        ต้องการปรึกษาเรื่องแพ็กเกจ? ติดต่อ support@smsok.com
      </EmailText>
    </EmailLayout>
  );
}
