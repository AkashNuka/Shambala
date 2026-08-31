import Link from 'next/link';
import { getAccountBalances } from '@/actions/accounts';
import { getRecentTransactions } from '@/actions/money';
import { formatCurrency, formatDateShort } from '@/lib/utils';

const TXN_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  money_in: { label: 'Money In', icon: '💵', color: 'text-green' },
  transfer: { label: 'Transfer', icon: '↔️', color: 'text-accent-light' },
  operational_expense: { label: 'Expense', icon: '📤', color: 'text-red-light' },
  general_expense: { label: 'Expense', icon: '📤', color: 'text-red-light' },
  supplier_payment: { label: 'Supplier', icon: '🏪', color: 'text-red-light' },
  opening_balance: { label: 'Opening', icon: '📊', color: 'text-accent-light' },
};

const ACCOUNT_TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  cash: { bg: 'bg-green/10', text: 'text-green' },
  bank: { bg: 'bg-accent/10', text: 'text-accent-light' },
  upi: { bg: 'bg-amber/10', text: 'text-amber' },
  other: { bg: 'bg-bg-elevated', text: 'text-text-muted' },
};

export default async function MoneyPage() {
  const [balances, recentTxns] = await Promise.all([
    getAccountBalances(),
    getRecentTransactions(15),
  ]);

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-xl font-bold">Money & Accounts</h1>
        <div className="flex gap-2">
          <Link
            href="/money/add"
            className="px-3 py-1.5 rounded-full bg-green/10 text-green text-xs font-bold border border-green/20"
          >
            + Money In
          </Link>
          <Link
            href="/money/transfer"
            className="px-3 py-1.5 rounded-full bg-accent/10 text-accent-light text-xs font-bold border border-accent/20"
          >
            ↔️ Transfer
          </Link>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-4 animate-fade-in stagger-1">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Balance</p>
        <p className="text-3xl font-bold text-text-primary mt-1">{formatCurrency(totalBalance)}</p>
      </div>

      {/* Account Cards */}
      <div className="space-y-2 mb-6 animate-fade-in stagger-2">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Accounts</h2>
        {balances.map((account) => {
          const badge = ACCOUNT_TYPE_BADGES[account.account_type] || ACCOUNT_TYPE_BADGES.other;
          return (
            <div key={account.account_id} className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${badge.bg} flex items-center justify-center shrink-0`}>
                <span className={`text-sm font-bold ${badge.text}`}>
                  {account.account_type === 'cash' ? '💵' : account.account_type === 'bank' ? '🏦' : account.account_type === 'upi' ? '📱' : '💳'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{account.account_name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-semibold uppercase`}>
                  {account.account_type}
                </span>
              </div>
              <p className={`text-lg font-bold ${account.balance >= 0 ? 'text-green' : 'text-red-light'}`}>
                {formatCurrency(account.balance)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="animate-fade-in stagger-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Recent Movements</h2>
        {recentTxns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxns.map((txn: any) => {
              const meta = TXN_TYPE_LABELS[txn.type] || TXN_TYPE_LABELS.opening_balance;
              const partyName = txn.party?.name || '';
              const isIncome = txn.type === 'money_in' || txn.type === 'opening_balance';

              return (
                <div key={txn.id} className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center text-base shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{meta.label}</h3>
                    <p className="text-xs text-text-muted truncate">{txn.description || partyName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${meta.color}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-[10px] text-text-muted">{formatDateShort(txn.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
