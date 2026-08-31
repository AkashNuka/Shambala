'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTransfer } from '@/actions/money';
import { getAccounts } from '@/actions/accounts';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function TransferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);

  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const accs = await getAccounts();
        setAccounts(accs);
      } catch (err) {
        console.error('Failed to load accounts', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !fromAccountId || !toAccountId) return;
    if (fromAccountId === toAccountId) {
      alert('Please select different accounts');
      return;
    }
    setSaving(true);
    try {
      await createTransfer({
        amount: Number(amount),
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        date,
        description: description || undefined,
      });
      router.push('/money');
    } catch (err) {
      console.error(err);
      alert('Failed to create transfer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  const accountOptions = accounts.map((a: any) => ({
    id: a.id,
    label: a.name,
    subLabel: a.type.toUpperCase(),
  }));

  // Filter out selected account from the other dropdown
  const fromOptions = accountOptions.filter(a => a.id !== toAccountId);
  const toOptions = accountOptions.filter(a => a.id !== fromAccountId);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Transfer</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-accent-light focus:outline-none focus:border-accent transition-colors text-3xl font-bold text-center"
              placeholder="0"
            />
          </div>

          {/* From Account */}
          <SearchableSelect
            label="From Account"
            options={fromOptions}
            value={fromAccountId}
            onChange={setFromAccountId}
            placeholder="🔍 Select source account"
          />

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl">
              ↓
            </div>
          </div>

          {/* To Account */}
          <SearchableSelect
            label="To Account"
            options={toOptions}
            value={toAccountId}
            onChange={setToAccountId}
            placeholder="🔍 Select destination account"
          />

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
              placeholder="e.g. Cash deposit to bank"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !amount || !fromAccountId || !toAccountId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Transferring...' : 'CONFIRM TRANSFER'}
        </button>
      </form>
    </div>
  );
}
