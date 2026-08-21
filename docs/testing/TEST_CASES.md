# Salon &amp; SPA Management — Test Case Catalogue

Companion to `TEST_PLAN.md`. Every case follows this shape:

- **ID** — unique, prefixed by module (e.g. `POS-01`, `SEC-04`)
- **Priority** — P0 (release blocker) · P1 · P2 · P3
- **Preconditions** — state required before executing
- **Steps** — 1., 2., 3. …
- **Expected** — one sentence per assertion
- **Notes** — env / role / data caveats

Test data personas match `TEST_PLAN.md` §7.

---

## Table of contents
1. [Auth &amp; multi-tenancy (AUTH)](#1-auth--multi-tenancy-auth)
2. [Marketing site (MKT)](#2-marketing-site-mkt)
3. [Public booking widget (WGT)](#3-public-booking-widget-wgt)
4. [Signup + onboarding (SGN)](#4-signup--onboarding-sgn)
5. [Bookings (BKG)](#5-bookings-bkg)
6. [Unified Sales POS (POS)](#6-unified-sales-pos-pos)
7. [Staff (STF)](#7-staff-stf)
8. [Branches (BRN)](#8-branches-brn)
9. [Products &amp; stock (PRD)](#9-products--stock-prd)
10. [Memberships (MEM)](#10-memberships-mem)
11. [Coupons (COU)](#11-coupons-cou)
12. [WhatsApp automation (WA)](#12-whatsapp-automation-wa)
13. [Growth toolkit (GRW)](#13-growth-toolkit-grw)
14. [Referrals (REF)](#14-referrals-ref)
15. [Reports (RPT)](#15-reports-rpt)
16. [Billing &amp; plan enforcement (BIL)](#16-billing--plan-enforcement-bil)
17. [Razorpay checkout (RZP)](#17-razorpay-checkout-rzp)
18. [Super-admin (ADM)](#18-super-admin-adm)
19. [Impersonation (IMP)](#19-impersonation-imp)
20. [Data &amp; Privacy — DPDPA (DPP)](#20-data--privacy-dpdpa-dpp)
21. [Customer portal (CST)](#21-customer-portal-cst)
22. [Security cross-cutting (SEC)](#22-security-cross-cutting-sec)

---

## 1. Auth &amp; multi-tenancy (AUTH)

### AUTH-01 — Login happy path · P0
**Pre:** Seeded ADMIN user of QA Alpha org exists.
**Steps:**
1. Navigate to `/login`
2. Enter valid email + password → **Login**
**Expected:** 200 from `POST /auth/login`; access + refresh tokens saved; land on `/dashboard`; nav shows correct email; `organization-me` query returns QA Alpha.

### AUTH-02 — Login wrong password · P0
**Steps:** valid email, wrong password.
**Expected:** 401 with message *"Invalid email or password"*; no tokens saved; no user session state.

### AUTH-03 — Login for SUSPENDED user · P1
**Pre:** User whose org.status = SUSPENDED.
**Expected:** Login refused with meaningful error; user stays on `/login`.

### AUTH-04 — Access token expiry + refresh · P0
**Steps:** Log in. Manually expire the access token (edit localStorage). Hit any authed endpoint.
**Expected:** Interceptor calls `/auth/refresh-token`, receives new pair, retries original request, succeeds.

### AUTH-05 — Refresh token revoked · P1
**Steps:** Log in. Delete the refresh token row from DB. Trigger a refresh.
**Expected:** 401; user redirected to `/login`; localStorage cleared.

### AUTH-06 — JWT includes organizationId · P0
**Steps:** Log in as an ADMIN of QA Alpha. Decode the access token payload.
**Expected:** `payload.organizationId` matches QA Alpha's id.

### AUTH-07 — SUPERADMIN auto-promotion · P0
**Pre:** `SUPERADMIN_EMAILS` env includes `qa+super@aveon.example`.
**Steps:** Register that user, or log in an existing user with that email.
**Expected:** DB row `role` = SUPERADMIN after first login; JWT reflects the new role.

### AUTH-08 — Role hierarchy: OWNER implicit ADMIN · P1
**Steps:** Log in as OWNER (created via `/start-salon`). Attempt every ADMIN-guarded route.
**Expected:** All ADMIN routes accessible; OWNER never blocked from their own tenant.

### AUTH-09 — Tenant frame set before service code · P0
**Steps:** Add temporary logging to a service to print `getCurrentOrgId()`. Hit any endpoint.
**Expected:** Non-null orgId matching JWT's `organizationId`.

### AUTH-10 — Logout clears refresh token · P1
**Steps:** Log in, hit **Logout**.
**Expected:** DB `refreshTokens` row deleted; localStorage cleared; user redirected to `/login`.

### AUTH-11 — Multi-tab session · P2
**Steps:** Log in in Tab A. Log out in Tab B. Reload Tab A.
**Expected:** Tab A also detects logout on next request (401 → forced redirect).

---

## 2. Marketing site (MKT)

### MKT-01 — Home page loads · P0
**Steps:** Anonymous → visit `/`.
**Expected:** Hero renders; no console errors; Sparkles chip visible; primary CTAs Start free trial / See it in action.

### MKT-02 — Features tabs · P1
**Steps:** Click each tab in the Product Showcase section.
**Expected:** Content swaps with fade motion; browser URL bar unchanged; no re-render loops.

### MKT-03 — Currency toggle on Pricing · P1
**Steps:** Visit `/pricing`. Toggle INR / USD / GBP / AED.
**Expected:** Prices update; GST hint shown only when INR selected.

### MKT-04 — Annual toggle · P1
**Steps:** Toggle Monthly ↔ Annual.
**Expected:** Prices × 10 (2 months free), suffix changes to `/year`.

### MKT-05 — Blog list + post · P1
**Steps:** `/blog` → click any post.
**Expected:** All 5 seeded posts visible; post detail renders with author card (Parvathi Gurusamy); related posts shown.

### MKT-06 — Contact form → mailto · P2
**Steps:** Fill Contact form and submit.
**Expected:** Opens mail client with pre-filled body; success screen after.

### MKT-07 — SEO meta tags per page · P1
**Steps:** View source of Home, Features, Pricing, About, Blog, Contact.
**Expected:** Unique `<title>` and `<meta description>` per page; keywords include *Salon Management*, *SPA Management*, etc.; JSON-LD SoftwareApplication schema present on Home.

### MKT-08 — Legal pages · P1
**Steps:** `/legal/terms` and `/legal/privacy`.
**Expected:** Both render; footer links work; effective date shown; contact fields present.

### MKT-09 — Sitemap + robots · P0
**Steps:** `GET /sitemap.xml` and `/robots.txt` on production.
**Expected:** Both 200; sitemap lists 11 URLs; robots blocks `/dashboard`, `/bookings`, etc.

### MKT-10 — Mobile responsiveness · P1
**Steps:** Resize to 360×640 across all marketing pages.
**Expected:** No horizontal scroll; sticky nav collapses to hamburger; hero remains legible.

---

## 3. Public booking widget (WGT)

### WGT-01 — Widget loads by branch id · P0
**Steps:** `/book/&lt;valid-branchId&gt;`.
**Expected:** 5-step wizard renders; salon name + address shown; no login required.

### WGT-02 — Widget with invalid branch id · P1
**Steps:** `/book/00000000-0000-0000-0000-000000000000`.
**Expected:** Friendly *"Booking page unavailable"* message.

### WGT-03 — Step 1 Service selection · P0
**Steps:** Pick a service.
**Expected:** Advances to Step 2; sub-header shows service name.

### WGT-04 — Step 2 Staff selection · P0
**Steps:** Pick a stylist.
**Expected:** Only verified staff who offer that service appear.

### WGT-05 — Step 3 Date picker · P1
**Steps:** Pick a date.
**Expected:** 14-day chip grid; Today / Tomorrow labels correct; past dates absent.

### WGT-06 — Step 4 Slot generation · P0
**Steps:** Pick a date and staff for a busy day.
**Expected:** Slots between branch open/close; slots overlapping existing bookings marked unavailable and disabled; on today's date, past slots hidden.

### WGT-07 — Step 5 Contact + submit · P0
**Steps:** Fill name + phone, submit.
**Expected:** POST `/public/bookings` returns 200; success screen shows reference `BK…`; booking created with `status=PENDING`, walk-in fields set.

### WGT-08 — Widget in embed mode · P1
**Steps:** `/book/:id?embed=1`.
**Expected:** Sticky salon header hidden; footer "Powered by" hidden; wizard renders inside &lt;iframe&gt; test container.

### WGT-09 — Cross-tenant leak via widget · P0 (SECURITY)
**Steps:** As anonymous, list services via `/public/branches/&lt;alphaBranchId&gt;/services`.
**Expected:** Only Alpha's services returned; no Beta services in response.

### WGT-10 — Rate limit on `POST /public/bookings` · P1
**Steps:** POST 30 bookings from same IP in 60 s.
**Expected:** After N (per rate limiter config), 429 Too Many Requests.

### WGT-11 — Slot generation performance · P2
**Steps:** Call `/public/branches/:id/slots?…` for branches with 200+ bookings on the day.
**Expected:** &lt; 300 ms server response.

### WGT-12 — Widget booking shows in admin Bookings · P0
**Steps:** After WGT-07, log in as ADMIN of that branch's org, open `/bookings`.
**Expected:** New PENDING booking visible with the walk-in name; status can be flipped to CONFIRMED.

---

## 4. Signup + onboarding (SGN)

### SGN-01 — Start-your-salon happy path · P0
**Steps:** `/start-salon` → fill all fields → **Start free trial**.
**Expected:** 200; tokens stored; land on `/onboarding`; a new Organization created with plan TRIAL and 14-day trialEndsAt; a new User with role OWNER attached.

### SGN-02 — Duplicate email · P1
**Steps:** Signup with an already-registered email.
**Expected:** 400 *"Email already registered"*; form stays with fields.

### SGN-03 — Slug collision auto-suffix · P2
**Steps:** Two consecutive signups with the same salon name.
**Expected:** Both succeed with distinct slugs (base + random suffix on the second).

### SGN-04 — Reserved slug guard · P1
**Steps:** Attempt salon name "Admin" or "Api".
**Expected:** Signup succeeds but slug is `admin-salon-<rand>` (never the raw reserved value).

### SGN-05 — Country/currency defaults · P1
**Steps:** Pick each country flag.
**Expected:** Currency inferred correctly (India→INR, US→USD, UK→GBP, UAE→AED, CA→CAD).

### SGN-06 — Onboarding wizard – branch step · P0
**Pre:** Fresh OWNER, no branch yet.
**Steps:** On `/onboarding`, complete Step 2 (branch).
**Expected:** Branch created via `POST /branches`; next step unlocks.

### SGN-07 — Onboarding wizard – service step · P0
**Steps:** Add first service with price 500 + duration 45.
**Expected:** Service created; success screen shown.

### SGN-08 — Onboarding wizard skip on completed org · P1
**Pre:** Org already has ≥1 branch and ≥1 service.
**Steps:** Manually navigate to `/onboarding`.
**Expected:** Immediate redirect to `/dashboard`.

### SGN-09 — Onboarding fails gracefully with no cities loaded · P2
**Pre:** DB missing city seed.
**Steps:** Reach branch step.
**Expected:** Fallback message *"No cities loaded — the first one available will be used."*; still submittable (backend accepts any cityId or errors clearly).

### SGN-10 — CUSTOMER signup attaches to Default Org · P0
**Steps:** Register with role CUSTOMER via `/register`.
**Expected:** DB user.organizationId = Default Org id; no new Organization created.

---

## 5. Bookings (BKG)

### BKG-01 — Create booking with registered customer · P0
### BKG-02 — Create walk-in booking (no customer) · P0
### BKG-03 — Cannot create booking overlapping same staff slot · P0
### BKG-04 — Booking status flow PENDING → CONFIRMED → COMPLETED · P0
### BKG-05 — Cancel booking with reason · P1
### BKG-06 — NO_SHOW status · P1
### BKG-07 — Coupon applied at creation · P1
### BKG-08 — Member price applied when customer has active membership · P1
### BKG-09 — Booking triggers WhatsApp confirmation (if configured) · P1
### BKG-10 — Booking triggers in-app notification to assigned staff · P1
### BKG-11 — Table view shows correct filters · P1
### BKG-12 — Calendar view drag-reschedule · P1
### BKG-13 — Staff-grid day view shows every staff column · P1
### BKG-14 — Tenant isolation: cannot fetch other org's booking by id · P0
### BKG-15 — CUSTOMER can list only own bookings via `/bookings` · P0

*(For brevity the detail template applies; each case documents Pre/Steps/Expected as in AUTH-\*.)*

---

## 6. Unified Sales POS (POS)

### POS-01 — Add product to cart, quick-pay Cash · P0
### POS-02 — Add service to cart, walk-in name, pay UPI · P0
### POS-03 — Mixed cart (product + service) single checkout · P0
### POS-04 — Attach pending booking · P0
### POS-05 — Duplicate-attach guard · P0
### POS-06 — Customer name/phone auto-populate on attach · P1
### POS-07 — Staff name shown on service line · P1
### POS-08 — GST toggle adds 18% server-side · P0
### POS-09 — Discount prorated across product / service ticket · P1
### POS-10 — Receipt modal opens after checkout · P0
### POS-11 — Receipt print (`window.print`) produces 80mm thermal layout · P1
### POS-12 — Auto-print toggle triggers print automatically · P2
### POS-13 — WhatsApp receipt link opens with pre-filled text · P2
### POS-14 — Barcode scanner adds correct product to cart · P1 (needs USB scanner)
### POS-15 — Barcode not found — friendly toast · P2
### POS-16 — Barcode scanning ignored while typing in input · P1
### POS-17 — Cart persists across page refresh per branch · P1
### POS-18 — Legacy booking with paymentStatus=PAID doesn't appear in pending list · P1
### POS-19 — Attempt to pay already-paid booking → line removed, list refetched · P1
### POS-20 — Stock decremented after product sale · P0

*(Detail follows same template. Any P0 fail blocks release.)*

---

## 7. Staff (STF)

### STF-01 — Create staff with photo upload · P0
### STF-02 — Photo upload &gt; 5 MB rejected · P1
### STF-03 — Cloudinary URL persisted · P1
### STF-04 — Unverified staff badge count on sidebar · P2
### STF-05 — Staff edit — full modal · P1
### STF-06 — Monthly target field accepts decimal · P1
### STF-07 — STARTER plan: 4th staff hits 402 with upgrade CTA · P0
### STF-08 — Cannot see other org's staff (tenant isolation) · P0

---

## 8. Branches (BRN)

### BRN-01 — Create branch · P0
### BRN-02 — City picker loads options · P1
### BRN-03 — STARTER plan: 2nd branch hits 402 · P0
### BRN-04 — Booking link modal shows URL + copy button · P1
### BRN-05 — Embed snippet copyable · P2

---

## 9. Products &amp; stock (PRD)

### PRD-01 — Create product with per-branch stock rows · P0
### PRD-02 — Low-stock badge appears when stock &lt; 5 · P1
### PRD-03 — Expiring product alert · P2
### PRD-04 — Stock decremented on POS sale · P0
### PRD-05 — Stock restored on POS void · P1

---

## 10. Memberships (MEM)

### MEM-01 — Create membership plan · P0 · Blocked on STARTER (verify 402)
### MEM-02 — Assign membership to customer · P0
### MEM-03 — Member price auto-applied at booking · P1
### MEM-04 — Member price auto-applied at POS · P1
### MEM-05 — Reads still work on STARTER (list existing plans) · P1
### MEM-06 — Writes rejected on STARTER · P0

---

## 11. Coupons (COU)

### COU-01 — Create percentage coupon · P0
### COU-02 — Create fixed-amount coupon · P0
### COU-03 — Usage limit enforced atomically · P0
### COU-04 — Per-customer restriction · P1
### COU-05 — Expired coupon rejected · P1

---

## 12. WhatsApp automation (WA)

### WA-01 — `/messaging/status` reflects env vars · P1
### WA-02 — Test send delivers to a verified test number · P0 (requires WA account)
### WA-03 — sendText increments UsageMeter on success · P0
### WA-04 — sendText does NOT increment on API failure · P0
### WA-05 — At quota cap, 402 with details · P0
### WA-06 — Booking creation fires best-effort WA confirmation · P1
### WA-07 — WA never blocks booking creation on failure · P0

---

## 13. Growth toolkit (GRW)

### GRW-01 — Rebook list shows correct customers · P1
### GRW-02 — Win-back list · P1
### GRW-03 — Birthday list on current date · P1
### GRW-04 — WhatsApp deep-link opens with template · P1
### GRW-05 — Whole `/marketing` router 402s on STARTER plan · P0

---

## 14. Referrals (REF)

### REF-01 — Customer sees own code on `/my/referrals` · P1
### REF-02 — Ref code in signup URL tracked · P0
### REF-03 — First completed booking awards 100 pts to both parties · P0
### REF-04 — Admin `/referrals` list 402s on STARTER · P0
### REF-05 — Idempotent — no double-award on repeat COMPLETED transitions · P0

---

## 15. Reports (RPT)

### RPT-01 — Dashboard revenue formula correct (excludes CANCELLED / NO_SHOW) · P0
### RPT-02 — 30-day trend chart renders · P1
### RPT-03 — Filter by branch scopes results · P1
### RPT-04 — CUSTOMER role blocked from Reports · P0
### RPT-05 — Cross-tenant leak check on Reports · P0

---

## 16. Billing &amp; plan enforcement (BIL)

### BIL-01 — Trial banner shows N days remaining · P1
### BIL-02 — Banner turns amber at ≤ 3 days · P1
### BIL-03 — Banner turns red on expiry, dismiss disabled · P1
### BIL-04 — Billing page current-plan card accurate · P0
### BIL-05 — Usage bars accurate for branch / staff / WA · P1
### BIL-06 — 402 toast on any capped action · P0
### BIL-07 — Sidebar crown icon on locked feature (STARTER) · P2
### BIL-08 — WhatsApp fallback CTA when Razorpay not configured · P1

---

## 17. Razorpay checkout (RZP)

*(Executable only when Razorpay creds present; skip otherwise.)*

### RZP-01 — `/billing/status` reflects configured state · P1
### RZP-02 — POST `/billing/subscribe` returns short_url · P0
### RZP-03 — Duplicate subscribe returns existing sub, not new · P1
### RZP-04 — Webhook signature verify: valid → 200 · P0
### RZP-05 — Webhook signature verify: invalid → 401 · P0
### RZP-06 — subscription.charged flips org.plan · P0
### RZP-07 — subscription.cancelled sets status CANCELLED · P0
### RZP-08 — invoice.paid creates Invoice row (idempotent on repeat) · P0
### RZP-09 — Invoice list renders on Billing page · P1
### RZP-10 — invoice pdfUrl opens hosted PDF · P1
### RZP-11 — Cancel-at-cycle-end preserves paid access · P0
### RZP-12 — Payment failed → status PAST_DUE · P0

---

## 18. Super-admin (ADM)

### ADM-01 — Only SUPERADMIN can access `/super-admin` · P0
### ADM-02 — Summary tiles show correct counts · P1
### ADM-03 — Org table search by name / slug · P1
### ADM-04 — Plan filter, status filter · P2
### ADM-05 — Change plan writes audit row · P0
### ADM-06 — Extend trial +7 / +14 / +30 · P1
### ADM-07 — Suspend org — refuses Default Org · P0
### ADM-08 — Reactivate previously suspended org · P1
### ADM-09 — Recent audit log panel renders latest 40 actions · P1
### ADM-10 — Non-SUPERADMIN receives 403 for every `/super-admin/*` route · P0
### ADM-11 — Cross-tenant reads work only via runAsSystem · P0

---

## 19. Impersonation (IMP)

### IMP-01 — Impersonate button visible in drawer · P1
### IMP-02 — Cannot impersonate Default Org · P0
### IMP-03 — Cannot impersonate org with no owner user · P0
### IMP-04 — Impersonation returns valid tokens with `act` claim · P0
### IMP-05 — Impersonation writes audit row · P0
### IMP-06 — Original session stashed to sessionStorage · P1
### IMP-07 — Banner shows across every page during impersonation · P0
### IMP-08 — Return-to-admin restores original tokens and lands on `/super-admin` · P0
### IMP-09 — Return-to-admin with lost stash falls back to /login · P1
### IMP-10 — All actions during impersonation attributed to target user in normal audit; impersonation event owned by SUPERADMIN · P0

---

## 20. Data &amp; Privacy — DPDPA (DPP)

### DPP-01 — `/data-privacy` visible for OWNER + ADMIN only · P0
### DPP-02 — Download all data — file naming convention `<slug>-export-<date>.json` · P1
### DPP-03 — Export contains all 18 model families · P0
### DPP-04 — Export scrubs passwordHash from users · P0
### DPP-05 — Delete-my-org requires typing exact slug · P0
### DPP-06 — Delete refuses Default Org · P0
### DPP-07 — After delete, next login refused with status message · P0
### DPP-08 — Terms + Privacy pages linked in footer + Data & Privacy · P1

---

## 21. Customer portal (CST)

### CST-01 — Customer sees only own bookings · P0 (tenant isolation)
### CST-02 — MyNewBookingModal loads branches (public endpoint) · P0
### CST-03 — Booking created lands in admin Bookings · P0
### CST-04 — Loyalty streak card accurate · P2
### CST-05 — My Membership card shows plan + validity · P1
### CST-06 — Refer &amp; Earn page shows code + share buttons · P1

---

## 22. Security cross-cutting (SEC)

See TEST_PLAN.md §10.2 for tenant-isolation cases (`iso-01` … `iso-15`) — reproduced conceptually here:

### SEC-01 — JWT signature validated on every authed request · P0
### SEC-02 — Expired JWT rejected 401 · P0
### SEC-03 — Tampered JWT rejected 401 · P0
### SEC-04 — Cannot access ADMIN routes as STAFF · P0
### SEC-05 — Cannot access SUPERADMIN routes as any lesser role · P0
### SEC-06 — CORS blocks unknown origins in production · P0
### SEC-07 — Rate limiter throttles brute-force login attempts · P1
### SEC-08 — Passwords hashed with bcrypt (cost 12) — never returned in any API · P0
### SEC-09 — Refresh tokens revocable via logout · P1
### SEC-10 — Cloudinary upload signature never exposed to client · P0
### SEC-11 — All PATCH/DELETE on tenant models scoped by orgId server-side · P0
### SEC-12 — Prisma queries never concatenate untrusted strings · P0
### SEC-13 — Webhook endpoints not authed but verified by HMAC · P0
### SEC-14 — Public routes (`/public/*`) never return other tenants' data · P0
### SEC-15 — Impersonation cannot be triggered by non-SUPERADMIN · P0

---

*End of Test Case Catalogue*
