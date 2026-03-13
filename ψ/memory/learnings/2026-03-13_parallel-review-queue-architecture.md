---
date: 2026-03-13
session: slipok-reviews-ui-fixes
tags: [architecture, bullmq, parallel-agents, review-pattern]
---

# Parallel Reviews + Worker Queue Architecture

## Pattern: Parallel Review Agents
When reviewing 5+ backend tasks simultaneously, launch all review agents in background at once. Wall-clock time = slowest reviewer, not sum of all. This session reviewed 5 tasks in ~3 minutes total (vs ~15 minutes sequential).

## Pattern: External API → Worker Queue
Any external API call that can fail/timeout (SlipOK, EasySlip, payment gateways) should go through a BullMQ worker queue, not inline in the request handler. Benefits:
- User gets immediate "uploaded, verifying" response
- Automatic retry with exponential backoff
- Dead Letter Queue for exhausted retries → manual review
- Race condition protection via job deduplication
- Decouples user-facing latency from verification latency

## Anti-pattern: Direct API Call in Route Handler
The old EasySlip flow called the API directly in the POST handler. If EasySlip was slow (10s timeout) or down, the user's upload request would hang or fail. The queue pattern eliminates this entirely.
