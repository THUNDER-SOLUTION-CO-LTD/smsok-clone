import * as React from "react";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailDivider,
  EmailHighlight,
} from "./email-layout";

interface NotActivatedEmailProps {
  name: string;
  freeCredits?: number;
}

export default function NotActivatedEmail({
  name,
  freeCredits = 500,
}: NotActivatedEmailProps) {
  return (
    <EmailLayout preview={`${name} — ลองส่ง SMS ทดสอบดู! มี ${freeCredits} SMS ฟรีรอคุณอยู่`}>
      <EmailHeading>ลองส่ง SMS ทดสอบดู!</EmailHeading>

      <EmailText>
        สวัสดีครับ {name},
      </EmailText>

      <EmailText>
        เราสังเกตว่าคุณยังไม่ได้ส่ง SMS แรก — ไม่เป็นไร!
        คุณมีโควต้า SMS ฟรีรอใช้งานอยู่
      </EmailText>

      <EmailHighlight
        value={`${freeCredits.toLocaleString()} SMS`}
        label="โควต้าฟรีที่ยังไม่ได้ใช้"
      />

      <EmailText>
        ลองส่ง SMS ทดสอบให้ตัวเองดูไหม? แค่ 30 วินาที:
      </EmailText>

      <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
        {[
          "เข้า Dashboard → กดปุ่ม \"ส่ง SMS\"",
          "กรอกเบอร์โทรของคุณ + ข้อความทดสอบ",
          "กดส่ง — จะได้รับ SMS ภายใน 3 วินาที",
        ].map((text, i) => (
          <tr key={i}>
            <td
              style={{
                padding: "4px 0",
                paddingLeft: "16px",
                fontSize: "14px",
                color: "#b2bacd",
                lineHeight: "24px",
              }}
            >
              • {text}
            </td>
          </tr>
        ))}
      </table>

      <EmailButton href="{{send_sms_url}}">
        ส่ง SMS ทดสอบ →
      </EmailButton>

      <EmailDivider />

      <EmailText>
        ต้องการความช่วยเหลือ? ตอบกลับอีเมลนี้ หรือติดต่อ support@smsok.com
      </EmailText>
    </EmailLayout>
  );
}
