/**
 * Load Test — k6 Script for SMSOK Pre-Deploy Baseline
 * Task #3457
 *
 * Usage:
 *   k6 run tests/load-test.js
 *   k6 run --vus 50 --duration 5m tests/load-test.js
 *
 * Expected thresholds:
 *   - p95 response time < 500ms
 *   - Error rate < 1%
 *   - Health endpoint p99 < 200ms
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ─── Custom Metrics ──────────────────────────────────────────────────────
const errorRate = new Rate("errors");
const healthLatency = new Trend("health_latency", true);
const apiLatency = new Trend("api_latency", true);

// ─── Configuration ───────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 10 },  // Ramp up to 10 users
    { duration: "2m", target: 50 },   // Ramp up to 50 users
    { duration: "1m30s", target: 50 }, // Hold at 50 users
    { duration: "1m", target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],     // p95 < 500ms
    errors: ["rate<0.01"],                // Error rate < 1%
    health_latency: ["p(99)<200"],        // Health p99 < 200ms
    api_latency: ["p(95)<500"],           // API p95 < 500ms
  },
};

// ─── Scenarios ───────────────────────────────────────────────────────────
export default function () {
  const scenario = Math.random();

  if (scenario < 0.3) {
    // 30% — Health check (lightweight, should be fastest)
    testHealth();
  } else if (scenario < 0.5) {
    // 20% — Public pages (pricing, help, status)
    testPublicPages();
  } else if (scenario < 0.7) {
    // 20% — Login attempt (invalid creds — tests auth pipeline)
    testLoginAttempt();
  } else if (scenario < 0.85) {
    // 15% — API endpoints (unauthenticated — should return 401)
    testApiEndpoints();
  } else {
    // 15% — Static assets / landing page
    testLandingPage();
  }

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s think time
}

// ─── Test Functions ──────────────────────────────────────────────────────
function testHealth() {
  const res = http.get(`${BASE_URL}/api/health`);
  healthLatency.add(res.timings.duration);

  const ok = check(res, {
    "health: status 200": (r) => r.status === 200,
    "health: has status field": (r) => {
      try { return JSON.parse(r.body).status !== undefined; }
      catch { return false; }
    },
  });
  errorRate.add(!ok);
}

function testPublicPages() {
  const pages = ["/pricing", "/help", "/status"];
  const page = pages[Math.floor(Math.random() * pages.length)];

  const res = http.get(`${BASE_URL}${page}`);
  apiLatency.add(res.timings.duration);

  const ok = check(res, {
    [`${page}: status 200`]: (r) => r.status === 200,
    [`${page}: has body`]: (r) => r.body.length > 100,
  });
  errorRate.add(!ok);
}

function testLoginAttempt() {
  const payload = JSON.stringify({
    email: `loadtest-${Math.random().toString(36).slice(2)}@test.com`,
    password: "wrongpassword123",
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
  apiLatency.add(res.timings.duration);

  const ok = check(res, {
    "login: returns 401 or 400 or 429": (r) =>
      r.status === 401 || r.status === 400 || r.status === 429,
    "login: has JSON body": (r) => {
      try { JSON.parse(r.body); return true; }
      catch { return false; }
    },
  });
  errorRate.add(!ok);
}

function testApiEndpoints() {
  const endpoints = [
    "/api/v1/contacts",
    "/api/v1/sms/send",
    "/api/v1/campaigns",
  ];
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(`${BASE_URL}${endpoint}`);
  apiLatency.add(res.timings.duration);

  const ok = check(res, {
    [`${endpoint}: returns 401 (auth required)`]: (r) =>
      r.status === 401 || r.status === 403 || r.status === 405,
  });
  errorRate.add(!ok);
}

function testLandingPage() {
  const res = http.get(`${BASE_URL}/`);
  apiLatency.add(res.timings.duration);

  const ok = check(res, {
    "landing: status 200": (r) => r.status === 200,
    "landing: has content": (r) => r.body.length > 500,
  });
  errorRate.add(!ok);
}

// ─── Summary ─────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"] || 0;
  const p99 = data.metrics.http_req_duration?.values?.["p(99)"] || 0;
  const errRate = data.metrics.errors?.values?.rate || 0;
  const totalReqs = data.metrics.http_reqs?.values?.count || 0;

  const summary = `
╔══════════════════════════════════════════════════╗
║          SMSOK Load Test Results                 ║
╠══════════════════════════════════════════════════╣
║  Total Requests:  ${String(totalReqs).padStart(8)}                   ║
║  p95 Latency:     ${String(Math.round(p95)).padStart(6)}ms  ${p95 < 500 ? "✅ PASS" : "❌ FAIL"}          ║
║  p99 Latency:     ${String(Math.round(p99)).padStart(6)}ms                    ║
║  Error Rate:      ${String((errRate * 100).toFixed(2)).padStart(6)}%  ${errRate < 0.01 ? "✅ PASS" : "❌ FAIL"}          ║
╚══════════════════════════════════════════════════╝
`;

  return {
    stdout: summary,
    "tests/load-test-results.json": JSON.stringify(data, null, 2),
  };
}
