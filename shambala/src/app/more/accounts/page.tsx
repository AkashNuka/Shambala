'use client';

import { useState, useEffect } from 'react';
import { getAccounts } from '@/actions/accounts';
import type { Account } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  upi: '📱',
  other: '💳',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccounts().then(a => { setAccounts(a); setLoading(false); });
  }, []);

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-5">Accounts</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl p-4 animate-pulse-subtle">
              <div className="w-24 h-4 bg-bg-elevated rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl w-10 h-10 flex items-center justify-center bg-bg-elevated rounded-xl">
                  {TYPE_ICONS[acc.type] || '💳'}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{acc.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5 capitalize">
                    {acc.type}{acc.is_default ? ' · Default' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
