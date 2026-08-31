'use client';

import { useState, useEffect } from 'react';
import { getMonthlyReport, type ModuleSpend } from '@/actions/reports';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleSpend[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getMonthlyReport(year, month)
      .then(({ modules: m, grandTotal: t }) => {
        setModules(m);
        setGrandTotal(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 animate-fade-in">Reports</h1>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-bg-card border border-border rounded-2xl p-4 mb-5 animate-fade-in stagger-1">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-base font-bold">{monthLabel}</p>
          {isCurrentMonth && <p className="text-[10px] text-accent font-semibold">CURRENT MONTH</p>}
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Grand Total */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 mb-5 animate-fade-in stagger-2">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Expenditure</p>
        {loading ? (
          <div className="h-8 w-32 bg-bg-elevated rounded-lg animate-pulse-subtle mt-2" />
        ) : (
          <p className="text-3xl font-bold text-red-light mt-1">{formatCurrency(grandTotal)}</p>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3 animate-fade-in stagger-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">By Category</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 h-16 animate-pulse-subtle" />
            ))}
          </div>
        ) : (
          modules
            .sort((a, b) => b.total - a.total)
            .map((mod) => {
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
                  {/* Progress bar */}
                  <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 text-right">
                    {pct.toFixed(1)}%
                  </p>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
