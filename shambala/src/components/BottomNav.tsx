'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/expenses', label: 'Expenses', icon: ListIcon },
  { href: '/money', label: 'Money', icon: WalletIcon },
  { href: '/reports', label: 'Reports', icon: ChartIcon },
  { href: '/more', label: 'More', icon: MoreIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-elevated border-t border-border safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-accent scale-105'
                  : 'text-text-muted hover:text-text-secondary active:scale-95'
              }`}
            >
              <Icon filled={isActive} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// Inline SVG Icons (no external dependency)
// ============================================================

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1} />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function WalletIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="15" rx="3" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1} />
      <path d="M16 12a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
      <path d="M2 10h20" />
    </svg>
  );
}

function ChartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" fill={filled ? 'currentColor' : 'none'} opacity={filled ? 0.2 : 1} />
      <line x1="8" y1="16" x2="8" y2="11" />
      <line x1="12" y1="16" x2="12" y2="8" />
      <line x1="16" y1="16" x2="16" y2="13" />
    </svg>
  );
}

function MoreIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}
