'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  label?: string;
  storageKey?: string; // Key to persist recent selections
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  onAddNew,
  addNewLabel = '+ Add New',
  label,
  storageKey
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load recents on mount
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`recent_${storageKey}`);
        if (stored) {
          setRecents(JSON.parse(stored));
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    
    // Save to recents
    if (storageKey) {
      try {
        const updated = [id, ...recents.filter(r => r !== id)].slice(0, 3);
        setRecents(updated);
        localStorage.setItem(`recent_${storageKey}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const { recentOptions, normalOptions } = useMemo(() => {
    let filtered = options;
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = options.filter(opt => 
        opt.label.toLowerCase().includes(lowerSearch) || 
        opt.subLabel?.toLowerCase().includes(lowerSearch)
      );
      // If searching, don't separate recents
      return { recentOptions: [], normalOptions: filtered };
    }
    
    if (recents.length > 0) {
      const r = recents.map(id => options.find(o => o.id === id)).filter(Boolean) as Option[];
      const n = options.filter(o => !recents.includes(o.id));
      return { recentOptions: r, normalOptions: n };
    }

    return { recentOptions: [], normalOptions: options };
  }, [options, search, recents]);

  const renderOption = (opt: Option) => (
    <div
      key={opt.id}
      onClick={() => handleSelect(opt.id)}
      className={`px-3 py-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${
        value === opt.id 
          ? 'bg-accent/10 text-accent font-semibold' 
          : 'hover:bg-bg-elevated text-text-secondary hover:text-text'
      }`}
    >
      <div className="flex flex-col">
        <span>{opt.label}</span>
        {opt.subLabel && <span className="text-xs text-text-muted mt-0.5">{opt.subLabel}</span>}
      </div>
      {value === opt.id && <span>✓</span>}
    </div>
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      
      {/* Selector Button */}
      <div 
        onClick={() => {
          setIsOpen(true);
          setSearch(''); // Reset search when opening
        }}
        className={`w-full flex items-center justify-between bg-bg border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
          isOpen ? 'border-accent' : 'border-border hover:border-accent/50'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-text-muted' : 'text-text font-medium'}`}>
          {selectedOption ? displayValue : placeholder}
        </span>
        <span className="text-text-muted text-xs ml-2">▼</span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-40 top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[60vh]">
          
          {/* Search Input */}
          <div className="p-2 border-b border-border bg-bg-elevated sticky top-0 z-10">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-2 space-y-1">
            {recentOptions.length === 0 && normalOptions.length === 0 ? (
              <div className="text-center py-4 text-text-muted text-sm">
                No results found
              </div>
            ) : (
              <>
                {recentOptions.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase font-bold text-text-muted px-2 mb-1 tracking-wider">Recent</div>
                    {recentOptions.map(renderOption)}
                    <div className="h-px bg-border my-2 mx-2" />
                  </div>
                )}
                {normalOptions.map(renderOption)}
              </>
            )}
          </div>

          {/* Add New Button */}
          {onAddNew && (
            <div className="p-2 border-t border-border bg-bg-elevated sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full py-2.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>+</span> {addNewLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
