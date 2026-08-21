# Salon &amp; SPA Management — Master Test Plan

**Product:** Salon &amp; SPA Management Software
**Publisher:** Aveon Infotech Private Limited
**Author:** QA Lead
**Version:** 1.0
**Last updated:** 2026-08-21

---

## 1. Introduction

### 1.1 Purpose
This document is the authoritative test plan for the Salon &amp; SPA Management platform. It defines what will be tested, how it will be tested, who is responsible, and when a build is releasable. It is written for the QA team, engineers, product owners, and support.

### 1.2 Product summary
A multi-tenant SaaS platform for salons and spas. Every salon that signs up is an isolated **Organization**; users, bookings, staff, sales, memberships and messages are strictly scoped to their org. The platform ships with a public marketing site, a self-serve signup + onboarding wizard, an admin app, a customer portal, an embeddable booking widget, WhatsApp Cloud API automation, Razorpay-backed billing, and an Aveon-side super-admin console with impersonation.

### 1.3 Related documents
- `/README.md` — architecture, tech stack, deploy targets
- `/DEVELOPMENT_PLAN.md` — engineering roadmap
- `/FREZKA_ANALYSIS.md` — competitive gap analysis
- `/SETUP_GUIDE.md` — local dev bootstrap
- `/docs/testing/TEST_CASES.md` — full P0/P1 test-case catalogue (companion file)
- `/docs/testing/REGRESSION.md` — per-release regression checklist
- `/docs/testing/BUG_TEMPLATE.md` — defect reporting template

---

## 2. Scope

### 2.1 In-scope
- **Public marketing site** — Home, Features, Pricing, About, Blog, Contact, Terms, Privacy, Start-your-salon, public booking widget
- **Authentication &amp; multi-tenancy** — signup, login, refresh tokens, tenant isolation, role hierarchy
- **Onboarding wizard** — first-branch, first-service, first-staff
- **Admin app modules** — Dashboard, Bookings, Branches, Services, Staff, Customers, Memberships, Products, Sales (unified POS), Growth, Referrals, Notification Templates, Access Control, Inquiries, Coupons, Reviews, Reports, Notifications, Settings, Billing, Data &amp; Privacy
- **Customer portal** — My Bookings, My Membership, My Referrals, Notifications, Profile
- **Public booking widget** — `/book/:branchId` and `?embed=1` iframe mode
- **Billing** — Trial banner, Razorpay Subscriptions hosted checkout, webhooks, invoice history, WhatsApp upgrade fallback
- **Plan enforcement** — branch cap, staff cap, WhatsApp monthly quota, feature flags on memberships/referrals/growth kit
- **Super-admin console** — org list, filters, plan/trial/status actions, impersonation, audit log
- **DPDPA compliance** — data export, delete-my-org, terms &amp; privacy pages
- **Integrations** — Cloudinary (uploads), WhatsApp Cloud API, Razorpay Subscriptions
- **API surface** — every REST endpoint under `/api/v1/*` including `/public/*` and `/webhooks/*`

### 2.2 Out-of-scope for v1
- Native mobile apps (only web + PWA behavior)
- Localised UI languages other than English (Hindi/Tamil planned for v1.1)
- Load testing beyond 500 concurrent tenants (see §11.3 for benchmark plan)
- Manual PDF invoice generation (Razorpay-hosted PDFs are used instead)
- SOC 2 / ISO 27001 certification audits (self-attestation only)

### 2.3 Assumptions
- Backend is deployed on Railway with PostgreSQL 15+; frontend on Vercel.
- Cloudinary + WhatsApp Cloud API accounts exist and env vars are set.
- Razorpay account may not be live during initial QA cycles; testing falls back to the WhatsApp-CTA billing flow when `RAZORPAY_KEY_ID` is absent.
- The Default Organization (id `00000000-0000-0000-0000-000000000001`) holds all pre-multi-tenancy data and is on the PRO plan.

---

## 3. Test environments

| Environment | URL | Purpose | Data | Access |
|---|---|---|---|---|
| **Local** | `http://localhost:5173` + `:5000` | Dev + unit / integration test | Seeded fixtures | Any dev |
| **Preview** | Vercel PR previews | Feature branch review | Copy of staging | Anyone with the URL |
| **Staging** | `staging.saloon-management-nine.vercel.app` | UAT, regression, load rehearsal | Anonymised prod snapshot, refreshed weekly | Product + QA |
| **Production** | `saloon-management-nine.vercel.app` | Live customer traffic | Real | Everyone; smoke tests only |

