# SMSOK Webhooks

Webhooks notify your server when events occur in SMSOK (e.g., SMS delivered, payment completed).

## Setup

### Create Webhook

```bash
curl -X POST https://smsok.9phum.me/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/smsok",
    "events": ["sms.delivered", "sms.failed", "payment.completed"]
  }'
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "url": "https://your-server.com/webhooks/smsok",
    "events": ["sms.delivered", "sms.failed", "payment.completed"],
    "secret": "whsec_xxxxxxxxxxxxxxxx",
    "isActive": true
  }
}
```

> **Important**: Save the `secret` — it's shown only once and used for signature verification.

---

## Event Types

| Event | Description |
|-------|-------------|
| `sms.queued` | SMS added to send queue |
| `sms.sent` | SMS sent to provider |
| `sms.delivered` | SMS delivered to recipient |
| `sms.failed` | SMS delivery failed |
| `sms.expired` | SMS delivery timed out |
| `payment.completed` | Payment verified and credits added |
| `payment.failed` | Payment verification failed |
| `payment.expired` | Payment window expired |
| `contact.created` | New contact added |
| `contact.updated` | Contact information changed |
| `contact.deleted` | Contact removed |
| `campaign.completed` | Campaign finished sending |
| `campaign.failed` | Campaign encountered error |

---

## Webhook Payload Format

All webhook payloads follow this structure:

```json
{
  "id": "evt_abc123",
  "type": "sms.delivered",
  "created_at": "2026-03-14T10:30:00Z",
  "data": {
    "message_id": "msg_abc123",
    "to": "0812345678",
    "sender": "SMSOK",
    "status": "delivered",
    "delivered_at": "2026-03-14T10:30:00Z"
  }
}
```

### SMS Delivered

```json
{
  "id": "evt_del_001",
  "type": "sms.delivered",
  "created_at": "2026-03-14T10:30:00Z",
  "data": {
    "message_id": "msg_abc123",
    "to": "0812345678",
    "sender": "SMSOK",
    "status": "delivered",
    "delivered_at": "2026-03-14T10:30:00Z",
    "segments": 1
  }
}
```

### SMS Failed

```json
{
  "id": "evt_fail_001",
  "type": "sms.failed",
  "created_at": "2026-03-14T10:30:00Z",
  "data": {
    "message_id": "msg_abc123",
    "to": "0812345678",
    "sender": "SMSOK",
    "status": "failed",
    "error_code": "INVALID_NUMBER",
    "error_message": "หมายเลขไม่ถูกต้อง"
  }
}
```

### Payment Completed

```json
{
  "id": "evt_pay_001",
  "type": "payment.completed",
  "created_at": "2026-03-14T10:30:00Z",
  "data": {
    "order_id": "ord_abc123",
    "amount": 2900,
    "currency": "THB",
    "credits_added": 5000,
    "package": "Business",
    "method": "bank_transfer"
  }
}
```

---

## Signature Verification

Every webhook request includes a signature header for verification:

```
X-Webhook-Signature: sha256=xxxxxxxxxxxxxxxxx
```

### Verify in Node.js

```javascript
const crypto = require("crypto");

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");

  return `sha256=${expected}` === signature;
}

// Express.js example
app.post("/webhooks/smsok", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const isValid = verifyWebhookSignature(req.body, signature, "whsec_your_secret");

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body);

  switch (event.type) {
    case "sms.delivered":
      console.log(`SMS ${event.data.message_id} delivered to ${event.data.to}`);
      break;
    case "sms.failed":
      console.log(`SMS failed: ${event.data.error_message}`);
      break;
    case "payment.completed":
      console.log(`Payment ${event.data.order_id}: +${event.data.credits_added} credits`);
      break;
  }

  res.status(200).json({ received: true });
});
```

### Verify in Python

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return f"sha256={expected}" == signature

# Flask example
@app.route("/webhooks/smsok", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Webhook-Signature")
    if not verify_webhook(request.data, signature, "whsec_your_secret"):
        return {"error": "Invalid signature"}, 401

    event = request.json
    if event["type"] == "sms.delivered":
        print(f"Delivered: {event['data']['message_id']}")

    return {"received": True}, 200
```

### Verify in PHP

```php
<?php
function verifyWebhook(string $payload, string $signature, string $secret): bool {
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

if (!verifyWebhook($payload, $signature, 'whsec_your_secret')) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$event = json_decode($payload, true);

switch ($event['type']) {
    case 'sms.delivered':
        // Handle delivery
        break;
    case 'sms.failed':
        // Handle failure
        break;
}

http_response_code(200);
echo json_encode(['received' => true]);
```

---

## Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| 5th retry | 12 hours |

- Max 5 retries over ~14.5 hours
- Retries stop on HTTP 2xx response
- Webhook disabled after 5 consecutive failures
- Re-enable via API or dashboard

---

## Testing Webhooks

### Send Test Event

```bash
curl -X POST https://smsok.9phum.me/api/v1/webhooks/wh_abc123/test \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{ "event": "sms.delivered" }'
```

### View Delivery Logs

```bash
curl -X GET https://smsok.9phum.me/api/v1/webhooks/wh_abc123/logs \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx"
```

### Rotate Secret

```bash
curl -X POST https://smsok.9phum.me/api/v1/webhooks/wh_abc123/rotate-secret \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxx"
```

---

## Best Practices

1. **Always verify signatures** — never process unverified webhooks
2. **Return 200 quickly** — process events async, respond within 5 seconds
3. **Handle duplicates** — use `event.id` for idempotency
4. **Monitor delivery logs** — check for failed deliveries regularly
5. **Use HTTPS** — webhook URLs must use HTTPS in production
