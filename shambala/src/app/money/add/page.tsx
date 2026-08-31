'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addMoneyIn } from '@/actions/money';
import { getAccounts } from '@/actions/accounts';
import { getParties, createParty } from '@/actions/parties';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function MoneyInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [accs, parties] = await Promise.all([
          getAccounts(),
          getParties(undefined, 'investor'),
        ]);
        setAccounts(accs);
        setPeople(parties);
        // Default to first account
        if (accs.length > 0) {
          const defaultAcc = accs.find((a: any) => a.is_default) || accs[0];
          setAccountId(defaultAcc.id);
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !accountId) return;
    setSaving(true);
    try {
      await addMoneyIn({
        amount: Number(amount),
        account_id: accountId,
        party_id: partyId || undefined,
        date,
        description: description || undefined,
      });
      router.push('/money');
    } catch (err) {
      console.error(err);
      alert('Failed to record money in');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPerson(name: string) {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const newParty = await createParty({ name, class: 'person', role: 'investor' });
      setPeople([...people, newParty]);
      setPartyId(newParty.id);
    } catch (err) {
      console.error(err);
      alert('Failed to create person');
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
  const personOptions = people.map((p: any) => ({ id: p.id, label: p.name }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Money In</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          {/* Amount - prominent */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-4 text-green focus:outline-none focus:border-green transition-colors text-3xl font-bold text-center"
              placeholder="0"
            />
          </div>

          {/* Account */}
          <SearchableSelect
            label="To Account"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="🔍 Select Account"
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
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          {/* From (person) */}
          <SearchableSelect
            label="Received From"
            options={personOptions}
            value={partyId}
            onChange={setPartyId}
            placeholder="🔍 Search person (optional)"
            onAddNew={(name) => handleAddPerson(name || 'New Person')}
            addNewLabel="Add Person"
          />

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
              placeholder="e.g. Varun Sir Cash, Bank withdrawal"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !amount || !accountId}
          className="block w-full py-4 bg-green text-white text-center text-lg font-bold rounded-2xl shadow-glow-green hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'RECORD MONEY IN'}
        </button>
      </form>
    </div>
  );
}
