# SMSOK E2E Test Scenarios
**Task**: #3314 | **Priority**: P1 | **Date**: 2026-03-14
**Format**: Given / When / Then (BDD)

---

## 1. Auth Flows (8 scenarios)

### AUTH-01: Register with valid data
```
Given   ผู้ใช้อยู่ที่ /register
When    กรอกข้อมูลครบทุกช่อง (ชื่อ, นามสกุล, อีเมล, เบอร์, รหัสผ่าน, ยืนยันรหัสผ่าน)
  And   ติ๊ก consent checkboxes ทั้ง 2 ช่อง
  And   กด "สมัครสมาชิก"
Then    redirect ไป /dashboard/welcome
  And   ได้ 15 SMS credits ฟรี
  And   consent ถูก log ใน pdpa_consent_log
```

### AUTH-02: Register with invalid data
```
Given   ผู้ใช้อยู่ที่ /register
When    กรอกอีเมลที่ใช้แล้ว
  And   กด "สมัครสมาชิก"
Then    แสดง error "อีเมลนี้ถูกใช้งานแล้ว"
  And   ไม่ redirect
```

### AUTH-03: Register without PDPA consent
```
Given   ผู้ใช้อยู่ที่ /register
When    กรอกข้อมูลครบ แต่ไม่ติ๊ก consent
  And   กด "สมัครสมาชิก"
Then    แสดง validation error ที่ checkbox
  And   ไม่สร้างบัญชี
```

### AUTH-04: Login with correct credentials
```
Given   ผู้ใช้อยู่ที่ /login
When    กรอก email + password ที่ถูกต้อง
  And   กด "เข้าสู่ระบบ"
Then    redirect ไป /dashboard
  And   session cookie ถูกตั้ง (httpOnly, secure)
  And   แสดงชื่อผู้ใช้ใน header
```

### AUTH-05: Login with wrong credentials
```
Given   ผู้ใช้อยู่ที่ /login
When    กรอก email ถูก แต่ password ผิด
  And   กด "เข้าสู่ระบบ"
Then    แสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
  And   ไม่ redirect
  And   password field ถูก clear
```

### AUTH-06: Login with 2FA enabled
```
Given   ผู้ใช้เปิด 2FA ไว้
When    กรอก email + password ถูกต้อง
Then    redirect ไป /2fa
When    กรอก OTP 6 หลักถูก
Then    redirect ไป /dashboard
```

### AUTH-07: Password reset flow
```
Given   ผู้ใช้อยู่ที่ /forgot-password
When    กรอก email ที่ลงทะเบียนแล้ว
  And   กด "ส่งลิงก์รีเซ็ต"
Then    แสดงข้อความ "ส่งอีเมลแล้ว"
When    คลิกลิงก์ใน email → /reset-password?token=xxx
  And   กรอกรหัสผ่านใหม่
Then    รหัสผ่านเปลี่ยน
  And   redirect ไป /login
```

### AUTH-08: Session expiry
```
Given   ผู้ใช้ login อยู่ แต่ session หมดอายุ
When    navigate ไปหน้าใดก็ตามใน /dashboard
Then    redirect ไป /login
  And   session + refresh cookies ถูกลบ
```

---

## 2. SMS Sending (6 scenarios)

### SMS-01: Send single SMS successfully
```
Given   ผู้ใช้ login แล้ว มี credits >= 1
  And   อยู่ที่ /dashboard/send
When    เลือก sender name
  And   กรอกเบอร์โทร (0891234567)
  And   กรอกข้อความ "สวัสดีครับ"
  And   กด "ส่ง SMS"
Then    แสดง success toast "ส่งเรียบร้อย"
  And   credits ลดลง 1
  And   SMS ปรากฏใน /dashboard/history
```

### SMS-02: Send bulk SMS
```
Given   ผู้ใช้ login แล้ว มี contacts group "VIP" (100 คน)
  And   อยู่ที่ /dashboard/campaigns
When    กด "สร้างแคมเปญ"
  And   เลือก sender, group "VIP", template
  And   กด "ส่งทันที"
Then    แสดง progress bar
  And   status อัพเดตแบบ real-time
  And   credits ลดลง 100 (หรือ x SMS/msg)
```

