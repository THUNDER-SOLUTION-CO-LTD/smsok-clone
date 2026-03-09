import Link from "next/link";

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: "POST",
      methodColor: "bg-[rgba(139,92,246,0.15)] text-violet-400 border border-violet-500/20",
      path: "/api/v1/auth/login",
      title: "Authentication",
      description: "เข้าสู่ระบบเพื่อรับ Token สำหรับเรียกใช้ API",
      headers: null,
      body: `{
  "email": "user@example.com",
  "password": "your-password"
}`,
      response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "สมชาย"
  }
}`,
    },
    {
      method: "POST",
      methodColor: "bg-[rgba(139,92,246,0.15)] text-violet-400 border border-violet-500/20",
      path: "/api/v1/sms/send",
      title: "Send SMS",
      description: "ส่งข้อความ SMS ไปยังเบอร์ปลายทาง",
      headers: "Authorization: Bearer <token>",
      body: `{
  "to": "0812345678",
  "message": "สวัสดีครับ นี่คือข้อความทดสอบ",
  "senderName": "SMSOK"
}`,
      response: `{
  "messageId": "msg_xyz789",
  "status": "queued",
  "credits": 1
}`,
    },
    {
      method: "GET",
      methodColor: "bg-[rgba(34,211,238,0.15)] text-cyan-400 border border-cyan-500/20",
      path: "/api/v1/balance",
      title: "Check Balance",
      description: "ตรวจสอบเครดิตคงเหลือ",
      headers: "Authorization: Bearer <token>",
      body: null,
      response: `{
  "credits": 1500,
  "used": 350,
  "plan": "professional"
}`,
    },
    {
      method: "GET",
      methodColor: "bg-[rgba(34,211,238,0.15)] text-cyan-400 border border-cyan-500/20",
      path: "/api/v1/sms/:id",
      title: "Message Status",
      description: "ตรวจสอบสถานะข้อความที่ส่งไป",
      headers: "Authorization: Bearer <token>",
      body: null,
      response: `{
  "id": "msg_xyz789",
  "status": "delivered",
  "recipient": "0812345678",
  "createdAt": "2026-03-09T10:30:00Z"
}`,
    },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text-mixed mb-2">
            API Documentation
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            เอกสารการใช้งาน SMSOK API
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-glass px-4 py-2 text-sm font-medium"
        >
          กลับแดชบอร์ด
        </Link>
      </div>

      {/* Base URL */}
      <div className="glass p-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Base URL
          </span>
          <code className="text-cyan-300/80 font-mono text-sm bg-[var(--bg-surface)] px-3 py-1 rounded-lg border border-[var(--border-subtle)]">
            https://api.smsok.com
          </code>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-6 stagger-children">
        {endpoints.map((ep) => (
          <div key={ep.path} className="glass p-6 card-hover">
            {/* Endpoint Header */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`${ep.methodColor} text-xs font-bold px-3 py-1 rounded-lg`}
              >
                {ep.method}
              </span>
              <code className="text-[var(--text-primary)] font-mono text-sm">
                {ep.path}
              </code>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {ep.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              {ep.description}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Request */}
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                  Request
                </p>

                {ep.headers && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 mb-3">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Headers
                    </p>
                    <code className="text-cyan-300/80 font-mono text-xs">
                      {ep.headers}
                    </code>
                  </div>
                )}

                {ep.body ? (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Body
                    </p>
                    <pre className="text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto">
                      {ep.body}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] italic">
                      ไม่มี Request Body
                    </p>
                  </div>
                )}
              </div>

              {/* Response */}
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                  Response
                </p>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4">
                  <pre className="text-cyan-300/80 font-mono text-xs whitespace-pre overflow-x-auto">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
