# Shambala — Construction Site Expense & Cash Manager

A mobile-first web application for recording and managing construction site expenses, labour payments, material purchases, cash flow, and supplier balances.

## Features

- **10-second expense entry** — Large amount input, quick category grid, searchable people picker
- **Cash balance tracking** — Real-time cash and bank balance calculation
- **Transaction history** — Card-based list with search and filters
- **Money management** — Record cash received, bank transfers
- **Supplier tracking** — Track purchases and payments, view outstanding balances
- **Monthly reports** — Category breakdown with progress bars
- **Excel import** — Parse and import from existing EXPENDITURE 2025.xlsx with review system
- **Excel export** — Download transactions as XLSX
- **Mobile-first UI** — Designed for 360-430px Android screens
- **PWA-ready** — Can be installed via "Add to Home Screen"

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Excel | SheetJS (xlsx) |
| Hosting | Vercel |

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and give it a name (e.g., "shambala")
3. Choose a region close to you and set a database password
4. Wait for the project to be created

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open and run `supabase/migrations/001_schema.sql` — this creates all tables
3. Open and run `supabase/migrations/002_seed.sql` — this adds default categories, accounts, and project

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy the **Project URL** and **anon public key**

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone (or use Chrome DevTools mobile view).

### 6. Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

Or use the Vercel CLI:
```bash
npx vercel
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Dashboard / Home
│   ├── layout.tsx               # Root layout with bottom nav
│   ├── globals.css              # Design system
│   ├── expenses/
│   │   ├── page.tsx             # Transaction history
│   │   └── add/page.tsx         # Add expense form
│   ├── money/
│   │   ├── page.tsx             # Account balances
│   │   ├── add/page.tsx         # Money In
│   │   └── transfer/page.tsx    # Transfer between accounts
│   ├── reports/page.tsx         # Monthly + supplier reports
│   ├── import/page.tsx          # Excel import + review
│   ├── more/
│   │   ├── page.tsx             # Settings menu
│   │   ├── categories/page.tsx  # Manage categories
│   │   ├── people/page.tsx      # Manage people/suppliers
│   │   ├── accounts/page.tsx    # Manage accounts
│   │   └── export/page.tsx      # Export data
│   └── api/
│       ├── import/route.ts      # Import API
│       └── export/route.ts      # Export API
├── actions/                     # Server actions
│   ├── transactions.ts
│   ├── parties.ts
│   ├── categories.ts
│   ├── accounts.ts
│   └── reports.ts
├── components/
│   ├── BottomNav.tsx
│   ├── TransactionCard.tsx
│   └── AddExpenseForm.tsx
└── lib/
    ├── types.ts                 # TypeScript types
    ├── constants.ts             # App constants
    ├── utils.ts                 # Formatting utilities
    ├── excel-parser.ts          # Excel import parser
    └── supabase/
        ├── client.ts            # Browser Supabase client
        └── server.ts            # Server Supabase client
```

## Database Schema

See `supabase/migrations/001_schema.sql` for the full schema. Key tables:

- **projects** — Site/project (multi-project ready)
- **accounts** — Cash, Bank, UPI accounts
- **categories** — Hierarchical expense categories
- **parties** — Workers, suppliers, contractors
- **transactions** — All financial transactions (expense, income, transfer, salary, etc.)
- **transaction_items** — Material quantity/rate details
- **imports** / **import_rows** — Excel import tracking

## Importing Historical Data

1. Go to **More → Import Excel**
2. Upload `EXPENDITURE 2025.xlsx`
3. The parser will analyze all sheets and classify transactions
4. Review the results: auto-classified, needs review, rejected
5. Approve/reject individual rows
6. Click "Import" to save to database

The parser handles:
- Daily expenditure logs (SNO/EXPENDITURE/CREDIT/DEBIT format)
- Multi-line descriptions (merges continuation rows)
- Cash input records (VARUN SIR CASH, K.RAJESH SIR CASH)
- Salary records (name, designation, amount, bank/cash)
- Payment records (per-person payment history)
- Material delivery registers (date, quantity, unit)
- Carry-forward detection (excluded from import)
- Cross-sheet duplicate detection