### SMS-03: Send with invalid phone number
```
Given   ผู้ใช้อยู่ที่ /dashboard/send
When    กรอกเบอร์ "abc123"
  And   กด "ส่ง SMS"
Then    แสดง validation error "เบอร์โทรไม่ถูกต้อง"
  And   ไม่หัก credits
```

### SMS-04: Send exceeding credit balance
```
Given   ผู้ใช้มี credits = 0
  And   อยู่ที่ /dashboard/send
When    กรอกเบอร์ + ข้อความ
  And   กด "ส่ง SMS"
Then    แสดง error "เครดิตไม่เพียงพอ"
  And   แสดงปุ่ม "เติมเครดิต" → /dashboard/billing/packages
```

### SMS-05: Schedule SMS
```
Given   ผู้ใช้อยู่ที่ /dashboard/send
When    กรอกข้อมูล SMS ครบ
  And   เลือก "ตั้งเวลาส่ง" → พรุ่งนี้ 09:00
  And   กด "ตั้งเวลา"
Then    แสดง success "ตั้งเวลาเรียบร้อย"
  And   SMS ปรากฏใน /dashboard/scheduled
  And   status = "SCHEDULED"
```

### SMS-06: Cancel scheduled SMS
```
Given   มี scheduled SMS อยู่ใน /dashboard/scheduled
When    กดปุ่ม "ยกเลิก" บน SMS นั้น
  And   confirm dialog
Then    SMS ถูกลบจาก scheduled list
  And   credits ถูกคืน (ถ้าหักไว้)
```

---

## 3. Dashboard (5 scenarios)

### DASH-01: View dashboard stats
```
Given   ผู้ใช้ login แล้ว
When    navigate ไป /dashboard
Then    แสดง stat cards: ส่งทั้งหมด, สำเร็จ, อัตราสำเร็จ %, ล้มเหลว
  And   ตัวเลขตรงกับ API /api/v1/analytics
```

### DASH-02: Filter SMS history by date
```
Given   ผู้ใช้อยู่ที่ /dashboard/history
When    เลือก date range: 2026-03-01 ถึง 2026-03-14
  And   กด "กรอง"
Then    แสดงเฉพาะ SMS ในช่วงวันที่
  And   count ตรงกับ API response
```

### DASH-03: Credit balance display
```
Given   ผู้ใช้ login แล้ว มี 5,000 credits
When    อยู่ที่ /dashboard
Then    แสดง credit balance "5,000 SMS"
  And   แสดงปุ่ม "เติมเครดิต"
```

### DASH-04: Recent activity list
```
Given   ผู้ใช้เพิ่งส่ง SMS 5 ข้อความ
When    อยู่ที่ /dashboard
Then    แสดง recent activity table (max 8 rows)
  And   แสดง status dot + เบอร์ + sender + credits
```

### DASH-05: Quick send widget
```
Given   ผู้ใช้อยู่ที่ /dashboard
When    กดปุ่ม "ส่ง SMS" ใน header/CTA
Then    navigate ไป /dashboard/send
```

---

## 4. Settings (5 scenarios)

### SET-01: Update profile
```
Given   ผู้ใช้อยู่ที่ /dashboard/settings
When    แก้ไขชื่อ → "สมชาย ดีมาก"
  And   กด "บันทึก"
Then    แสดง success toast
  And   ชื่อใน header อัพเดต
  And   API PUT /api/v1/settings/profile returns 200
```

### SET-02: Change password
```
Given   ผู้ใช้อยู่ที่ /dashboard/settings/security
When    กรอกรหัสผ่านปัจจุบัน (ถูก)
  And   กรอกรหัสผ่านใหม่ + ยืนยัน
  And   กด "เปลี่ยนรหัสผ่าน"
Then    แสดง success
  And   ล็อกเอาท์ sessions อื่น (optional)
```

### SET-03: Manage sender names
```
Given   ผู้ใช้อยู่ที่ /dashboard/senders
When    กด "ขอ Sender Name ใหม่"
  And   กรอก "MYSHOP"
  And   กด "ส่งคำขอ"
Then    แสดง status "PENDING_REVIEW"
  And   ปรากฏในรายการ sender names
```

