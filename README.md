# Event Gamification Web Platform

A production-ready, full-stack event gamification platform featuring an **Admin Portal** and a **User (Team) Portal** for running live, timed, multi-round competitive events in slots with real-time per-slot leaderboards.

---

## 🚀 Tech Stack

- **Frontend:** React (Vite) + TypeScript + TailwindCSS + Lucide Icons. Deployed on **Vercel**.
- **Backend:** Node.js + Express + TypeScript. Deployed on **Vercel** serverless functions (`@vercel/node`).
- **Database & Realtime:** **Supabase** (Postgres) with Supabase Realtime subscriptions.
- **Auth & Security:** JWT tokens (Admin & Team roles) issued by Express backend, bcrypt password hashing.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
JWT_SECRET=super-secret-jwt-key-gamification-2026
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📦 Setup & Local Development

### 1. Database Migration (Supabase)
Run the SQL script located in `supabase/migrations/01_initial_schema.sql` in your Supabase SQL Editor.

### 2. Backend Installation & Seed
```bash
cd backend
npm install
npm run seed
npm run dev
```

Initial seeded Admin credentials:
- **Username:** `Kaamesh`
- **Email:** `kaamesh712006@gmail.com`
- **Password:** `AdminPassword123!`

### 3. Frontend Installation & Startup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Vercel Deployment Guide

### Deploy Backend:
1. Import `backend/` folder into Vercel.
2. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`.
3. Vercel automatically detects `vercel.json` and builds `@vercel/node` serverless functions.

### Deploy Frontend:
1. Import `frontend/` folder into Vercel.
2. Add environment variables: `VITE_API_BASE_URL` (pointing to your Vercel backend URL), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Build command: `npm run build`, Output directory: `dist`.
