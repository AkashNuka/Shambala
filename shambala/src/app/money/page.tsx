import Link from 'next/link';
import { getAccountBalances } from '@/actions/accounts';
import { getRecentTransactions } from '@/actions/money';
import { formatCurrency, formatDateShort } from '@/lib/utils';

const VOUCHER_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  Receipt: { label: 'Money In', icon: '💵', color: 'text-green' },
  Payment: { label: 'Payment', icon: '📤', color: 'text-red-light' },
  Contra: { label: 'Transfer', icon: '↔️', color: 'text-accent-light' },
  Journal: { label: 'Journal', icon: '📝', color: 'text-text-muted' },
  Purchase: { label: 'Purchase', icon: '🏪', color: 'text-red-light' },
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
            {recentTxns.map((voucher: any) => {
              const meta = VOUCHER_TYPE_LABELS[voucher.type] || VOUCHER_TYPE_LABELS.Journal;
              
              // Find primary amount (usually max debit or max credit)
              let amount = 0;
              let isIncome = voucher.type === 'Receipt';
              
              if (voucher.lines && voucher.lines.length > 0) {
                 amount = Math.max(...voucher.lines.map((l: any) => l.debit || l.credit || 0));
              }

              // Try to find a party name
              let partyName = '';
              if (voucher.lines) {
                const lineWithParty = voucher.lines.find((l: any) => l.party?.name);
                if (lineWithParty) partyName = lineWithParty.party.name;
              }

              return (
                <div key={voucher.id} className="bg-bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center text-base shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{meta.label} <span className="text-[10px] text-text-muted font-normal ml-1">({voucher.voucher_no})</span></h3>
                    <p className="text-xs text-text-muted truncate">{voucher.narration || partyName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${meta.color}`}>
                      {isIncome ? '+' : voucher.type === 'Journal' || voucher.type === 'Contra' ? '' : '-'}{formatCurrency(amount)}
                    </p>
                    <p className="text-[10px] text-text-muted">{formatDateShort(voucher.date)}</p>
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
