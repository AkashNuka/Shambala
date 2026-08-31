'use client';

import { formatCurrency, formatDateShort } from '@/lib/utils';

interface TransactionCardProps {
  icon?: string;
  title: string;
  subtitle: string;
  amount: number | null;
  date: string;
  module?: string;
  isIncome?: boolean;
  onDelete?: () => void;
}

const MODULE_COLORS: Record<string, string> = {
  labour: 'border-l-amber',
  food: 'border-l-green',
  machinery: 'border-l-accent',
  salary: 'border-l-red',
  transport: 'border-l-accent-light',
  materials: 'border-l-amber',
  money_in: 'border-l-green',
  transfer: 'border-l-accent-light',
};

export function TransactionCard({ 
  icon = '📄', 
  title, 
  subtitle, 
  amount, 
  date, 
  module = 'default', 
  isIncome,
  onDelete
}: TransactionCardProps) {
  const borderColor = MODULE_COLORS[module] || 'border-l-border';

  return (
    <div className={`bg-bg-card border border-border ${borderColor} border-l-4 rounded-2xl p-4 flex items-center gap-3 shadow-sm group`}>
      <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        <div className="flex flex-col items-end">
          {amount != null && amount > 0 && (
            <p className={`text-sm font-bold ${isIncome ? 'text-green' : 'text-text-primary'}`}>
              {isIncome ? '+' : ''}{formatCurrency(amount)}
            </p>
          )}
          <p className="text-[10px] text-text-muted mt-0.5">{formatDateShort(date)}</p>
        </div>
        
        {onDelete && (
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if (window.confirm('Are you sure you want to delete this record?')) {
                onDelete(); 
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
