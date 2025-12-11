# Personal Finance Dashboard

Modern personal finance dashboard built with Next.js that tracks accounts, transactions, budgets, savings goals, recurring bills, and notifications using MongoDB.

## Features
- MongoDB-backed transaction import and listing.
- Budget, savings, recurring bills, and notification views with customizable page layouts.
- Auth pages for login/signup plus onboarding, theming, and responsive layout components.

## Tech Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS + Radix UI components
- MongoDB + Mongoose for data persistence

## Getting Started
### Prerequisites
- Node.js 18+ (LTS recommended)
- npm (repo ships with `package-lock.json`)
- MongoDB local or Atlas cluster

### Install
```bash
npm install
```

### Environment
Keep your credentials in `.env.local` (never commit this file):
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/
DB_NAME=personal-finance
```
For local MongoDB, use `mongodb://localhost:27017` and set `DB_NAME` to your local database name.

### Database Setup (local)
Ensure MongoDB is running locally (or connect to Atlas via `MONGODB_URI`).

### Run
```bash
npm run dev
# open http://localhost:3000
```

### Lint / Build
```bash
npm run lint
npm run build
npm start   # serves production build
```

## Project Structure (high level)
- `app/` – Next.js routes (pages + API)
- `components/` – UI and dashboard widgets
- `lib/models/` – Mongoose schemas
- `lib/db/mongodb.ts` – Connection helpers and role-based DB selection
- `scripts/` – Data generation/import scripts


