'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLabourRecord } from '@/actions/labour';
import { getParties, createParty } from '@/actions/parties';
import { getBuildings, getWorkTypes } from '@/actions/master';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default function AddLabourPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Master Data
  const [workers, setWorkers] = useState<any[]>([]);
  const [cashProviders, setCashProviders] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);

  // Form State
  const [workerId, setWorkerId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashProviderId, setCashProviderId] = useState('');
  const [comments, setComments] = useState('');
  const [showMore, setShowMore] = useState(false);

  // Modal State removed in favor of inline creation

  // Form persistence
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('draft_labour');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.workerId) setWorkerId(parsed.workerId);
        if (parsed.workTypeId) setWorkTypeId(parsed.workTypeId);
        if (parsed.buildingId) setBuildingId(parsed.buildingId);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.comments) setComments(parsed.comments);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!loading) {
      sessionStorage.setItem('draft_labour', JSON.stringify({
        workerId, workTypeId, buildingId, amount, comments
      }));
    }
  }, [workerId, workTypeId, buildingId, amount, comments, loading]);

  useEffect(() => {
    async function loadData() {
      try {
        const [labourParties, investorParties, bldgs, works] = await Promise.all([
          getParties(undefined, 'labour'),
          getParties(undefined, 'investor'),
          getBuildings(),
          getWorkTypes(),
        ]);
        
        // Filter parties for dropdowns
        setWorkers(labourParties);
        setCashProviders(investorParties);
        setBuildings(bldgs);
        setWorkTypes(works);
      } catch (err) {
        console.error('Failed to load master data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleAddWorker(name: string) {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const party = await createParty({ name, class: 'person', role: 'labour' });
      setWorkers(prev => [...prev, party]);
      setWorkerId(party.id);
    } catch (err) {
      alert('Failed to add worker');
    } finally {
      setSaving(false);
    }
  }

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
      await createLabourRecord({
        worker_id: workerId,
        work_type_id: workTypeId || undefined,
        building_id: buildingId || undefined,
        date: date,
        amount: amount ? Number(amount) : undefined,
        payment_method: paymentMethod as any,
        cash_provider_id: cashProviderId || undefined,
        comments: comments || undefined,
      });
      sessionStorage.removeItem('draft_labour');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save labour record');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading...</div>;
  }

  // Format options for SearchableSelect
  const workerOptions = workers.map(w => ({ id: w.id, label: w.name, subLabel: w.phone }));
  const providerOptions = cashProviders.map(p => ({ id: p.id, label: p.name }));
  const buildingOptions = buildings.map(b => ({ id: b.id, label: b.display_name }));
  const workTypeOptions = workTypes.map(w => ({ id: w.id, label: w.name }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Add Labour</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Core fields */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Worker"
            options={workerOptions}
            value={workerId}
            onChange={setWorkerId}
            placeholder="🔍 Search worker"
            onAddNew={(name) => handleAddWorker(name || 'New Worker')}
            addNewLabel="Add Worker"
            storageKey="workers"
          />

          <SearchableSelect 
            label="Work Type"
            options={workTypeOptions}
            value={workTypeId}
            onChange={setWorkTypeId}
            placeholder="🔍 Search work type"
            storageKey="workTypes"
          />

          <SearchableSelect 
            label="Building / Location"
            options={buildingOptions}
            value={buildingId}
            onChange={setBuildingId}
            placeholder="🔍 Search building"
            storageKey="buildings"
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

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors text-xl font-bold"
              placeholder="Amount paid"
            />
          </div>

        </div>

        {/* More Details Toggle */}
        {!showMore ? (
          <button 
            type="button" 
            onClick={() => setShowMore(true)}
            className="w-full py-3 text-sm font-semibold text-accent"
          >
            + More Details
          </button>
        ) : (
          <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            
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
            
            <button 
              type="button" 
              onClick={() => setShowMore(false)}
              className="w-full pt-2 text-sm font-semibold text-text-muted text-center"
            >
              Hide Details
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving || !workerId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'SAVE LABOUR'}
        </button>
      </form>

      {/* Add Worker Modal removed */}
    </div>
  );
}
