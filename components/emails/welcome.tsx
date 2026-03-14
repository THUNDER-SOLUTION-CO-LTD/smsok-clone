import * as React from "react";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailHighlight,
} from "./email-layout";

interface WelcomeEmailProps {
  name: string;
  freeCredits?: number;
}

export default function WelcomeEmail({
  name,
  freeCredits = 500,
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`ยินดีต้อนรับสู่ SMSOK, ${name}! ส่ง SMS แรกของคุณ`}>
      <EmailHeading>ยินดีต้อนรับสู่ SMSOK!</EmailHeading>

      <EmailText>
        สวัสดีครับ {name},
      </EmailText>

      <EmailText>
        ขอบคุณที่สมัครใช้งาน SMSOK — แพลตฟอร์มส่ง SMS สำหรับธุรกิจ
        บัญชีของคุณพร้อมใช้งานแล้ว!
      </EmailText>

      <EmailHighlight
        value={`${freeCredits.toLocaleString()} SMS`}
        label="โควต้า SMS ฟรีสำหรับทดลองใช้งาน"
      />

      <EmailText>
        เริ่มต้นส่ง SMS ได้ทันที 3 ขั้นตอนง่ายๆ:
      </EmailText>

      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        {[
          { step: "1", text: "เข้าสู่ระบบที่ Dashboard" },
          { step: "2", text: "กรอกข้อความและเบอร์ปลายทาง" },
          { step: "3", text: "กดส่ง — SMS จะถึงผู้รับภายใน 1-3 วินาที" },
        ].map((item) => (
          <tr key={item.step}>
            <td style={{ padding: "6px 0", verticalAlign: "top" }}>
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,226,181,0.12)",
                      color: "#00E2B5",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: "28px",
                      verticalAlign: "middle",
                    }}
                  >
                    {item.step}
                  </td>
                  <td
                    style={{
                      paddingLeft: "12px",
                      fontSize: "14px",
                      color: "#b2bacd",
                      lineHeight: "28px",
                    }}
                  >
                    {item.text}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        ))}
      </table>

      <EmailButton href="{{dashboard_url}}">
        ส่ง SMS แรกของคุณ →
      </EmailButton>

      <EmailDivider />

      <EmailText>
        หากมีคำถามหรือต้องการความช่วยเหลือ ทีม Support พร้อมช่วยเหลือ
        ผ่าน support@smsok.com หรือ LINE @smsok (จ.-ศ. 9:00-18:00)
      </EmailText>
    </EmailLayout>
  );
}
