# Salon Management System

A comprehensive multi-branch salon & spa management platform.

## 🏗️ Project Structure

```
Saloon_Management/
├── backend/          # Node.js + Express + TypeScript API
├── frontend/         # React + Vite + TypeScript Admin Panel
├── docs/             # Documentation
├── DEVELOPMENT_PLAN.md
└── FREZKA_ANALYSIS.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+
- npm or pnpm

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🔑 Default Credentials (After Seeding)
- **Admin:** admin@salon.com / admin123
- **Manager:** manager@salon.com / manager123
- **Staff:** staff@salon.com / staff123

## 📚 Documentation
- [Development Plan](DEVELOPMENT_PLAN.md)
- [Frezka Analysis](FREZKA_ANALYSIS.md)

## 🛠️ Tech Stack
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Redux Toolkit
- **Database:** PostgreSQL 15+
- **Auth:** JWT + bcrypt
