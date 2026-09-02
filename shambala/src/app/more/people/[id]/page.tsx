'use client';

import { useState, useEffect, useMemo } from 'react';
import { getParty, getPartyTransactions } from '@/actions/parties';
import { PARTY_CLASS_LABELS } from '@/lib/constants';
import { DeletePartyButton } from '@/components/DeletePartyButton';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const TXN_TYPE_MAP: Record<string, { label: string; type: 'debit' | 'credit' }> = {
  operational_expense: { label: 'Payment', type: 'debit' },
  supplier_payment: { label: 'Supplier Payment', type: 'debit' },
  general_expense: { label: 'Expense', type: 'debit' },
  money_in: { label: 'Receipt', type: 'credit' },
  transfer: { label: 'Transfer', type: 'debit' },
  opening_balance: { label: 'Opening Balance', type: 'credit' },
};

export default function PartyLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, txns] = await Promise.all([
          getParty(id),
          getPartyTransactions(id, dateFrom || undefined, dateTo || undefined),
        ]);
        setParty(p);
        setTransactions(txns);
      } catch (err) {
        console.error('Failed to load party data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, dateFrom, dateTo]);

  // Compute ledger rows with running balance
  const { ledgerRows, totalDebit, totalCredit, closingBalance } = useMemo(() => {
    let balance = 0;
    let debitSum = 0;
    let creditSum = 0;

    const rows = transactions.map((txn) => {
      const meta = TXN_TYPE_MAP[txn.type] || { label: txn.type, type: 'debit' as const };
      const amount = Number(txn.amount) || 0;
      let debit = 0;
      let credit = 0;

      if (meta.type === 'debit') {
        debit = amount;
        balance += amount; // We paid them → they received
      } else {
        credit = amount;
        balance -= amount; // They paid us → we received
      }

      debitSum += debit;
      creditSum += credit;

      return {
        id: txn.id,
        date: txn.date,
        particulars: txn.description || meta.label,
        voucherType: meta.label,
        accountName: (txn.account as any)?.name || '',
        refTable: txn.reference_table,
        debit,
        credit,
        balance,
      };
    });

    return { ledgerRows: rows, totalDebit: debitSum, totalCredit: creditSum, closingBalance: balance };
  }, [transactions]);

  if (loading && !party) {
    return (
      <main className="p-4 max-w-lg mx-auto pb-24 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-bg-elevated rounded-xl animate-pulse-subtle" />
          <div className="space-y-2">
            <div className="w-40 h-6 bg-bg-elevated rounded-lg animate-pulse-subtle" />
            <div className="w-24 h-3 bg-bg-elevated rounded animate-pulse-subtle" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 h-20 animate-pulse-subtle" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-bg-card border border-border rounded-2xl p-3 h-14 animate-pulse-subtle mb-2" />
        ))}
      </main>
    );
  }

  if (!party) return null;

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/more/people" className="w-10 h-10 flex items-center justify-center bg-bg-card border border-border rounded-xl text-text-secondary active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{party.name}</h1>
            <p className="text-xs text-text-muted">{PARTY_CLASS_LABELS[party.class]}{party.phone ? ` · ${party.phone}` : ''}</p>
          </div>
        </div>
        <DeletePartyButton partyId={party.id} partyName={party.name} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5 animate-fade-in stagger-1">
        <div className="bg-bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Paid</p>
          <p className="text-base font-bold text-red-light mt-1">{formatCurrency(totalDebit)}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Received</p>
          <p className="text-base font-bold text-green mt-1">{formatCurrency(totalCredit)}</p>
        </div>
        <div className={`border rounded-2xl p-3 text-center ${
          closingBalance > 0 
            ? 'bg-red-light/5 border-red-light/20' 
            : closingBalance < 0 
              ? 'bg-green/5 border-green/20'
              : 'bg-bg-card border-border'
        }`}>
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Balance</p>
          <p className={`text-base font-bold mt-1 ${
            closingBalance > 0 ? 'text-red-light' : closingBalance < 0 ? 'text-green' : 'text-text-primary'
          }`}>
            {closingBalance > 0 ? '' : closingBalance < 0 ? '' : ''}{formatCurrency(Math.abs(closingBalance))}
          </p>
          <p className="text-[9px] text-text-muted mt-0.5">
            {closingBalance > 0 ? 'We owe them' : closingBalance < 0 ? 'They owe us' : 'Settled'}
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 mb-4 animate-fade-in stagger-2">
        <div className="flex-1">
          <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="self-end px-3 py-2 text-xs text-accent font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ledger Header */}
      <div className="animate-fade-in stagger-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>📒</span> Ledger
          <span className="text-text-muted font-normal">({transactions.length} entries)</span>
        </h2>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border mb-1">
          <span>Particulars</span>
          <span className="w-20 text-right">Debit</span>
          <span className="w-20 text-right">Credit</span>
          <span className="w-20 text-right">Balance</span>
        </div>

        {/* Ledger Rows */}
        {loading ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-bg-card border border-border rounded-xl animate-pulse-subtle" />
            ))}
          </div>
        ) : ledgerRows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📒</p>
            <p className="text-text-muted text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {ledgerRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-1 bg-bg-card border border-border rounded-xl px-3 py-2.5 items-center text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{row.particulars}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-text-muted">{formatDate(row.date)}</span>
                    {row.accountName && (
                      <>
                        <span className="text-text-muted">·</span>
                        <span className="text-[10px] text-text-muted truncate">{row.accountName}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`w-20 text-right font-semibold tabular-nums ${row.debit > 0 ? 'text-red-light' : 'text-transparent'}`}>
                  {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                </span>
                <span className={`w-20 text-right font-semibold tabular-nums ${row.credit > 0 ? 'text-green' : 'text-transparent'}`}>
                  {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                </span>
                <span className={`w-20 text-right font-bold tabular-nums ${
                  row.balance > 0 ? 'text-red-light' : row.balance < 0 ? 'text-green' : 'text-text-muted'
                }`}>
                  {formatCurrency(Math.abs(row.balance))}
                </span>
              </div>
            ))}

            {/* Totals Row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 bg-bg-elevated border border-accent/20 rounded-xl px-3 py-3 items-center text-xs font-bold mt-2">
              <span className="text-text-primary uppercase tracking-wider text-[10px]">Total</span>
              <span className="w-20 text-right text-red-light tabular-nums">{formatCurrency(totalDebit)}</span>
              <span className="w-20 text-right text-green tabular-nums">{formatCurrency(totalCredit)}</span>
              <span className={`w-20 text-right tabular-nums ${
                closingBalance > 0 ? 'text-red-light' : closingBalance < 0 ? 'text-green' : 'text-text-primary'
              }`}>
                {formatCurrency(Math.abs(closingBalance))}
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
