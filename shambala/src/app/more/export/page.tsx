'use client';

import { useState } from 'react';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: exportType });
      if (exportType !== 'all') {
        params.set('month', month);
        params.set('year', year);
      }

      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shambala-${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-2">Export Data</h1>
      <p className="text-text-secondary text-sm mb-6">Download your transactions as an Excel file</p>

      <div className="mb-5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
          Export Type
        </label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Transactions', icon: '📋' },
            { value: 'expense', label: 'Expenses Only', icon: '💸' },
            { value: 'income', label: 'Money In Only', icon: '💵' },
            { value: 'salary', label: 'Salaries Only', icon: '💰' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setExportType(opt.value)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                exportType === opt.value
                  ? 'border-accent bg-accent-glow'
                  : 'border-border bg-bg-card'
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {exportType !== 'all' && (
        <div className="flex gap-2 mb-8 animate-fade-in">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="flex-1 bg-bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={exporting}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98] mb-8 ${
          exporting
            ? 'bg-bg-elevated text-text-muted'
            : 'bg-accent text-white shadow-glow-accent hover:brightness-110'
        }`}
      >
        {exporting ? 'Exporting...' : '📤 Download Excel'}
      </button>

      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold mb-2 text-text-primary">Full Database Backup</h2>
        <p className="text-text-secondary text-sm mb-4">
          Download a complete raw JSON backup of all your data (people, records, transactions, master data). Keep this safe in case you need to restore your system.
        </p>
        <button
          onClick={() => {
            window.location.href = '/api/backup';
          }}
          className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98] border border-border bg-bg-card hover:border-accent text-text-primary flex items-center justify-center gap-2"
        >
          <span>💾</span> Download Full Backup (.json)
        </button>
      </div>
    </div>
  );
}