### SET-04: PDPA consent management
```
Given   ผู้ใช้อยู่ที่ /dashboard/settings/privacy
When    ถอน marketing consent (toggle off)
  And   confirm
Then    consent log บันทึก OPT_OUT
  And   ไม่ได้รับ marketing emails/SMS อีก
```

### SET-05: API key generation
```
Given   ผู้ใช้อยู่ที่ /dashboard/api-keys
When    กด "สร้าง API Key ใหม่"
  And   ตั้งชื่อ "Production Key"
  And   เลือก permissions
Then    แสดง API key (1 ครั้ง)
  And   คัดลอกได้
  And   key ใช้ยิง API ได้จริง
```

---

## 5. Billing (4 scenarios)

### BILL-01: View packages
```
Given   ผู้ใช้อยู่ที่ /dashboard/billing/packages
Then    แสดง 8 packages (SMSOK A-H)
  And   ราคา ฿500 - ฿1,000,000
  And   แสดงโบนัส SMS + ราคาต่อข้อความ
```

### BILL-02: Purchase package → slip upload → verify
```
Given   ผู้ใช้เลือก package "SMSOK B" (฿1,000)
When    กด "เลือกแพ็กเกจ"
Then    สร้าง order → redirect ไป /dashboard/billing/orders/{id}
  And   แสดงข้อมูลชำระเงิน (บัญชีธนาคาร, QR)
When    อัพโหลดสลิป
Then    status เปลี่ยนเป็น "VERIFYING"
When    สลิปผ่าน verify
Then    status = "PAID"
  And   credits เพิ่ม
  And   เอกสาร 3 ใบถูกสร้าง (Invoice, Tax Invoice, Receipt)
```

### BILL-03: View transaction history
```
Given   ผู้ใช้อยู่ที่ /dashboard/billing/history
Then    แสดง orders ทั้งหมด พร้อม status badge สี
  And   filter by status ทำงาน (PENDING, PAID, REJECTED)
  And   filter by date range ทำงาน
```

### BILL-04: Invoice download
```
Given   ผู้ใช้มี order ที่ PAID
When    กดปุ่ม "ดาวน์โหลดใบแจ้งหนี้"
Then    ดาวน์โหลด PDF
  And   PDF มีข้อมูลครบ (ชื่อ, เลขภาษี, รายการ, ยอดรวม, VAT)
  And   URL เป็น R2 (ไม่ใช่ localhost)
```

---

## 6. Contacts & Templates (4 scenarios)

### CON-01: Create contact
```
Given   ผู้ใช้อยู่ที่ /dashboard/contacts
When    กด "เพิ่มผู้ติดต่อ"
  And   กรอก ชื่อ + เบอร์โทร
  And   กด "บันทึก"
Then    contact ปรากฏในรายการ
```

### CON-02: Import contacts CSV
```
Given   ผู้ใช้อยู่ที่ /dashboard/contacts
When    กด "นำเข้า CSV"
  And   upload ไฟล์ที่มี 100 rows
Then    แสดง preview → confirm
  And   import 100 contacts สำเร็จ
```

### TPL-01: Create SMS template
```
Given   ผู้ใช้อยู่ที่ /dashboard/templates
When    กด "สร้างเทมเพลต"
  And   กรอกชื่อ + เนื้อหา (รวม {{name}} variable)
  And   กด "บันทึก"
Then    template ปรากฏในรายการ
  And   preview แสดงตัวอย่างแทน variable
```

### TPL-02: Use template in SMS send
```
Given   ผู้ใช้อยู่ที่ /dashboard/send
When    เลือก template "Welcome Message"
Then    เนื้อหาถูกกรอกอัตโนมัติ
  And   แสดง SMS count estimate
```

---

## Summary

| Category | Scenarios |
|----------|-----------|
| Auth Flows | 8 |
| SMS Sending | 6 |
| Dashboard | 5 |
| Settings | 5 |
| Billing | 4 |
| Contacts & Templates | 4 |
| **Total** | **32** |
