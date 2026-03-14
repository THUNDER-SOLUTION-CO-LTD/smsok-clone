# SMSOK API — SDK Examples

Base URL: `https://smsok.9phum.me/api/v1`

## Authentication

All API requests require an API key via `Authorization` header or `X-API-Key` header.

```
Authorization: Bearer sk_live_xxxxxxxxxxxxx
# or
X-API-Key: sk_live_xxxxxxxxxxxxx
```

---

## 1. Send Single SMS

### cURL

```bash
curl -X POST https://smsok.9phum.me/api/v1/sms/send \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "SMSOK",
    "to": "0812345678",
    "message": "สวัสดีครับ ยืนยันรหัส OTP: 123456"
  }'
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "status": "queued",
    "sms_used": 1,
    "sms_remaining": 4999
  }
}
```

### Node.js

```javascript
const response = await fetch("https://smsok.9phum.me/api/v1/sms/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_xxxxxxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sender: "SMSOK",
    to: "0812345678",
    message: "สวัสดีครับ ยืนยันรหัส OTP: 123456",
  }),
});

const data = await response.json();
console.log(data);
// { success: true, data: { id: "msg_abc123", status: "queued", sms_used: 1, sms_remaining: 4999 } }
```

### Python

```python
import requests

response = requests.post(
    "https://smsok.9phum.me/api/v1/sms/send",
    headers={
        "Authorization": "Bearer sk_live_xxxxxxxxxxxxx",
        "Content-Type": "application/json",
    },
    json={
        "sender": "SMSOK",
        "to": "0812345678",
        "message": "สวัสดีครับ ยืนยันรหัส OTP: 123456",
    },
)

data = response.json()
print(data)
```

### PHP

```php
<?php
$ch = curl_init("https://smsok.9phum.me/api/v1/sms/send");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer sk_live_xxxxxxxxxxxxx",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "sender" => "SMSOK",
        "to" => "0812345678",
        "message" => "สวัสดีครับ ยืนยันรหัส OTP: 123456",
    ]),
]);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

print_r($data);
```

---

## 2. Send Batch SMS

### cURL

```bash
curl -X POST https://smsok.9phum.me/api/v1/sms/batch \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "SMSOK",
    "to": ["0812345678", "0898765432", "0867654321"],
    "message": "แจ้งเตือน: โปรโมชั่นพิเศษวันนี้เท่านั้น!"
  }'
```

### Node.js

```javascript
const response = await fetch("https://smsok.9phum.me/api/v1/sms/batch", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_xxxxxxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sender: "SMSOK",
    to: ["0812345678", "0898765432", "0867654321"],
    message: "แจ้งเตือน: โปรโมชั่นพิเศษวันนี้เท่านั้น!",
  }),
});

const data = await response.json();
// { success: true, data: { total_messages: 3, sms_used: 3, sms_remaining: 4997 } }
```

---

## 3. Check SMS Status

### cURL

```bash
curl -X GET "https://smsok.9phum.me/api/v1/sms/status?id=msg_abc123" \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx"
```

### Node.js

```javascript
const response = await fetch(
  "https://smsok.9phum.me/api/v1/sms/status?id=msg_abc123",
  { headers: { "Authorization": "Bearer sk_live_xxxxxxxxxxxxx" } }
);
const data = await response.json();
```

---

## 4. Check Credit Balance

### cURL

```bash
curl -X GET https://smsok.9phum.me/api/v1/credits/balance \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx"
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "totalUsed": 1234,
    "expiryInfo": {
      "nearestExpiry": "2026-06-30T23:59:59Z",
      "expiringCredits": 2000
    }
  }
}
```

### Python

```python
response = requests.get(
    "https://smsok.9phum.me/api/v1/credits/balance",
    headers={"Authorization": "Bearer sk_live_xxxxxxxxxxxxx"},
)
balance = response.json()["data"]["balance"]
print(f"Credits remaining: {balance}")
```

---

## 5. Manage Contacts

### Create Contact (cURL)

```bash
curl -X POST https://smsok.9phum.me/api/v1/contacts \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "สมชาย ใจดี",
    "phone": "0812345678",
    "email": "somchai@example.com",
    "tags": ["vip", "bangkok"]
  }'
```

### Bulk Import (Node.js)

```javascript
const response = await fetch("https://smsok.9phum.me/api/v1/contacts/bulk", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_xxxxxxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contacts: [
      { name: "สมชาย", phone: "0812345678" },
      { name: "สมหญิง", phone: "0898765432" },
    ],
    groupId: "grp_abc123",
  }),
});

const data = await response.json();
// { success: true, data: { imported: 2, skipped: 0, duplicates: 0 } }
```

---

## 6. Send OTP

### cURL

```bash
curl -X POST https://smsok.9phum.me/api/v1/otp/send \
  -H "Content-Type: application/json" \
  -d '{ "phone": "0812345678" }'
```

**Response (200)**
```json
{
  "success": true,
  "data": { "ref": "OTP-ABC123", "expiresIn": 300 }
}
```

### Verify OTP (cURL)

```bash
curl -X POST https://smsok.9phum.me/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{ "ref": "OTP-ABC123", "code": "123456" }'
```

---

## 7. API Keys Management

### Create API Key (cURL)

```bash
curl -X POST https://smsok.9phum.me/api/v1/api-keys \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "permissions": ["create:sms", "read:sms", "read:contact"],
    "rateLimit": 100
  }'
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "key_abc123",
    "name": "Production Server",
    "key": "sk_live_full_key_shown_only_once",
    "prefix": "sk_live_full"
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message in Thai or English",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INSUFFICIENT_CREDITS` | 402 | Not enough SMS credits |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INTERNAL_ERROR` | 500 | Server error |

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 60
```

---

## Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| SMS Send | 10/min | per user |
| SMS Batch | 2/min | per user |
| OTP Send | 3/min | per IP |
| OTP Verify | 5/min | per IP |
| Contacts Import | 1/min | per user |
| Templates | 20/min | per user |
| General API | 100/min | per user |
| Auth Login | 5/min | per IP |