**Backend URLs** mirror the frontend on Railway. Migration `bootstrap.ts` runs on every deploy — verify readiness at `/api/v1/health/ready` returns `{"status":"OK","db":"up"}` before starting any test.

**Never run destructive test data against production.** Use a Local or Staging environment for any test that creates/deletes orgs or subscriptions.

---

## 4. Test strategy

### 4.1 Test pyramid
```
                 /\
                /  \    ~5%  Exploratory + UAT
               /----\
              / E2E  \  ~15% Cypress / Playwright happy-paths on staging
             /--------\
            / Integ.   \ ~30% API tests: request → assert response + DB state
           /-----------\
          /  Unit tests \ ~50% Service functions, helpers, validators
         /---------------\
```

### 4.2 Testing approach per stage

| Stage | Owner | Trigger | Blocking? |
|---|---|---|---|
| Unit tests | Dev | Every commit (CI) | Yes — merge blocked |
| Integration (API) | Dev + QA | Every PR (CI) | Yes |
| E2E smoke | QA | Nightly on staging | Yes for release |
| Regression | QA | Before release | Yes for release |
| Security | QA + Security | Before release + quarterly | Yes for release |
| Performance | QA + SRE | Monthly + before major | No, but reported |
| Exploratory | QA + PM | Every 2 weeks | No, but findings triaged |
| UAT | Product + pilot salons | Before major release | Yes — pilot sign-off |

### 4.3 Priorities

| Priority | Definition | Example |
|---|---|---|
| **P0 — Critical** | Blocks release. Money, data safety, security. | Cross-tenant data leak, checkout doesn't create subscription, login fails |
| **P1 — High** | Blocks a whole workflow. Cosmetic-only exceptions allowed. | Cannot add a booking, WA send fails silently, sidebar broken |
| **P2 — Medium** | Degrades UX but has workaround. | Toast wording wrong, chart axis mis-labelled |
| **P3 — Low** | Polish. | Icon slightly off, hover state missing |

---

## 5. Roles &amp; responsibilities

| Role | Responsibilities |
|---|---|
| **QA Lead** | Owns this plan. Signs off release. |
| **QA Engineer(s)** | Executes test cases, files defects, maintains regression suite. |
| **Engineering Lead** | Owns unit + integration coverage. Fixes P0/P1 defects. |
| **Product Manager** | Owns UAT criteria and pilot-salon feedback. |
| **Support Lead** | Runs impersonation-based verification post-release. |
| **DevOps / SRE** | Owns deploy pipeline, staging refresh, performance test harness. |
| **Security** | Reviews auth, tenant isolation, secrets handling before every release. |

---

## 6. Entry &amp; exit criteria

### 6.1 Entry to formal QA cycle
- All P0/P1 features code-complete on staging
- CI green (unit + integration + type-check + build)
- `bootstrap.ts` migration succeeded on staging DB
- Test data seeded per §7
- Release notes drafted with feature list + known issues

### 6.2 Exit / release criteria
- **Zero open P0** and **zero open P1** defects
- All **P0 test cases pass** on staging (§9)
- Regression suite green (`/docs/testing/REGRESSION.md`)
- Security checklist signed off (§10.2)
- Two pilot salons UAT-signed-off
- Rollback plan documented + tested

---

## 7. Test data &amp; personas

### 7.1 Personas
The system supports six user roles. Every test-case section maps to at least one persona.

| Persona | Role | Where they log in | What they do |
|---|---|---|---|
| **Rhea (Owner)** | OWNER | `/start-salon` → login | Signs up, onboards, sets up branches/services, upgrades to paid |
| **Anita (Admin)** | ADMIN | `/login` | Manages catalog, staff, reports, billing |
| **Vikram (Manager)** | MANAGER | `/login` | Runs POS shift, collects payment, edits bookings |
| **Karan (Staff)** | STAFF | `/login` | Views only own bookings + earnings, sees only own commission |
| **Divya (Customer)** | CUSTOMER | `/login` or `/book/:branchId` | Books, sees own history, refers friends |
| **Ravi (Super-admin)** | SUPERADMIN | `/login` (SUPERADMIN_EMAILS env) | Manages every tenant, impersonates, audits |

