# 🗺️ Field Force Tracker

A modern, mobile-first field workforce management app built with **Next.js 15**, **Drizzle ORM**, **Better Auth**, and **Neon Postgres**. Styled with Tailwind CSS and Recharts.

---

## ✨ Features

### Admin
- Live dashboard with daily KPI rings (visits & km targets)
- Worker management — invite, deactivate, view profiles
- Site management — create, edit, list sites by region
- Full reports with date-range filters, bar/line/pie charts, and visit logs

### Worker
- Personal daily dashboard with progress rings
- Log site visits with km, notes, arrival/departure times
- View own visit history

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/LeroyAdonis/field-force-tracker.git
cd field-force-tracker
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in your `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.

### 3. Push schema & seed
```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

### 4. Run locally
```bash
npm run dev
```

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`
4. Deploy — Vercel auto-detects Next.js

---

## 🔐 Default Credentials (after seed)

| Role   | Email                        | Password    |
|--------|------------------------------|-------------|
| Admin  | admin@fieldforce.co.za       | Admin@123   |
| Worker | thabo@fieldforce.co.za       | Worker@123  |
| Worker | ayanda@fieldforce.co.za      | Worker@123  |
| Worker | sipho@fieldforce.co.za       | Worker@123  |

---

## 🗂️ Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Framework  | Next.js 15 (App Router)       |
| Auth       | Better Auth (credentials)     |
| ORM        | Drizzle ORM                   |
| Database   | Neon (serverless Postgres)    |
| Styling    | Tailwind CSS v4               |
| Charts     | Recharts                      |
| UI         | shadcn/ui components          |

---

Built by [Digital Wave Tech](https://github.com/LeroyAdonis) 🌊
