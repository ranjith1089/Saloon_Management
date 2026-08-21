# QA Documentation Index

Author: QA Lead, Aveon Infotech Private Limited
Last updated: 2026-08-21

---

## Documents in this folder

| File | What it is | When to read |
|---|---|---|
| [TEST_PLAN.md](TEST_PLAN.md) | Master test plan — scope, strategy, environments, sign-off | Once at onboarding, again at every release |
| [TEST_CASES.md](TEST_CASES.md) | Full test-case catalogue organised by module (22 modules, 660+ cases) | While executing a formal QA cycle |
| [REGRESSION.md](REGRESSION.md) | The ordered checklist run before every release | Before every production deploy |
| [BUG_TEMPLATE.md](BUG_TEMPLATE.md) | Copy-paste template for filing GitHub issues | Every time you file a defect |

## Quick links

- **Environments:** see TEST_PLAN §3
- **Personas:** TEST_PLAN §7.1
- **Tenant-isolation suite** (P0 security): TEST_PLAN §10.2
- **Sign-off matrix:** TEST_PLAN §13.2

## Cadence

- **Smoke** (10 min) — after every deploy to any env
- **Regression** (90 min) — before staging→prod promotion
- **Full test-case pass** (5–10 days) — before major releases
- **Security review** — quarterly + before releases touching auth / billing / super-admin
- **Load test** — monthly on staging

## Who to ping

| Situation | Ping |
|---|---|
| P0 discovered outside business hours | on-call engineer on WhatsApp |
| Unclear whether P0 vs P1 | QA Lead |
| Rollback needed | Engineering Lead |
| Billing / payment defect | Engineering Lead + Product Manager |
| Data leak between tenants | Security + Engineering Lead + block release |