### 7.2 Seeded fixtures
| Fixture org | Slug | Plan | Purpose |
|---|---|---|---|
| Default Organization | `default` | PRO | Holds pre-multi-tenancy data — never delete |
| QA Alpha | `qa-alpha` | GROWTH | Positive tests for GROWTH-tier features |
| QA Beta | `qa-beta` | STARTER | Positive tests for STARTER, hits caps quickly |
| QA Trial | `qa-trial` | TRIAL | Trial banner + expiry testing |
| QA Suspended | `qa-suspended` | STARTER, status SUSPENDED | Login refusal + reactivation |

Each org has ≥1 branch, ≥3 services, ≥3 staff, ≥5 customers, ≥10 bookings across statuses.

### 7.3 Never commit these
- Real Razorpay keys, JWT secrets, Cloudinary secrets, WhatsApp tokens
- Real customer PII in fixtures — use `test.user+###@aveon.example`

---

## 8. Test types

### 8.1 Smoke test (~10 min)
Run after every deploy to any environment. See `REGRESSION.md → SMOKE_SUITE` for the current 12-step recipe.

Minimum smoke steps:
1. `/api/v1/health/ready` returns `db:up`
2. Public marketing home renders, no console errors, LCP <2.5s
3. Register a new OWNER via `/start-salon` → land on `/onboarding`
4. Login as seeded ADMIN → land on `/dashboard`, see KPI tiles rendering
5. Create a Branch, Service, Staff, Customer (one of each)
6. Create a Booking with existing customer
7. Take a walk-in Sale from POS
8. Send a WhatsApp test message (if configured)
9. Open `/billing` — plan card + usage bars render
10. As SUPERADMIN visit `/super-admin` — orgs list loads
11. Impersonate an org owner → banner shows → return-to-admin works
12. Data export downloads a JSON file

### 8.2 Functional
Detailed per-module test cases live in `/docs/testing/TEST_CASES.md`. This document (§9) summarises coverage areas.

### 8.3 Regression
Ordered checklist executed before every release. Owned by QA Lead. See `REGRESSION.md`.

### 8.4 Security
See §10.

### 8.5 Performance
See §11.

### 8.6 Accessibility
- Lighthouse Accessibility score ≥ 90 on public marketing pages
- Keyboard-only navigation possible through booking widget
- Screen-reader labels on all icon-only buttons

### 8.7 Compatibility
| Category | Coverage matrix |
|---|---|
| Browsers | Chrome 120+, Edge 120+, Safari 17+, Firefox 121+, Chrome Android, Safari iOS |
| Viewports | 360×640 (mobile), 768×1024 (tablet), 1440×900 (desktop), 1920×1080 (wide) |
| OS | Windows 11, macOS 14+, Android 12+, iOS 17+ |
| Print | Receipt (Ship 4B) on 80mm thermal printers |

### 8.8 Exploratory
Bi-weekly 90-minute session per QA engineer, charter written before, notes captured in `/docs/testing/exploratory/YYYY-MM-DD.md`.

### 8.9 UAT
Two pilot salons run 5 real transactions each per release on staging before promotion to production.

---

## 9. Test coverage by module (summary)

Detailed cases are in `TEST_CASES.md`. Numbers below are minimum P0/P1 cases per module.

| Module | Ship | P0 | P1 | Cross-refs |
|---|---|---|---|---|
| Marketing site (Home, Features, Pricing, About, Blog, Contact) | — | 8 | 20 | SEO, a11y |
| Legal pages (Terms, Privacy) | 6 | 2 | 4 | Compliance |
| Public booking widget | — | 12 | 15 | Tenant isolation |
| Signup + Start-your-salon | 2B | 10 | 12 | Multi-tenancy |
| Onboarding wizard | 2B | 8 | 10 | — |
| Login / logout / refresh | 1A | 6 | 8 | Security |
| Dashboard KPI tiles | — | 4 | 8 | Tenant isolation |
| Bookings (table + calendar + staff grid) | — | 15 | 25 | — |
| Branches CRUD | — | 6 | 8 | Plan enforcement |
| Services CRUD | — | 6 | 8 | — |
| Staff CRUD + photo upload | — | 8 | 12 | Plan enforcement, Cloudinary |
| Customers CRUD | — | 5 | 8 | Role scoping |
| Sales (unified POS) | 2/3/4 | 20 | 30 | Barcode scanner, thermal print |
| Memberships | — | 6 | 10 | Feature-flag gate |
| Products + stock | — | 8 | 12 | — |
| Coupons | — | 5 | 8 | — |
| Growth toolkit (rebook/win-back/birthdays) | — | 5 | 8 | Feature-flag gate |
| Referrals | — | 5 | 8 | Feature-flag gate |
| Notification Templates | — | 3 | 6 | — |
| WhatsApp automation | 5 (features) | 8 | 12 | Quota metering |
| Reports | — | 6 | 10 | Tenant isolation |
| Settings (all tabs) | — | 12 | 20 | — |
| Access Control | — | 4 | 6 | — |
| Inquiries (public POST + admin inbox) | — | 4 | 6 | — |
| Reviews | — | 3 | 5 | — |
| Payouts + Staff Earnings | — | 6 | 10 | Role scoping |
| Notifications (in-app) | — | 3 | 5 | — |
| Customer portal `/my/*` | — | 10 | 15 | Role scoping |
| Trial banner + Billing UI | 3A | 8 | 10 | — |
| Razorpay checkout + webhook | 3B | 12 | 15 | Payment integrity |
| Plan enforcement — branch/staff caps | 4A | 6 | 8 | — |
| WhatsApp quota metering | 4B | 6 | 8 | — |
| Feature-flag gates | 4C | 8 | 12 | — |
| Super-admin dashboard | 5A | 12 | 15 | Cross-tenant |
| Impersonation | 5B | 10 | 12 | Security, audit |
| Data &amp; Privacy — export + delete | 6 | 8 | 10 | DPDPA |
| **Totals** | | **267** | **399** | — |

