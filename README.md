# Salon Management System

> A comprehensive, multi-branch salon & spa operations platform — bookings, POS, memberships, growth tools, WhatsApp automation and an embeddable public booking widget.

**Author:** Ranjith Kumar R
**License:** © Aveon Infotech Private Limited. All rights reserved.

---

## 1. Overview

The Salon Management System is a full-stack SaaS application for salons, spas and beauty parlours. It replaces spreadsheet-and-paper workflows with a single web app that a salon owner runs on any laptop or tablet.

**Positioning:** India-first (INR, GST, WhatsApp), tier-2/3 focused. Modeled after Frezka; competitive with Salonist, MioSalon and Zylu; priced 20–30% below them.

**Live deployments**

| Layer     | Host    | Notes                                   |
|-----------|---------|-----------------------------------------|
| Frontend  | Vercel  | Auto-deploys `main`                     |
| Backend   | Railway | Auto-deploys `main`; runs bootstrap.ts  |
| Database  | Railway PostgreSQL 15+                            |
| Media     | Cloudinary (staff/branding uploads)               |

---

## 2. Features

### Core operations
- **Bookings** — Table / Calendar / Staff-grid views, drag conflict detection, walk-in support (no customer account needed), status flow PENDING → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED / NO_SHOW
- **Multi-branch** — every branch has its own staff, stock, hours, currency-hint and independent revenue reporting
- **Services & catalog** — categories, per-branch price overrides, member pricing
- **Staff** — verification queue, monthly revenue targets, target-aware commission (paid only above target), photo upload via Cloudinary, schedule editor
- **Customers** — profile + history, loyalty streaks, referral codes
- **Memberships** — plan builder (validity, benefits, member-price discounts), auto-applied at booking + POS
- **Coupons** — usage limits, per-customer restriction, auto-applied at booking

### Point-of-sale
- **Unified Sales page** — one ticket holds products + services + attached pending bookings
- **POS terminal UI** — tap-to-add tiles, big quick-pay buttons (Cash / UPI / Card), cart persists per branch in localStorage
- **GST toggle** — server-side rate math, per-branch tax rate
- **Printable receipt** — 80mm thermal-printer layout via `window.print()`, WhatsApp share option

### Growth toolkit
- **Rebook / Win-back / Birthday** funnels with WhatsApp + SMS deep-links (no automation cost)
- **Referrals** — every customer gets a share code; both parties earn 100 pts on the referee's first completed booking
- **Loyalty streak card** on the customer home
- **Notification templates** (admin CRUD, 6 seeded types)
- **WhatsApp Cloud API** integration — best-effort booking confirmations
- **Embeddable public booking widget** — `/book/:branchId`, ?embed=1 for iframe use, share link to Instagram bio or embed on any site

### Payment collection
- Collect payment against any pending booking; walk-in service sale in one modal
- Payment methods editable in Settings (custom name + emoji icon)

### Roles & permissions
- ADMIN / MANAGER / STAFF / CUSTOMER, matrix defined in **Access Control**
- Server-side scoping so a STAFF user only sees their own bookings + earnings
- Dedicated customer portal at `/my/*`

### Admin & config
- Branding (name, tagline, primary color, font, logo)
- Currency & tax rate (default GST 18%)
- Business hours + holidays
- Payment methods
- WhatsApp connect status + test send

---

## 3. Tech Stack

### Backend

| Concern         | Choice                                                        |
|-----------------|---------------------------------------------------------------|
| Runtime         | Node.js 20 LTS                                                |
| Language        | TypeScript 5 (strict)                                         |
| Framework       | Express 4                                                     |
| ORM             | Prisma 5.22                                                   |
| Database        | PostgreSQL 15+                                                |
| Auth            | JWT (access + refresh) with bcrypt hashing                    |
| Validation      | Zod                                                           |
| File uploads    | Multer (memory) → Cloudinary                                  |
| Messaging       | WhatsApp Cloud API (graph.facebook.com/v20.0)                 |
| Logging         | Winston + morgan                                              |
| Security        | Helmet, CORS, rate-limit                                      |
| Process         | Nodemon (dev) / tsc + node (prod, on Railway)                 |

### Frontend

| Concern             | Choice                                       |
|---------------------|----------------------------------------------|
| Framework           | React 18                                     |
| Build tool          | Vite 5                                       |
| Language            | TypeScript 5                                 |
| Styling             | Tailwind CSS 3                               |
| State (server)      | TanStack Query 5                             |
| State (client)      | Zustand                                      |
| Forms               | react-hook-form                              |
| Routing             | React Router 6                               |
| Icons               | lucide-react                                 |
| Charts              | Recharts                                     |
| Notifications       | react-hot-toast                              |
| Auth persistence    | localStorage (tokens); auto-refresh axios interceptor |

### Delivery

| Concern       | Choice                            |
|---------------|-----------------------------------|
| Frontend host | Vercel                            |
| Backend host  | Railway                           |
| DB host       | Railway PostgreSQL                |
| Media host    | Cloudinary                        |
| CI            | Vercel + Railway GitHub webhooks  |
| Migrations    | `prisma migrate deploy` on start  |

