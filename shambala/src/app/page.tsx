import Link from 'next/link';
import { getAccountBalances, getThisMonthSpent } from '@/actions/accounts';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency, getGreeting, currentMonthLabel } from '@/lib/utils';

export default async function HomePage() {
  const [balances, monthSpent] = await Promise.all([
    getAccountBalances(),
    getThisMonthSpent(),
  ]);

  const cashBalance = balances.find(b => b.account_type === 'cash')?.balance ?? 0;
  const bankBalance = balances
    .filter(b => b.account_type === 'bank')
    .reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24">
      {/* ============================================================
          GREETING
          ============================================================ */}
      <div className="mb-6 animate-fade-in flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}</h1>
          <p className="text-text-secondary text-sm mt-0.5">Narth Villas</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/reports" className="text-sm font-medium text-accent">
            Reports
          </Link>
          <form action={async () => {
            'use server';
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/login');
          }}>
            <button type="submit" className="text-xs text-text-muted hover:text-red-light transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================
          BALANCE CARDS
          ============================================================ */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in stagger-1">
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Cash</p>
          <p className="text-xl font-bold text-green mt-1">{formatCurrency(cashBalance)}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Bank</p>
          <p className="text-xl font-bold text-accent-light mt-1">{formatCurrency(bankBalance)}</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 animate-fade-in stagger-2 flex justify-between items-center">
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{currentMonthLabel()}</p>
          <p className="text-xl font-bold text-red-light mt-1">{formatCurrency(monthSpent)} <span className="text-sm font-normal text-text-muted">spent</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/money/add" className="w-10 h-10 rounded-full bg-green/10 text-green flex items-center justify-center text-lg shadow-sm border border-green/20" title="Money In">+</Link>
          <Link href="/money/transfer" className="w-10 h-10 rounded-full bg-accent/10 text-accent-light flex items-center justify-center text-lg shadow-sm border border-accent/20" title="Transfer">↔️</Link>
        </div>
      </div>

      {/* ============================================================
          QUICK ADD ACTIONS (ERP)
          ============================================================ */}
      <div className="mb-4 animate-fade-in stagger-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Quick Entry
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/labour/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">👷</span>
            <span className="text-sm font-bold tracking-wide">LABOUR</span>
          </Link>
          <Link
            href="/materials/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">🧱</span>
            <span className="text-sm font-bold tracking-wide">MATERIAL</span>
          </Link>
          <Link
            href="/food/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">🍚</span>
            <span className="text-sm font-bold tracking-wide">FOOD</span>
          </Link>
          <Link
            href="/machinery/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">🚜</span>
            <span className="text-sm font-bold tracking-wide">MACHINERY</span>
          </Link>
          <Link
            href="/salary/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">💰</span>
            <span className="text-sm font-bold tracking-wide">SALARY</span>
          </Link>
          <Link
            href="/transport/add"
            className="flex flex-col items-center justify-center gap-2 bg-bg-card border border-border rounded-2xl p-5 text-text-secondary hover:text-accent-light hover:border-accent/30 transition-all active:scale-95 shadow-sm"
          >
            <span className="text-3xl">🚚</span>
            <span className="text-sm font-bold tracking-wide">TRANSPORT</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
