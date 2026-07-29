# 🚀 Salon Management - Setup Guide

Complete setup instructions to run the MVP locally.

---

## ✅ Prerequisites

Install these tools first:

1. **Node.js 20+ LTS** — https://nodejs.org
2. **PostgreSQL 15+** — https://www.postgresql.org/download/
3. **Git** — https://git-scm.com/
4. **VS Code** (recommended) — https://code.visualstudio.com/

---

## 📦 Backend Setup

### Step 1: Install Dependencies

```bash
cd D:\Ranjith\Saloon_Management\backend
npm install
```

### Step 2: Setup PostgreSQL Database

Open PostgreSQL command line (psql) or pgAdmin and create the database:

```sql
CREATE DATABASE salon_management;
```

### Step 3: Configure Environment

The `.env` file is already created. Update the `DATABASE_URL` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/salon_management?schema=public"
```

### Step 4: Run Migrations & Seed Data

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 5: Start Backend Server

```bash
npm run dev
```

Backend runs at: **http://localhost:5000**
API base URL: **http://localhost:5000/api/v1**
Health check: **http://localhost:5000/api/v1/health**

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd D:\Ranjith\Saloon_Management\frontend
npm install
```

### Step 2: Start Frontend

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Default Login Credentials

| Role     | Email                | Password     |
|----------|----------------------|--------------|
| Admin    | admin@salon.com      | admin123     |
| Manager  | manager@salon.com    | manager123   |
| Staff    | staff@salon.com      | staff123     |
| Customer | john@example.com     | customer123  |

---

## 📡 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh-token` — Refresh access token
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/auth/me` — Get current user
- `POST /api/v1/auth/change-password` — Change password

### Branches
- `GET /api/v1/branches` — List branches (paginated)
- `POST /api/v1/branches` — Create branch (Admin only)
- `GET /api/v1/branches/:id` — Get branch details
- `GET /api/v1/branches/:id/stats` — Branch statistics
- `PATCH /api/v1/branches/:id` — Update branch
- `DELETE /api/v1/branches/:id` — Delete branch

### Services
- `GET /api/v1/services/categories` — List categories
- `POST /api/v1/services/categories` — Create category
- `GET /api/v1/services` — List services
- `POST /api/v1/services` — Create service
- `PATCH /api/v1/services/:id` — Update service
- `DELETE /api/v1/services/:id` — Delete service

### Staff
- `GET /api/v1/staff` — List staff
- `POST /api/v1/staff` — Create staff
- `PATCH /api/v1/staff/:id/verify` — Verify staff
- `PUT /api/v1/staff/:id/schedule` — Set schedule

### Customers
- `GET /api/v1/customers` — List customers
- `POST /api/v1/customers` — Create customer
- `GET /api/v1/customers/:id/history` — Booking history

### Bookings
- `GET /api/v1/bookings` — List bookings
- `POST /api/v1/bookings` — Create booking
- `GET /api/v1/bookings/calendar` — Calendar view
- `GET /api/v1/bookings/available-slots` — Get slots
- `PATCH /api/v1/bookings/:id/status` — Update status

### Dashboard
- `GET /api/v1/dashboard/stats` — Dashboard metrics
- `GET /api/v1/dashboard/revenue-chart` — Revenue chart data

### Finance (Phase 2)
- `GET /api/v1/finance/taxes` — List taxes
- `POST /api/v1/finance/taxes` — Create tax
- `GET /api/v1/finance/earnings` — All staff earnings
- `GET /api/v1/finance/earnings/staff/:staffId` — Per-staff earnings
- `POST /api/v1/finance/payouts` — Create payout for staff period
- `GET /api/v1/finance/payouts` — List payouts
- `PATCH /api/v1/finance/payouts/:id/pay` — Mark payout as paid

### Coupons (Phase 2)
- `GET /api/v1/coupons` — List coupons
- `POST /api/v1/coupons` — Create coupon
- `POST /api/v1/coupons/validate` — Validate coupon code

### Reviews (Phase 2)
- `GET /api/v1/reviews` — List reviews (with avg rating)
- `POST /api/v1/reviews` — Submit review (customer)
- `GET /api/v1/reviews/staff/:staffId/rating` — Staff rating summary

### Reports (Phase 2)
- `GET /api/v1/reports/daily-bookings` — Daily bookings report
- `GET /api/v1/reports/overall-bookings` — Overall bookings report
- `GET /api/v1/reports/staff-payouts` — Staff payout report
- `GET /api/v1/reports/staff-services` — Staff service report

### Notifications (Phase 2)
- `GET /api/v1/notifications` — User notifications
- `PATCH /api/v1/notifications/read-all` — Mark all as read
- `PATCH /api/v1/notifications/:id/read` — Mark single as read
- `GET /api/v1/notifications/templates/all` — List templates
- `POST /api/v1/notifications/templates` — Create template (admin)

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```
Error: Can't reach database server
```
**Solution:** Ensure PostgreSQL is running:
- Windows: Services → PostgreSQL → Start
- Or run: `pg_ctl start`

### Prisma Migration Fails
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
npx prisma db seed
```

### Port Already in Use
Kill the process using the port:
- Backend (5000): Change `PORT` in `.env`
- Frontend (5173): Change port in `vite.config.ts`

### CORS Error
Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL.

---

## 📁 Project Structure

```
Saloon_Management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data
│   ├── src/
│   │   ├── config/             # DB, env config
│   │   ├── controllers/        # Route handlers
│   │   ├── middlewares/        # Auth, errors, validate
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helpers (JWT, logger)
│   │   ├── validators/         # Zod schemas
│   │   ├── app.ts              # Express app
│   │   └── server.ts           # Entry point
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/         # Reusable components
    │   ├── layouts/            # Page layouts
    │   ├── pages/              # Route pages
    │   ├── services/           # API services
    │   ├── store/              # Zustand stores
    │   ├── App.tsx             # Routes
    │   ├── main.tsx            # Entry point
    │   └── index.css           # Global styles
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## 🎯 What's Included (MVP Phase 1)

✅ **Authentication System**
- JWT-based login/logout/register
- Role-based access control (RBAC)
- Refresh token flow
- Password hashing with bcrypt

✅ **Multi-Branch Management**
- Create/edit/delete branches
- Branch-specific settings
- Branch statistics

✅ **Service Management**
- Service categories & sub-categories
- Service pricing & duration
- Branch-service mapping

✅ **Staff Management**
- Staff CRUD
- Service assignments
- Weekly schedules
- Verification workflow

✅ **Customer Management**
- Customer profiles
- Booking history
- Loyalty points

✅ **Appointment Booking**
- Create/edit/cancel bookings
- Conflict detection
- Available time slots
- Calendar view

✅ **Dashboard**
- Real-time metrics
- Upcoming appointments
- Top services

✅ **Frontend**
- React + TypeScript + Tailwind
- Responsive design
- Sidebar navigation
- Protected routes

---

## 🔜 Next Phase (Phase 2)

- Financial module (payments, commissions, payouts)
- Advanced reporting & analytics
- Notification system (SMS/Email)
- Coupons & promotions
- Reviews & ratings

---

## 💬 Support

For issues or questions, refer to:
- [Development Plan](DEVELOPMENT_PLAN.md)
- [Frezka Analysis](FREZKA_ANALYSIS.md)
