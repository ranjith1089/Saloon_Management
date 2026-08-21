# Release Regression Checklist

Run this end-to-end before promoting any build from staging to production. Every unchecked item blocks the release.

**Target environment:** staging (never prod)
**Test data:** seeded QA Alpha (GROWTH) + QA Beta (STARTER) + QA Trial + QA Suspended orgs.
**Estimated time:** ~90 minutes for one QA engineer.

---

## SMOKE_SUITE (must pass in the first 10 min)

- [ ] `GET /api/v1/health/ready` → `{ "status": "OK", "db": "up" }`
- [ ] Public marketing `/` renders — no console errors, Lighthouse Perf ≥ 85
- [ ] Public marketing `/pricing` — currency toggle works, GST hint on INR
- [ ] `/start-salon` — register a fresh OWNER, land on `/onboarding`
- [ ] `/onboarding` — complete branch + service, land on `/dashboard`
- [ ] `/dashboard` — 5 KPI tiles render with real numbers
- [ ] `/bookings` — table + calendar + staff-grid all render, at least 1 row
- [ ] `/sales` — POS opens, tap a product tile, quick-pay Cash → receipt appears
- [ ] `/whatsapp/messages/test` (if WA configured) — delivers to test number
- [ ] `/billing` — trial banner + usage bars render, WhatsApp CTA visible
- [ ] `/super-admin` (as SUPERADMIN) — orgs list loads, summary tiles render
- [ ] Impersonate an org → banner shows → **Return to admin** works

---

## 1. Authentication + tenant isolation

- [ ] Login as QA Alpha admin — see only Alpha's data everywhere
- [ ] Login as QA Beta admin — see only Beta's data everywhere
- [ ] Login as QA Suspended admin — refused with "account suspended"
- [ ] Refresh-token flow works after access token expires
- [ ] Logout clears refresh token in DB
- [ ] Direct URL to Beta's booking id from Alpha's session → 404/403

---

## 2. Signup + onboarding

- [ ] Signup with an existing email → 400 with correct message
- [ ] Signup succeeds with all 5 country flags → correct currency
- [ ] Onboarding branch step creates Branch scoped to new org
- [ ] Onboarding service step creates Service scoped to new org
- [ ] Refreshing onboarding page mid-flow doesn't crash

---

## 3. Bookings

- [ ] Create booking with registered customer
- [ ] Create walk-in booking (name + phone only)
- [ ] Overlap detection — 2nd booking on same staff+time refused
- [ ] Status transitions PENDING → CONFIRMED → COMPLETED
- [ ] Cancel booking with reason
- [ ] Coupon applied at booking creation (percentage + fixed)
- [ ] Member price auto-applied when customer has active membership
- [ ] WhatsApp confirmation delivered (if configured)
- [ ] Notification created for assigned staff
- [ ] Calendar drag-reschedule works
- [ ] Staff-grid view shows every staff column

---

## 4. Unified Sales POS

- [ ] Product-only cart → checkout Cash
- [ ] Service-only cart (walk-in) → checkout UPI
- [ ] Mixed cart (product + service) → single checkout
- [ ] Attach a pending booking → cart pre-fills customer + service
- [ ] Duplicate-attach on same booking blocked
- [ ] GST toggle adds 18% (server-side)
- [ ] Discount applied and prorated
- [ ] Receipt modal opens with correct totals
- [ ] Print via `window.print()` produces 80mm thermal layout
- [ ] Auto-print toggle persists across refresh
- [ ] Barcode scanner (if hardware available) adds correct product
- [ ] Legacy PAID booking no longer appears in "Collect from pending"
- [ ] Stock decremented after product sale

---

## 5. Staff / Branches / Products

- [ ] Add staff on QA Beta (STARTER, cap 3) — 4th attempt shows 402 with upgrade
- [ ] Add branch on QA Beta — 2nd attempt shows 402
- [ ] Staff photo upload persists to Cloudinary
- [ ] Product low-stock badge appears when stock &lt; 5
- [ ] Product expiry alert appears within N days
- [ ] Booking Link modal on Branches page copies URL