---

## 4. Architecture

```
                          ┌─────────────────┐
                          │  Customer /     │
                          │  Salon Owner    │
                          │  (Browser)      │
                          └────────┬────────┘
                                   │  HTTPS
                                   ▼
                          ┌─────────────────┐
                          │   Vercel Edge   │
                          │  (React SPA)    │
                          └────────┬────────┘
                                   │  JSON over HTTPS
                                   ▼
                          ┌─────────────────┐          ┌─────────────────┐
                          │  Railway API    │◄────────►│  Cloudinary     │
                          │  Node + Express │  Upload  │  (images)       │
                          └────────┬────────┘          └─────────────────┘
                                   │  Prisma
                                   ▼
                          ┌─────────────────┐          ┌─────────────────┐
                          │   PostgreSQL    │          │  WhatsApp Cloud │
                          │   (Railway)     │◄─────────┤  API (Meta)     │
                          └─────────────────┘  outbound└─────────────────┘
```

### Layers

- **Presentation (frontend/src/pages)** — role-scoped page components, mobile-first Tailwind, TanStack Query hooks for all data
- **Layout (frontend/src/layouts)** — `DashboardLayout` (authed) and a bare-body public route for `/book/:branchId`
- **API layer (backend/src/routes)** — thin Express routers, one file per resource, all guarded by `authenticate` + `authorize(...)` except `/public/*`
- **Service layer (backend/src/services)** — business logic and Prisma transactions. Serializable isolation for booking creation to prevent double-book races
- **Data layer (Prisma)** — one schema file (`schema.prisma`), 10+ real migrations, seed via `bootstrap.ts` (which also detects failed migrations and heals baseline state)
- **Cross-cutting** — `middlewares/` (auth, validate, errorHandler, asyncHandler), `utils/` (ApiResponse, ApiError, scope helpers)

### Data model highlights

- 23+ Prisma models: User, Profile, Branch, City, Service, Category, Staff, StaffService, StaffSchedule, Booking, ProductCategory, Product, ProductBranchStock, ProductSale, ProductSaleItem, Coupon, MembershipPlan, Membership, StaffEarning, Payout, Review, Notification, NotificationTemplate, PaymentMethod, TaxRate, Referral, Inquiry
- **Booking.customerId is nullable** → supports walk-ins with `walkInName` + `walkInPhone`
- **Products** are a shared catalog with per-branch stock in `ProductBranchStock`
- **Referrals** use unique 6-char codes on User with auto-award on first completed booking

### Security

- JWT_SECRET / JWT_REFRESH_SECRET validated at startup (32+ chars, must differ in prod)
- Passwords hashed with bcrypt (cost 12)
- Server-side role scoping via `utils/scope.ts` (CUSTOMER sees only their own data)
- All money math (tax, commission, discounts) computed on the server — client input never trusted
- CORS locked to `CORS_ORIGIN`
- Rate limiter applies to all routes including `/public/*`

---

## 5. Directory structure

```
Saloon_Management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                # Single source of truth
│   │   ├── migrations/                  # 0001_init … 0010_referrals
│   │   ├── bootstrap.ts                 # Deploy-time: migrate + heal + seed
│   │   └── seed.ts
│   └── src/
│       ├── config/                      # env, database, cloudinary, whatsapp
│       ├── controllers/                 # thin request → service pass-throughs
│       ├── middlewares/                 # auth, validate, error handler
│       ├── routes/                      # one router per resource
│       ├── services/                    # business logic + Prisma tx
│       ├── utils/                       # ApiResponse, ApiError, scope
│       └── server.ts
├── frontend/
│   └── src/
│       ├── components/                  # Modal, Receipt, RoleGuard, etc.
│       ├── hooks/                       # usePaymentMethods, useDefaultTaxRate, useBranding
│       ├── layouts/                     # DashboardLayout (grouped sidebar)
│       ├── pages/                       # one file per route
│       │   ├── my/                      # /my/* customer portal
│       │   ├── Sales.tsx                # Unified POS
│       │   ├── PublicBooking.tsx        # /book/:branchId (no auth)
│       │   └── … (Bookings, Dashboard, Staff, etc.)
│       ├── services/                    # api.ts (axios) + per-resource clients
│       ├── store/                       # Zustand (auth)
│       └── App.tsx                      # route table
├── docs/
├── DEVELOPMENT_PLAN.md
├── FREZKA_ANALYSIS.md
├── SETUP_GUIDE.md
└── README.md                            # this file
```

---

## 6. Getting started

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 15+
- npm

### Backend
```bash
cd backend
npm install
cp .env.example .env         # fill in DB + JWT + Cloudinary
npx prisma migrate dev       # first time only
npx ts-node prisma/bootstrap.ts   # seed permissions + notification templates
npm run dev                  # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env         # set VITE_API_URL to backend URL
npm run dev                  # http://localhost:5173
```

