import { format, isToday, isYesterday, parseISO } from 'date-fns';

import { CURRENCY } from './constants';

/** Format amount with currency symbol and numbering */
export function formatCurrency(amount: number): string {
  return CURRENCY + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd-MM-yyyy');
}

/** Format date as short label (for cards) */
export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM');
}

/** Get today's date as YYYY-MM-DD */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Get current month/year label */
export function currentMonthLabel(): string {
  return format(new Date(), 'MMMM yyyy');
}

/** Get greeting based on time of day */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
