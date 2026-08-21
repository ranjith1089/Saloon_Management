# Defect Report Template

Copy the block below into a new GitHub issue and fill it in. Anything unclear → file the bug anyway; the triage step will refine.

---

```
### Summary
<One sentence. What actually happens vs what was expected.>

### Severity
- [ ] P0 — Blocker (money, data, security, complete outage)
- [ ] P1 — High (major workflow broken, no workaround)
- [ ] P2 — Medium (workaround exists)
- [ ] P3 — Low (polish)

### Environment
- **Where:**  Local / Preview / Staging / Production
- **URL:**    https://…
- **Build:**  git SHA (visible in footer or `/health`)
- **Browser + OS:** Chrome 131 on macOS 15.1
- **Viewport:** 1440×900 (or 360×640, etc.)

### Impersonation
- **Login role:** ADMIN / OWNER / STAFF / CUSTOMER / SUPERADMIN
- **Org slug:**   qa-alpha
- **Session:**    normal / impersonation active

### Steps to reproduce
1. Navigate to /bookings
2. Click …
3. …
(Every step short enough that anyone can re-run without asking.)

### Expected behaviour
<One sentence per assertion.>

### Actual behaviour
<What you saw. Include the exact toast text or error message.>

### Evidence
- [ ] Screenshot(s)
- [ ] Screen recording
- [ ] Network HAR
- [ ] Browser console logs
- [ ] Backend logs (`railway logs` snippet)

### Frequency
- [ ] Every time (100%)
- [ ] Often (>50%)
- [ ] Sometimes (10–50%)
- [ ] Rare (<10%)

### Impact
- **Users affected:** all / paid tier only / super-admins only / single org
- **Data at risk?** Yes / No — explain
- **Money involved?** Yes / No — explain

### Workaround
<Empty if none.>

### Suspected root cause / area
- Modules: bookings / sales / billing / super-admin / …
- Ship: 4B / 5A / …

### Related
- Blocks: #___
- Related: #___
```

---

## Filing rules

1. **One bug per issue.** If you see two, file two. Easier to triage and close.
2. **Title format:** `[P0] [Sales] POS auto-print prints entire page instead of only receipt`.
3. **P0 = wake-up-worthy.** If it's Sunday night and you filed a P0, ping the on-call in Slack.
4. **Reproducible steps or it doesn't exist.** A vague *"sometimes the dashboard is slow"* is a note, not a bug.
5. **PII stays out.** Replace real customer names / phones with placeholders in screenshots.
6. **Attach the git SHA.** Fixes get released against a specific build; the SHA is the ground truth.
7. **On close** — leave a one-line summary of the fix + the release it landed in.

---

## Triage SLA reminder (from TEST_PLAN §12.2)

| Priority | Ack | Fix on staging | In prod |
|---|---|---|---|
| P0 | 30 min | 4 h | Same day |
| P1 | 4 h | 1 day | Next release |
| P2 | 1 day | 5 days | Bi-weekly |
| P3 | 1 week | 30 days | Next quarter |
