'use client';

import { useState, useEffect } from 'react';
import { getParties, createParty } from '@/actions/parties';
import { PARTY_CLASS_LABELS } from '@/lib/constants';
import type { Party, PartyClass } from '@/lib/types';
import Link from 'next/link';

export default function PeoplePage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [partyClass, setPartyClass] = useState<PartyClass>('person');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParties().then(p => { setParties(p); setLoading(false); });
  }, []);

  const filtered = parties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!name.trim()) return;
    const party = await createParty({ name, class: partyClass, phone: phone || undefined });
    setParties([...parties, party]);
    setName('');
    setPhone('');
    setShowAdd(false);
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">People & Suppliers</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-10 h-10 flex items-center justify-center bg-accent rounded-xl text-white text-xl font-bold active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {showAdd && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 mb-4 animate-fade-in">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-accent"
          />
          <div className="flex gap-2 flex-wrap mb-3">
            {(Object.entries(PARTY_CLASS_LABELS) as [PartyClass, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPartyClass(key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  partyClass === key
                    ? 'border-accent bg-accent-glow text-accent-light'
                    : 'border-border bg-bg-elevated text-text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="w-full py-3 bg-accent text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-40"
          >
            Add Person
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search people..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-accent"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl p-4 animate-pulse-subtle">
              <div className="w-24 h-4 bg-bg-elevated rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-text-secondary text-sm">No people added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Link key={p.id} href={`/more/people/${p.id}`} className="block">
              <div className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {PARTY_CLASS_LABELS[p.class]}{p.phone ? ` · ${p.phone}` : ''}
                    </p>
                  </div>
                  <div className="text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