---

## 10. Security testing

### 10.1 Threat model
| Threat | Mitigation in code | Test |
|---|---|---|
| Cross-tenant read leak | Prisma extension (Ship 1B) auto-injects `where.organizationId` | §10.2 iso-01 to iso-08 |
| Cross-tenant write leak | Same extension + `assertCurrentOrg` helper | iso-09 to iso-14 |
| Broken auth | JWT signature verified server-side; refresh tokens stored in DB | sec-01 to sec-06 |
| Privilege escalation | `authorize()` middleware; OWNER treated as ADMIN implicitly only | sec-07 to sec-12 |
| Impersonation abuse | Every impersonation writes an AuditLog row | sec-13 to sec-15 |
| Webhook forgery | Razorpay HMAC-SHA256 signature verified before any DB write | sec-16 |
| Secret leak | `.env` gitignored; frontend never receives JWT_SECRET | sec-17 |
| XSS | React auto-escaping + no `dangerouslySetInnerHTML` on user data | sec-18 |
| SQLi | Prisma parameterises everything | sec-19 |
| CSRF | JWT in Authorization header (not cookie) | sec-20 |
| Trial abuse | Same phone check at signup (planned Ship 7) | sec-21 |

### 10.2 Tenant isolation suite
Executed by two seeded orgs (QA Alpha + QA Beta) with distinct users.

