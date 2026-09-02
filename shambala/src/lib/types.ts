// Shambala - App Types (ERP Model)

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'other';
export type PartyClass = 'person' | 'shop' | 'supplier';

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'upi' | 'other';
  initial_balance: number;
  is_default: boolean;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: 'cash' | 'bank' | 'upi' | 'other';
  balance: number;
}

export interface Building {
  id: string;
  direction: string;
  number: string;
  name?: string;
  display_name: string;
}

export interface WorkerType {
  id: string;
  name: string;
}

export interface WorkType {
  id: string;
  name: string;
}

export interface Party {
  id: string;
  class: PartyClass;
  role: string;
  name: string;
  worker_type_id?: string;
  phone?: string;
  notes?: string;
  is_active: boolean;
  worker_type?: WorkerType; // Joined relation
}

export interface Machine {
  id: string;
  machine_id: string;
  machine_type: string;
  registration_number?: string;
  operator_id?: string;
  fuel_type?: string;
  meter_type?: string;
  is_active: boolean;
  operator?: Party; // Joined relation
}

export interface TransportVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  owner_id?: string;
  driver_id?: string;
  capacity?: string;
  notes?: string;
  driver?: Party; // Joined relation
}

export interface Material {
  id: string;
  class: 'bulk' | 'hardware' | 'electrical' | 'plumbing' | 'finishing' | 'other';
  name: string;
  default_unit?: string;
}

export interface MaterialVariant {
  id: string;
  material_id: string;
  name: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  parent_category?: string;
}

export interface Weighbridge {
  id: string;
  name: string;
  location?: string;
  default_fee?: number;
}

// ----------------------------------------------------------------------------
// Operational Records
// ----------------------------------------------------------------------------

export interface LabourRecord {
  id: string;
  worker_id: string;
  worker_type_id?: string;
  work_type_id?: string;
  building_id?: string;
  date: string;
  time?: string;
  amount?: number;
  cash_provider_id?: string;
  payment_method: PaymentMethod;
  comments?: string;
  
  worker?: Party;
  worker_type?: WorkerType;
  work_type?: WorkType;
  building?: Building;
  cash_provider?: Party;
}

export interface MaterialDelivery {
  id: string;
  material_id: string;
  variant_id?: string;
  supplier_id?: string;
  building_id?: string;
  date: string;
  time?: string;
  quantity?: number;
  unit?: string;
  material_cost?: number;
  comments?: string;
  
  material?: Material;
  variant?: MaterialVariant;
  supplier?: Party;
  building?: Building;
  transport?: TransportTrip;
  weighbridge?: WeighbridgeRecord;
}

export interface TransportTrip {
  id: string;
  project_id: string;
  delivery_id?: string;
  vehicle_id?: string;
  transport_type?: string;
  source_location?: string;
  amount?: number;
  date: string;
  payment_method: PaymentMethod;
  status: string;
  
  vehicle?: TransportVehicle;
}

export interface WeighbridgeRecord {
  id: string;
  delivery_id: string;
  weighbridge_id?: string;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  fee?: number;
  
  weighbridge?: Weighbridge;
}

export interface FoodRecord {
  id: string;
  worker_id?: string;
  worker_type_id?: string;
  food_category_id: string;
  start_date: string;
  end_date: string;
  quantity?: number;
  unit?: string;
  amount?: number;
  shop_id?: string;
  comments?: string;

  worker?: Party;
  food_category?: FoodCategory;
  shop?: Party;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  worker_type_id?: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  cash_provider_id?: string;
  comments?: string;
  
  employee?: Party;
  worker_type?: WorkerType;
  cash_provider?: Party;
}

export interface MachineryRecord {
  id: string;
  machine_id: string;
  operator_id?: string;
  building_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  hours?: number;
  amount?: number;
  charging_type?: string;
  comments?: string;
  
  machine?: Machine;
  operator?: Party;
  building?: Building;
}

export interface FuelRecord {
  id: string;
  machine_id: string;
  building_id?: string;
  fuel_type: string;
  quantity: number;
  unit?: string;
  rate?: number;
  amount?: number;
  previous_meter?: number;
  current_meter?: number;
  date: string;
  provider_id?: string;
  comments?: string;

  machine?: Machine;
  building?: Building;
  provider?: Party;
}


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
