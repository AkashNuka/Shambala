'use client';

import { useToast } from '@/components/Toast';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFoodCategories, getWorkTypes, getWorkerTypes } from '@/actions/master';
import { Modal } from '@/components/Modal';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';

type Tab = 'food' | 'work' | 'worker';

export default function CategoriesPage() {
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('food');
  const [loading, setLoading] = useState(true);

  const [foodCategories, setFoodCategories] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [workerTypes, setWorkerTypes] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [food, work, worker] = await Promise.all([
          getFoodCategories(),
          getWorkTypes(),
          getWorkerTypes(),
        ]);
        setFoodCategories(food || []);
        setWorkTypes(work || []);
        setWorkerTypes(worker || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const tableName = tab === 'food' ? 'food_categories' : tab === 'work' ? 'work_types' : 'worker_types';

      const { data, error } = await supabase
        .from(tableName)
        .insert({ project_id: DEFAULT_PROJECT_ID, name: newName.trim() })
        .select()
        .single();

      if (error) throw error;

      if (tab === 'food') setFoodCategories(prev => [...prev, data]);
      else if (tab === 'work') setWorkTypes(prev => [...prev, data]);
      else setWorkerTypes(prev => [...prev, data]);

      setNewName('');
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'food', label: 'Food', icon: '🍚' },
    { key: 'work', label: 'Work Types', icon: '⚒️' },
    { key: 'worker', label: 'Worker Types', icon: '👷' },
  ];

  const currentItems = tab === 'food' ? foodCategories : tab === 'work' ? workTypes : workerTypes;
  const addLabel = tab === 'food' ? 'Food Category' : tab === 'work' ? 'Work Type' : 'Worker Type';

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center mb-5 animate-fade-in">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-xl font-bold">Categories</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 animate-fade-in stagger-1">
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
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="animate-fade-in stagger-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card border border-border rounded-xl p-4 h-12 animate-pulse-subtle" />
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No {addLabel.toLowerCase()}s yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentItems.map((item: any) => (
              <div key={item.id} className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-sm">
                  {TABS.find(t => t.key === tab)?.icon}
                </div>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent text-white rounded-full shadow-glow-accent flex items-center justify-center text-2xl active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add ${addLabel}`}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="text"
            required
            placeholder={`${addLabel} name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-accent text-white font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saving ? 'Adding...' : `Add ${addLabel}`}
          </button>
        </form>
      </Modal>
    </div>
  );
}
