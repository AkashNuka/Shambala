'use client';

import { CURRENCY } from '@/lib/constants';
import { useToast } from '@/components/Toast';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSalaryRecord } from '@/actions/salary';
import { createParty } from '@/actions/parties';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export function SalaryForm({
  initialEmployees,
  initialProviders,
  accounts
}: {
  initialEmployees: any[];
  initialProviders: any[];
  accounts: any[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [employees, setEmployees] = useState<any[]>(initialEmployees);
  const [cashProviders, setCashProviders] = useState<any[]>(initialProviders);

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashProviderId, setCashProviderId] = useState('');
  const [accountId, setAccountId] = useState(accounts.length > 0 ? (accounts.find((a: any) => a.is_default)?.id || accounts[0].id) : '');
  const [comments, setComments] = useState('');
  const [period, setPeriod] = useState('');

  async function handleAddEmployee(name: string) {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const party = await createParty({ name, class: 'person', role: 'salaried' });
      setEmployees(prev => [...prev, party]);
      setEmployeeId(party.id);
    } catch (err) {
      toast.error('Failed to add employee');
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
      toast.error('Failed to add cash provider');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Derive start_date and end_date from the period (month) if set
      let startDate = date;
      let endDate = date;
      if (period) {
        const [y, m] = period.split('-').map(Number);
        startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        endDate = new Date(y, m, 0).toLocaleDateString('en-CA');
      }

      await createSalaryRecord({
        employee_id: employeeId || undefined,
        start_date: startDate,
        end_date: endDate,
        payment_date: date,
        amount: amount ? Number(amount) : undefined,
        payment_method: paymentMethod as any,
        cash_provider_id: cashProviderId || undefined,
        comments: comments || undefined,
        account_id: accountId || undefined,
      } as any); 
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save salary record');
    } finally {
      setSaving(false);
    }
  }

  const employeeOptions = employees.map(e => ({ id: e.id, label: e.name }));
  const providerOptions = cashProviders.map(p => ({ id: p.id, label: p.name }));
  const accountOptions = accounts.map((a: any) => ({ id: a.id, label: a.name, subLabel: a.type.toUpperCase() }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Add Salary/Advance</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          
          <SearchableSelect 
            label="Employee / Worker"
            options={employeeOptions}
            value={employeeId}
            onChange={setEmployeeId}
            placeholder="🔍 Select Person"
            onAddNew={(name) => handleAddEmployee(name || 'New Employee')}
            addNewLabel="Add Employee"
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
              Salary Month / Period
            </label>
            <input 
              type="month" 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Amount ({CURRENCY})
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
              Comments (e.g. Advance, Final Settlement)
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
          disabled={saving || !employeeId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'SAVE SALARY'}
        </button>
      </form>
    </div>
  );
}
