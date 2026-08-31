// Default project ID used throughout the app (single-project MVP)
export const DEFAULT_PROJECT_ID = '10000000-0000-0000-0000-000000000000';

// Default account IDs
export const DEFAULT_CASH_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  other: 'Other',
};

// Party class labels
export const PARTY_CLASS_LABELS: Record<string, string> = {
  person: 'Person',
  shop: 'Shop',
  supplier: 'Supplier',
};
