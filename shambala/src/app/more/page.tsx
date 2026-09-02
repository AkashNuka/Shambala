import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
const MENU_ITEMS = [
  {
    section: 'Data',
    items: [
      { href: '/more/categories', icon: '📂', label: 'Categories', desc: 'Manage expense categories' },
      { href: '/more/people', icon: '👥', label: 'People & Suppliers', desc: 'Manage workers, suppliers, contractors' },
      { href: '/more/accounts', icon: '🏦', label: 'Accounts', desc: 'Cash, bank, UPI accounts' },
    ],
  },
  {
    section: 'Import & Export',
    items: [
      { href: '/import', icon: '📥', label: 'Import Excel', desc: 'Import from EXPENDITURE 2025.xlsx' },
      { href: '/more/export', icon: '📤', label: 'Export Data', desc: 'Download as Excel/CSV' },
    ],
  },
  {
    section: 'About',
    items: [
      { href: '', icon: '🏗️', label: `${APP_NAME} v1.0`, desc: 'Construction Site Expense Manager' },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-5">More</h1>

      {MENU_ITEMS.map(section => (
        <div key={section.section} className="mb-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            {section.section}
          </h2>
          <div className="space-y-2">
            {section.items.map(item => {
              const content = (
                <>
                  <span className="text-xl w-10 h-10 flex items-center justify-center bg-bg-elevated rounded-xl">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{item.label}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                  </div>
                  {item.href && (
                    <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </>
              );

              if (!item.href) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 bg-bg-card border border-border rounded-2xl p-4"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 bg-bg-card border border-border rounded-2xl p-4 hover:bg-bg-elevated transition-all active:scale-[0.98]"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
