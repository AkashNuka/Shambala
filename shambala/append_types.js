const fs = require('fs');
const content = `

// ----------------------------------------------------------------------------
// Accounting Engine (Double-Entry)
// ----------------------------------------------------------------------------

export type AccountGroup = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type VoucherType = 'Receipt' | 'Payment' | 'Journal' | 'Contra' | 'Purchase' | 'Sales';

export interface LedgerAccount {
  id: string;
  project_id: string;
  name: string;
  account_group: AccountGroup;
  normal_balance?: 'Debit' | 'Credit';
  is_active: boolean;
}

export interface Voucher {
  id: string;
  project_id: string;
  voucher_no: string;
  type: VoucherType;
  date: string;
  narration?: string;
  reference_table?: string;
  reference_id?: string;
  is_reversed: boolean;
  reversed_by_id?: string;
}

export interface VoucherLine {
  id: string;
  voucher_id: string;
  ledger_id: string;
  party_id?: string;
  cost_center_id?: string;
  debit: number;
  credit: number;
  due_date?: string;
  
  ledger?: LedgerAccount;
  party?: any;
  cost_center?: any;
}
`;

fs.appendFileSync('./src/lib/types.ts', content);
