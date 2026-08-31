'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createStandaloneTransportRecord } from '@/actions/transport';
import { getParties } from '@/actions/parties';
import { getTransportVehicles } from '@/actions/master';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default function AddTransportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Master Data
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [cashProviders, setCashProviders] = useState<any[]>([]);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashProviderId, setCashProviderId] = useState('');
  const [comments, setComments] = useState('');
  
  // Standalone specifics
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [vehs, parties] = await Promise.all([
          getTransportVehicles(),
          getParties(),
        ]);
        
        setVehicles(vehs);
        setCashProviders(parties.filter(p => p.class === 'person'));
      } catch (err) {
        console.error('Failed to load master data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      });
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save transport record');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  const vehicleOptions = vehicles.map(v => ({ id: v.id, label: v.vehicle_number, subLabel: v.vehicle_type }));
  const providerOptions = cashProviders.map(p => ({ id: p.id, label: p.name }));

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
            label="Cash Given By"
            options={providerOptions}
            value={cashProviderId}
            onChange={setCashProviderId}
            placeholder="🔍 Search person"
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
