'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActivityFeed, type ActivityItem } from '@/actions/transactions';
import { TransactionCard } from '@/components/TransactionCard';

const MODULE_FILTERS = [
  { key: '', label: 'All' },
  { key: 'labour', label: '👷 Labour' },
  { key: 'food', label: '🍚 Food' },
  { key: 'machinery', label: '🚜 Machinery' },
  { key: 'salary', label: '💰 Salary' },
  { key: 'materials', label: '🧱 Materials' },
  { key: 'transport', label: '🚚 Transport' },
];

export default function ExpensesPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivityFeed(100, {
        module: moduleFilter || undefined,
        search: search || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to load activity', err);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Group items by date
  const grouped = items.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 animate-fade-in">Transaction History</h1>

      {/* Search Bar */}
      <div className="relative mb-3 animate-fade-in stagger-1">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 Search transactions..."
          className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); setSearch(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            ✕
          </button>
        )}
      </div>

      {/* Module Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 animate-fade-in stagger-2 scrollbar-hide">
        {MODULE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setModuleFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
              moduleFilter === f.key
                ? 'bg-accent text-white border-accent shadow-glow-accent'
                : 'bg-bg-card text-text-secondary border-border hover:border-accent/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 h-16 animate-pulse-subtle" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-text-muted">No transactions found</p>
          <p className="text-xs text-text-muted mt-1">
            {search || moduleFilter ? 'Try different filters' : 'Start adding records from the home screen'}
          </p>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in stagger-3">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                {formatGroupDate(date)}
              </h2>
              <div className="space-y-2">
                {grouped[date].map((item) => (
                  <TransactionCard
                    key={`${item.module}-${item.id}`}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    date={item.date}
                    module={item.module}
                    isIncome={item.module === 'money_in'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