### Default seed credentials
| Role     | Email               | Password    |
|----------|---------------------|-------------|
| ADMIN    | admin@salon.com     | admin123    |
| MANAGER  | manager@salon.com   | manager123  |
| STAFF    | staff@salon.com     | staff123    |

Change these immediately in production.

---

## 7. Environment variables

### Backend (`.env`)
| Key                            | Required | Notes                                          |
|--------------------------------|----------|------------------------------------------------|
| `DATABASE_URL`                 | ✔        | Postgres connection string                     |
| `JWT_SECRET`                   | ✔        | 32+ chars                                      |
| `JWT_REFRESH_SECRET`           | ✔        | 32+ chars, must differ from JWT_SECRET         |
| `NODE_ENV`                     | ✔        | `production` on Railway                        |
| `PORT`                         |          | default 5000                                   |
| `API_PREFIX`                   |          | default `/api/v1`                              |
| `CORS_ORIGIN`                  | ✔ (prod) | Vercel URL                                     |
| `CLOUDINARY_CLOUD_NAME`        |          | for staff / branding photo uploads             |
| `CLOUDINARY_API_KEY`           |          |                                                |
| `CLOUDINARY_API_SECRET`        |          |                                                |
| `WHATSAPP_PHONE_NUMBER_ID`     |          | Meta phone number id                           |
| `WHATSAPP_ACCESS_TOKEN`        |          | Meta system-user or temp token                 |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` |          | optional                                       |
| `WHATSAPP_API_VERSION`         |          | default `v20.0`                                |

### Frontend (`.env`)
| Key            | Required | Notes                            |
|----------------|----------|----------------------------------|
| `VITE_API_URL` | ✔        | Full URL incl. `/api/v1` prefix  |

---

## 8. API overview

Base URL: `<host>/api/v1`

| Namespace                | Purpose                                              |
|--------------------------|------------------------------------------------------|
| `/auth`                  | Login, register, refresh, logout                     |
| `/branches`              | Salon locations                                      |
| `/services` `/categories`| Service catalog                                      |
| `/staff` `/schedules`    | Staff management + shifts                            |
| `/customers`             | Customer accounts (admin/manager scope)              |
| `/bookings`              | Bookings CRUD + status + `collect-payment` + `quick-sale` |
| `/products`              | Shared product catalog                               |
| `/product-sales`         | POS product sales                                    |
| `/memberships` `/plans`  | Membership plans + issued memberships                |
| `/coupons`               | Coupon CRUD + validation                             |
| `/reviews`               | Post-booking reviews                                 |
| `/reports` `/dashboard`  | Aggregations                                         |
| `/notifications`         | In-app inbox + templates                             |
| `/messaging`             | WhatsApp status + test send                          |
| `/marketing`             | Growth funnel lists (rebook / winback / birthdays)   |
| `/referrals`             | Share code + tracking                                |
| `/settings`              | Business, branding, currency, holidays, taxes, payment methods |
| `/access-control`        | Role permissions matrix                              |
| `/inquiries`             | Public inquiries + admin inbox                       |
| `/uploads`               | Cloudinary sign / upload passthrough                 |
| `/public/*`              | **Unauthenticated** — for the booking widget         |

Every response follows `{ success, message, data, ... }` via `utils/ApiResponse.ts`. Errors use `utils/ApiError.ts` and are surfaced by the global `errorHandler` middleware.

---

## 9. Deployment

**Backend (Railway)** — auto-deploys on push to `main`. Start command runs:
```
npx ts-node prisma/bootstrap.ts && npx prisma migrate deploy && node dist/server.js
```
`bootstrap.ts` detects and heals failed migrations (P3009), seeds permissions and notification templates. Idempotent — safe to re-run.

**Frontend (Vercel)** — auto-deploys on push to `main`. Root: `frontend`. Build: `npm run build`. Output: `dist`.

**Zero-downtime path:** Prisma migrations run before server start; failed migrations get rolled back and re-applied cleanly.

---

## 10. Roadmap

**Shipped (this repo)**
- ✅ Full booking + POS + membership + growth stack
- ✅ WhatsApp Cloud API integration
- ✅ Public embeddable booking widget
- ✅ Unified Sales POS + printable receipt
- ✅ Role-based security, multi-branch scoping

**Planned**
- 🔲 Razorpay / Stripe payment gateway (online deposits, card-on-file)
- 🔲 Tally / Zoho Books CSV export
- 🔲 Native Android PWA wrap for Play Store
- 🔲 Hindi + Tamil UI toggle
- 🔲 Google Calendar sync for staff
- 🔲 Inventory reorder alerts
- 🔲 Barcode scanner + thermal printer hardware helpers

---

## 11. Author

**Ranjith Kumar R**

---

## 12. License

© Aveon Infotech Private Limited. All rights reserved.

This software and its source code are the exclusive property of Aveon Infotech Private Limited. No part of this codebase may be reproduced, distributed, modified, sold, sublicensed or used to derive a competing product without prior written permission from Aveon Infotech Private Limited.

For licensing enquiries, contact Aveon Infotech Private Limited.
