'use client';

import { useState, useEffect } from 'react';
import { getMonthlyReport, getDayBook, getBuildingReport, type ModuleSpend } from '@/actions/reports';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionCard } from '@/components/TransactionCard';

type Tab = 'overview' | 'daybook' | 'buildings';

export default function ReportsPage() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('overview');
  
  // Overview / Building State
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  
  // Daybook State
  const [dayDate, setDayDate] = useState(now.toLocaleDateString('en-CA'));

  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleSpend[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [dayTransactions, setDayTransactions] = useState<any[]>([]);
  const [buildingCosts, setBuildingCosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (tab === 'overview') {
          const res = await getMonthlyReport(year, month);
          setModules(res.modules);
          setGrandTotal(res.grandTotal);
        } else if (tab === 'daybook') {
          const res = await getDayBook(dayDate);
          setDayTransactions(res);
        } else if (tab === 'buildings') {
          const res = await getBuildingReport(year, month);
          setBuildingCosts(res);
        }
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tab, year, month, dayDate]);

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } 
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } 
    else setMonth(m => m + 1);
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'daybook', label: 'Day Book', icon: '📅' },
    { key: 'buildings', label: 'Buildings', icon: '🏢' },
  ];

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 animate-fade-in">Reports Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 animate-fade-in stagger-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-accent text-white shadow-glow-accent'
                : 'bg-bg-card text-text-secondary border border-border hover:border-accent/30'
            }`}
          >
            <span className="block text-lg mb-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in stagger-2">
        {tab === 'overview' && (
          <>
            <MonthSelector 
              monthLabel={monthLabel} 
              isCurrentMonth={isCurrentMonth} 
              onPrev={prevMonth} 
              onNext={nextMonth} 
            />
            <div className="bg-bg-card border border-border rounded-2xl p-5 mb-5">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Expenditure</p>
              {loading ? (
                <div className="h-8 w-32 bg-bg-elevated rounded-lg animate-pulse-subtle mt-2" />
              ) : (
                <p className="text-3xl font-bold text-red-light mt-1">{formatCurrency(grandTotal)}</p>
              )}
            </div>
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">By Category</h2>
              {loading ? <SkeletonList count={6} height="h-16" /> : (
                modules.sort((a, b) => b.total - a.total).map((mod) => {
                  const pct = grandTotal > 0 ? (mod.total / grandTotal) * 100 : 0;
                  return (
                    <div key={mod.module} className="bg-bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mod.icon}</span>
                          <span className="text-sm font-semibold">{mod.label}</span>
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(mod.total)}</span>
                      </div>
                      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.max(pct, 0.5)}%` }} />
                      </div>
                      <p className="text-[10px] text-text-muted mt-1 text-right">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === 'daybook' && (
          <>
            <div className="bg-bg-card border border-border rounded-2xl p-4 mb-5 flex items-center justify-between">
              <label className="text-sm font-semibold text-text-secondary">Select Date:</label>
              <input
                type="date"
                value={dayDate}
                onChange={e => setDayDate(e.target.value)}
                className="bg-bg-input border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {loading ? <SkeletonList count={5} height="h-[72px]" /> : dayTransactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-text-muted text-sm">No transactions for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dayTransactions.map(t => (
                  <TransactionCard
                    key={t.id}
                    title={t.description || t.type.replace('_', ' ')}
                    subtitle={`${(t.party as any)?.name || 'Direct'} · ${(t.account as any)?.name || 'Cash'}`}
                    amount={t.amount}
                    date={t.date}
                    module={t.type}
                    isIncome={t.type === 'money_in' || t.type === 'opening_balance'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'buildings' && (
          <>
            <MonthSelector 
              monthLabel={monthLabel} 
              isCurrentMonth={isCurrentMonth} 
              onPrev={prevMonth} 
              onNext={nextMonth} 
            />
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Cost by Building</h2>
              {loading ? <SkeletonList count={4} height="h-24" /> : buildingCosts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <p className="text-3xl mb-2">🏢</p>
                  <p className="text-text-muted text-sm">No building costs found for this month.</p>
                </div>
              ) : (
                buildingCosts.map(b => (
                  <div key={b.id} className="bg-bg-card border border-border rounded-2xl p-4">
                    <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                      <h3 className="font-bold text-base">{b.name}</h3>
                      <span className="font-bold text-red-light">{formatCurrency(b.total)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-text-muted mb-0.5">Labour</p>
                        <p className="font-semibold text-text-primary">{formatCurrency(b.breakdown.labour)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-0.5">Materials</p>
                        <p className="font-semibold text-text-primary">{formatCurrency(b.breakdown.materials)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted mb-0.5">Machinery</p>
                        <p className="font-semibold text-text-primary">{formatCurrency(b.breakdown.machinery)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Subcomponents for reuse in this file
function MonthSelector({ monthLabel, isCurrentMonth, onPrev, onNext }: any) {
  return (
    <div className="flex items-center justify-between bg-bg-card border border-border rounded-2xl p-4 mb-5">
      <button onClick={onPrev} className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all">←</button>
      <div className="text-center">
        <p className="text-base font-bold">{monthLabel}</p>
        {isCurrentMonth && <p className="text-[10px] text-accent font-semibold">CURRENT MONTH</p>}
      </div>
      <button onClick={onNext} disabled={isCurrentMonth} className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all disabled:opacity-30">→</button>
    </div>
  );
}

function SkeletonList({ count, height }: { count: number, height: string }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`bg-bg-card border border-border rounded-2xl p-4 ${height} animate-pulse-subtle`} />
      ))}
    </div>
  );
}