| ID | Test | Expected |
|---|---|---|
| iso-01 | Alpha user calls `GET /branches` | Only Alpha's branches |
| iso-02 | Alpha user calls `GET /branches/:betaBranchId` | 404 (or forbidden) |
| iso-03 | Alpha user calls `PATCH /branches/:betaBranchId` | 403/404, no mutation |
| iso-04 | Alpha user calls `POST /bookings` with a Beta customerId | 400 (validation) or the booking is created with `customerId=null` (walk-in fallback) — never Beta customer visible |
| iso-05 | Alpha user calls `GET /customers?limit=1000` | Beta customers absent from results |
| iso-06 | Alpha user searches `GET /products?search=<beta unique term>` | Zero results |
| iso-07 | Alpha reports (`GET /reports/*`) | Zero rows from Beta |
| iso-08 | Alpha `GET /organizations/me` returns Alpha's row only | ✔ |
| iso-09 | Alpha `POST /branches` | new branch has `organizationId=Alpha` |
| iso-10 | Alpha `POST /products` | new product has `organizationId=Alpha` |
| iso-11 | Alpha `POST /bookings` | new booking has `organizationId=Alpha` |
| iso-12 | Alpha `POST /whatsapp/messages/test` targeting a phone | UsageMeter row is (Alpha, YYYY-MM), not Beta |
| iso-13 | Alpha `DELETE` any resource id from Beta | 404 (extension can't scope `delete-by-id` — verify service-level check) |
| iso-14 | SUPERADMIN issues `GET /super-admin/organizations` | Returns both Alpha and Beta (cross-tenant intentional) |
| iso-15 | Non-SUPERADMIN calls `/super-admin/*` | 403 for every route |

**Any iso-* failure blocks release.** A single cross-tenant leak invalidates the platform.

### 10.3 Pre-release security checklist
- [ ] `.env` files not committed
- [ ] `SUPERADMIN_EMAILS` contains only real Aveon staff
- [ ] JWT_SECRET / JWT_REFRESH_SECRET are 32+ chars and differ
- [ ] Razorpay Webhook Secret set + HMAC verify enforced
- [ ] CORS_ORIGIN allow-list matches only known frontend domains
- [ ] Rate limiter active (`app.use(limiter)`)
- [ ] All `authorize(...)` calls include the intended role list
- [ ] No `console.log` of tokens / secrets in prod builds
- [ ] Cloudinary API secret not exposed to the browser bundle
- [ ] Impersonation audit rows created on every impersonate call

---

## 11. Non-functional testing

### 11.1 Performance targets (per user session on Vercel + Railway)
| Metric | Target | Measured on |
|---|---|---|
| API p50 latency (list endpoints) | &lt; 200 ms | `/bookings?limit=50` |
| API p95 latency | &lt; 600 ms | Same |
| Dashboard first paint | &lt; 2.5 s | Chrome DevTools throttled Fast 3G |
| Public marketing LCP | &lt; 2.0 s | Lighthouse desktop |
| POS checkout end-to-end | &lt; 3 s | Booking → payment → receipt |
| DB pool utilisation | &lt; 60% average | Railway metrics |

### 11.2 Load testing
Monthly, on staging, with k6 or Artillery:
- **Baseline**: 50 concurrent tenants, 10 req/s each = 500 req/s sustained for 10 min
- **Spike**: burst to 2000 req/s for 30 s
- Success criteria: no 5xx, p95 &lt; 1.5 s, no DB pool exhaustion

### 11.3 Scale ceiling
Current architecture (single Postgres, single Node process on Railway) is comfortable to ~500 active tenants. Beyond that: add read replicas + horizontal scale.

### 11.4 Accessibility (WCAG 2.1 AA)
- Colour contrast ≥ 4.5:1 on body text
- Every interactive element focusable + visible focus ring
- Icon-only buttons have `title` or `aria-label`
- Skip-to-content link on marketing pages

---

## 12. Defect management

### 12.1 Where
GitHub Issues in the `Saloon_Management` repo. Label taxonomy:
- Type: `bug`, `regression`, `security`, `perf`, `a11y`
- Priority: `P0`, `P1`, `P2`, `P3`
- Ship: `ship-1a` … `ship-6`
- Module: `bookings`, `sales`, `billing`, `super-admin`, etc.

### 12.2 SLA
| Priority | Ack | Fix on staging | Fix in prod |
|---|---|---|---|
| P0 | 30 min | 4 h | Same day |
| P1 | 4 h | 1 day | Next release |
| P2 | 1 day | 5 days | Bi-weekly release |
| P3 | 1 week | 30 days | Next quarter |

### 12.3 Defect template
See `BUG_TEMPLATE.md`.

---

## 13. Sign-off &amp; release

### 13.1 Release cadence
- Feature releases: bi-weekly on Wednesdays
- Hotfixes: any time, must clear smoke + P0 tenant-isolation suite

### 13.2 Sign-off matrix
| Role | Signs off on |
|---|---|
| QA Lead | Regression suite pass + release notes accurate |
| Engineering Lead | CI green + rollback plan tested |
| Security | Checklist §10.3 |
| Product Manager | UAT sign-off from two pilot salons |
| Support Lead | Support-facing changes documented |

### 13.3 Rollback
Every deploy has a git SHA. Rollback is a Vercel/Railway one-click to previous SHA. Migrations should be reviewed for **rollback-safety** at PR time (never drop columns without a two-deploy plan).

---

## 14. Appendix

### 14.1 Quick reference URLs
| Purpose | URL |
|---|---|
| Production frontend | https://saloon-management-nine.vercel.app |
| Production API | https://&lt;railway-domain&gt;/api/v1 |
| Health | `/api/v1/health/ready` |
| Public booking widget | `/book/:branchId` |
| Super-admin | `/super-admin` |
| Data export | `/data-privacy` (in-app) → download |
| Razorpay webhook | `POST /api/v1/webhooks/razorpay` |

### 14.2 Companion docs
- Detailed test cases: [TEST_CASES.md](TEST_CASES.md)
- Regression checklist: [REGRESSION.md](REGRESSION.md)
- Bug template: [BUG_TEMPLATE.md](BUG_TEMPLATE.md)

---

*End of Master Test Plan — Version 1.0*
