# Local participant workflow
1. Verify the local services are healthy: web `http://localhost:3000`, API `http://localhost:4000/health`, MCP `http://localhost:4001/health`, and provider `http://localhost:4002/health`.
2. Obtain a single selected participant bearer token from the organizer dashboard; do not place it in source control.
3. Call `get_event_guidance` when required project inputs are missing.
4. Before each premium tool, provide complete inputs and a new idempotency key.
5. Explain that the organizer sponsors premium USDC access and that policy may reject a call without spending quota.
6. Interpret the returned structured result, transaction ID, HashScan URL, and x402 state; convert blockers/gaps to actionable work.
7. Retry only transport failures with the same idempotency key. Do not retry policy rejections automatically.
