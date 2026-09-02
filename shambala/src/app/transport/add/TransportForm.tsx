'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStandaloneTransportRecord } from '@/actions/transport';
import { createParty } from '@/actions/parties';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export function TransportForm({
  initialVehicles,
  initialProviders,
  accounts
}: {
  initialVehicles: any[];
  initialProviders: any[];
  accounts: any[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [cashProviders, setCashProviders] = useState<any[]>(initialProviders);

  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashProviderId, setCashProviderId] = useState('');
  const [accountId, setAccountId] = useState(accounts.length > 0 ? (accounts.find((a: any) => a.is_default)?.id || accounts[0].id) : '');
  const [comments, setComments] = useState('');
  
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  async function handleAddCashProvider(name: string) {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const party = await createParty({ name, class: 'person', role: 'investor' });
      setCashProviders(prev => [...prev, party]);
      setCashProviderId(party.id);
    } catch (err) {
      alert('Failed to add cash provider');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createStandaloneTransportRecord({
        vehicle_id: vehicleId || undefined,
        date: date,
        amount: amount ? Number(amount) : undefined,
        payment_method: paymentMethod as any,
        cash_provider_id: cashProviderId || undefined,
        comments: comments || undefined,
        source: source || undefined,
        destination: destination || undefined,
        account_id: accountId || undefined,
      });
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save transport record');
    } finally {
      setSaving(false);
    }
  }

  const vehicleOptions = initialVehicles.map(v => ({ id: v.id, label: v.vehicle_number, subLabel: v.vehicle_type }));
  const providerOptions = cashProviders.map(p => ({ id: p.id, label: p.name }));
  const accountOptions = accounts.map((a: any) => ({ id: a.id, label: a.name, subLabel: a.type.toUpperCase() }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Add Transport Trip</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Vehicle"
            options={vehicleOptions}
            value={vehicleId}
            onChange={setVehicleId}
            placeholder="🔍 Select Vehicle"
          />

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

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                From
              </label>
              <input 
                type="text" 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                placeholder="Source"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                To
              </label>
              <input 
                type="text" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                placeholder="Destination"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Transport Cost (₹)
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors text-xl font-bold"
              placeholder="0.00"
            />
          </div>

        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Paid From Account"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="🔍 Select Account"
          />

          <SearchableSelect 
            label="Cash Given By"
            options={providerOptions}
            value={cashProviderId}
            onChange={setCashProviderId}
            placeholder="🔍 Search person"
            onAddNew={(name) => handleAddCashProvider(name || 'New Person')}
            addNewLabel="Add Person"
          />

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <select 
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent appearance-none"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Comments
            </label>
            <input 
              type="text" 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
              placeholder="Optional comments"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving || !vehicleId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'SAVE TRANSPORT'}
        </button>
      </form>
    </div>
  );
}