---

## 6. Memberships / Coupons / Referrals

- [ ] Membership plan create — 402 on QA Beta (STARTER)
- [ ] Membership plan create — success on QA Alpha (GROWTH)
- [ ] Member price auto-applied at POS
- [ ] Coupon usage limit enforced atomically (concurrent bookings can't over-use)
- [ ] Referral code on customer signup URL is tracked
- [ ] First completed booking awards 100 pts to both parties (idempotent)
- [ ] Referrals admin list — 402 on QA Beta

---

## 7. WhatsApp

- [ ] `/messaging/status` reflects configured state
- [ ] Test send delivers to verified number
- [ ] UsageMeter increments on successful send
- [ ] UsageMeter does NOT increment on API failure
- [ ] At quota cap: 402 with upgrade payload
- [ ] Booking flow never blocked by WA failure

---

## 8. Billing

- [ ] Trial banner shows correct days remaining
- [ ] Trial banner amber ≤ 3 days, red on expiry
- [ ] Usage bars for branches / staff / WA accurate
- [ ] 402 toast wording clear + includes upgrade CTA
- [ ] Sidebar crown icons on locked features (STARTER)
- [ ] WhatsApp fallback CTA when Razorpay not configured
- [ ] **If Razorpay configured:** subscribe flow returns short_url and opens hosted checkout
- [ ] **If Razorpay configured:** webhook signature verify works (send test event)
- [ ] **If Razorpay configured:** subscription.charged flips org.plan
- [ ] Invoice history renders after a successful payment

---

## 9. Super-admin

- [ ] Non-SUPERADMIN cannot access `/super-admin` (client + server)
- [ ] Orgs list filters (plan / status) work
- [ ] Summary tiles match manual DB count
- [ ] Change plan on an org — audit row created
- [ ] Extend trial +7 → trialEndsAt increases by 7 days
- [ ] Suspend an org — its users cannot log in
- [ ] Cannot suspend Default Org (button disabled + server 400)
- [ ] Audit log panel shows latest 40 events

---

## 10. Impersonation

- [ ] Impersonate button visible on non-default, non-orphaned orgs
- [ ] Impersonation returns tokens with `act` claim
- [ ] Audit row created with action=impersonate
- [ ] Purple banner shows on every page of impersonated session
- [ ] **Return to admin** restores original session + lands on `/super-admin`
- [ ] Lost stash → graceful fallback to `/login`

---

## 11. Data &amp; Privacy (DPDPA)

- [ ] Export downloads JSON with all 18 model families
- [ ] passwordHash absent from every user in export
- [ ] Delete-my-org requires exact slug match
- [ ] Delete-my-org refuses Default Org
- [ ] After delete, subsequent login refused
- [ ] Terms + Privacy public pages render + linked in footer

---

## 12. Customer portal

- [ ] CUSTOMER sees only own bookings on `/my/bookings`
- [ ] New Booking modal loads branches (public endpoints, not admin)
- [ ] Booking created appears in admin Bookings
- [ ] Loyalty streak accurate
- [ ] Refer &amp; Earn shows code + share buttons

---

## 13. Cross-cutting non-functional

- [ ] Lighthouse Accessibility ≥ 90 on Home, Pricing, Contact
- [ ] Mobile viewport 360×640 renders without horizontal scroll
- [ ] Print stylesheet only affects receipt
- [ ] All P0 tenant-isolation cases (SEC + iso-\*) pass
- [ ] API p95 latency &lt; 600 ms on `/bookings?limit=50`

---

## 14. Migration + deploy

- [ ] `bootstrap.ts` completed without errors on staging
- [ ] All 15 migrations applied (`0001` through `0015`)
- [ ] Rollback plan documented with prior SHA
- [ ] Release notes committed to repo

---

## Sign-off

| Role | Signature | Date |
|---|---|---|
| QA Lead | | |
| Engineering Lead | | |
| Security | | |
| Product Manager | | |

*Release blocked if any P0 item above is unchecked.*
