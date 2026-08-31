'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createMachineryRecord } from '@/actions/machinery';
import { getParties } from '@/actions/parties';
import { getMachinery, getFuelTypes } from '@/actions/master';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default function AddMachineryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Master Data
  const [machines, setMachines] = useState<any[]>([]);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cashProviders, setCashProviders] = useState<any[]>([]);

  // Machinery State
  const [machineryId, setMachineryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startMeter, setStartMeter] = useState('');
  const [endMeter, setEndMeter] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashProviderId, setCashProviderId] = useState('');
  const [comments, setComments] = useState('');

  // Fuel State
  const [showFuel, setShowFuel] = useState(false);
  const [fuelTypeId, setFuelTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [supplierId, setSupplierId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [mach, fuels, parties] = await Promise.all([
          getMachinery(),
          getFuelTypes(),
          getParties(),
        ]);
        
        setMachines(mach);
        setFuelTypes(fuels);
        setSuppliers(parties.filter(p => p.class === 'shop' || p.class === 'supplier'));
        setCashProviders(parties.filter(p => p.class === 'person'));
      } catch (err) {
        console.error('Failed to load master data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-calculate hours if meters change
  useEffect(() => {
    if (startMeter && endMeter) {
      const diff = Number(endMeter) - Number(startMeter);
      if (diff > 0) setTotalHours(diff.toString());
    }
  }, [startMeter, endMeter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createMachineryRecord(
        {
          machine_id: machineryId || undefined,
          date,
          start_time: startMeter || undefined,
          end_time: endMeter || undefined,
          hours: totalHours ? Number(totalHours) : undefined,
          amount: amount ? Number(amount) : undefined,
          payment_method: paymentMethod as any,
          cash_provider_id: cashProviderId || undefined,
          comments: comments || undefined,
        } as any,
        showFuel ? {
          fuel_type: fuelTypeId || undefined,
          quantity: quantity ? Number(quantity) : undefined,
          unit: 'Liters',
          amount: fuelCost ? Number(fuelCost) : undefined,
          provider_id: supplierId || undefined,
        } as any : undefined
      );
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save machinery record');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  const machineOptions = machines.map(m => ({ id: m.id, label: m.name, subLabel: m.type }));
  const fuelOptions = fuelTypes.map(f => ({ id: f.id, label: f.name }));
  const supplierOptions = suppliers.map(s => ({ id: s.id, label: s.name }));
  const providerOptions = cashProviders.map(p => ({ id: p.id, label: p.name }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Machinery & Fuel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Machine"
            options={machineOptions}
            value={machineryId}
            onChange={setMachineryId}
            placeholder="🔍 Select Machine (e.g. JCB-01)"
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
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Start Meter
              </label>
              <input 
                type="number" 
                value={startMeter}
                onChange={e => setStartMeter(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                placeholder="0.0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                End Meter
              </label>
              <input 
                type="number" 
                value={endMeter}
                onChange={e => setEndMeter(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                placeholder="0.0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Total Hours
            </label>
            <input 
              type="number" 
              value={totalHours}
              onChange={e => setTotalHours(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-accent font-bold outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Machine Rent/Cost (₹)
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent text-xl font-bold"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Fuel Link */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
          {!showFuel ? (
            <button 
              type="button"
              onClick={() => setShowFuel(true)}
              className="w-full text-accent font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">⛽</span> Add Fuel Record
            </button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-text flex items-center gap-2"><span className="text-xl">⛽</span> Fuel Entry</h3>
                <button type="button" onClick={() => setShowFuel(false)} className="text-text-muted text-sm">Remove</button>
              </div>
              
              <SearchableSelect 
                label="Fuel Type"
                options={fuelOptions}
                value={fuelTypeId}
                onChange={setFuelTypeId}
                placeholder="🔍 Select Fuel"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Quantity (Liters)
                  </label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Fuel Cost
                  </label>
                  <input 
                    type="number" 
                    value={fuelCost}
                    onChange={e => setFuelCost(e.target.value)}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent font-bold text-accent"
                    placeholder="₹0.00"
                  />
                </div>
              </div>
              
              <SearchableSelect 
                label="Fuel Station/Supplier"
                options={supplierOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="🔍 Select Supplier"
              />
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Cash Given By"
            options={providerOptions}
            value={cashProviderId}
            onChange={setCashProviderId}
            placeholder="🔍 Search person"
          />

          <div className="flex gap-3">
            <div className="flex-1">
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
          disabled={saving || !machineryId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'SAVE MACHINERY RECORD'}
        </button>
      </form>
    </div>
  );
}
