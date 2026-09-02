'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

export interface ActivityItem {
  id: string;
  module: 'labour' | 'food' | 'machinery' | 'salary' | 'transport' | 'materials' | 'money_in' | 'transfer';
  date: string;
  amount: number | null;
  title: string;
  subtitle: string;
  icon: string;
}

export async function getActivityFeed(
  limit = 50,
  filters?: { module?: string; search?: string; dateFrom?: string; dateTo?: string }
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const items: ActivityItem[] = [];

  // Fetch labour records
  const labourQuery = supabase
    .from('labour_records')
    .select('id, date, amount, comments, worker:parties!labour_records_worker_id_fkey(name), work_type:work_types(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) labourQuery.gte('date', filters.dateFrom);
  if (filters?.dateTo) labourQuery.lte('date', filters.dateTo);

  // Fetch food records
  const foodQuery = supabase
    .from('food_records')
    .select('id, start_date, amount, comments, food_category:food_categories(name), shop:parties!food_records_shop_id_fkey(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('start_date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) foodQuery.gte('start_date', filters.dateFrom);
  if (filters?.dateTo) foodQuery.lte('start_date', filters.dateTo);

  // Fetch machinery records
  const machineryQuery = supabase
    .from('machinery_records')
    .select('id, date, amount, hours, comments, machine:machinery(machine_id, machine_type)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) machineryQuery.gte('date', filters.dateFrom);
  if (filters?.dateTo) machineryQuery.lte('date', filters.dateTo);

  // Fetch salary records
  const salaryQuery = supabase
    .from('salary_records')
    .select('id, payment_date, amount, comments, employee:parties!salary_records_employee_id_fkey(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('payment_date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) salaryQuery.gte('payment_date', filters.dateFrom);
  if (filters?.dateTo) salaryQuery.lte('payment_date', filters.dateTo);

  // Fetch material deliveries
  const materialQuery = supabase
    .from('material_deliveries')
    .select('id, date, material_cost, quantity, unit, comments, material:materials(name), supplier:parties!material_deliveries_supplier_id_fkey(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) materialQuery.gte('date', filters.dateFrom);
  if (filters?.dateTo) materialQuery.lte('date', filters.dateTo);

  // Fetch money-in and transfer transactions
  const moneyQuery = supabase
    .from('transactions')
    .select('id, date, amount, type, description, party:parties(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .in('type', ['money_in', 'transfer'])
    .order('date', { ascending: false })
    .limit(filters?.search ? 1000 : limit);

  if (filters?.dateFrom) moneyQuery.gte('date', filters.dateFrom);
  if (filters?.dateTo) moneyQuery.lte('date', filters.dateTo);

  // Execute all in parallel
  const [labourRes, foodRes, machineryRes, salaryRes, materialRes, moneyRes] = await Promise.all([
    labourQuery,
    foodQuery,
    machineryQuery,
    salaryQuery,
    materialQuery,
    moneyQuery,
  ]);

  // Map labour
  for (const r of labourRes.data || []) {
    const workerName = (r.worker as any)?.name || 'Worker';
    const workType = (r.work_type as any)?.name || '';
    if (filters?.search && !workerName.toLowerCase().includes(filters.search.toLowerCase()) && !workType.toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: 'labour',
      date: r.date,
      amount: r.amount,
      title: workerName,
      subtitle: workType || 'Labour',
      icon: '👷',
    });
  }

  // Map food
  for (const r of foodRes.data || []) {
    const category = (r.food_category as any)?.name || 'Food';
    const shop = (r.shop as any)?.name || '';
    if (filters?.search && !category.toLowerCase().includes(filters.search.toLowerCase()) && !shop.toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: 'food',
      date: r.start_date,
      amount: r.amount,
      title: category,
      subtitle: shop || 'Food & Groceries',
      icon: '🍚',
    });
  }

  // Map machinery
  for (const r of machineryRes.data || []) {
    const machine = r.machine as any;
    const name = machine?.machine_id || 'Machine';
    const type = machine?.machine_type || '';
    if (filters?.search && !name.toLowerCase().includes(filters.search.toLowerCase()) && !type.toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: 'machinery',
      date: r.date,
      amount: r.amount,
      title: name,
      subtitle: r.hours ? `${r.hours}h — ${type}` : type || 'Machinery',
      icon: '🚜',
    });
  }

  // Map salary
  for (const r of salaryRes.data || []) {
    const empName = (r.employee as any)?.name || 'Employee';
    if (filters?.search && !empName.toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: 'salary',
      date: r.payment_date,
      amount: r.amount,
      title: empName,
      subtitle: 'Salary',
      icon: '💰',
    });
  }

  // Map materials
  for (const r of materialRes.data || []) {
    const matName = (r.material as any)?.name || 'Material';
    const supplier = (r.supplier as any)?.name || '';
    const qtyStr = r.quantity ? `${r.quantity} ${r.unit || ''}` : '';
    if (filters?.search && !matName.toLowerCase().includes(filters.search.toLowerCase()) && !supplier.toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: 'materials',
      date: r.date,
      amount: r.material_cost,
      title: matName,
      subtitle: [qtyStr, supplier].filter(Boolean).join(' — ') || 'Material Delivery',
      icon: '🧱',
    });
  }

  // Map money-in / transfer
  for (const r of moneyRes.data || []) {
    const partyName = (r.party as any)?.name || '';
    const isTransfer = r.type === 'transfer';
    if (filters?.search && !partyName.toLowerCase().includes(filters.search.toLowerCase()) && !(r.description || '').toLowerCase().includes(filters.search.toLowerCase())) continue;
    items.push({
      id: r.id,
      module: isTransfer ? 'transfer' : 'money_in',
      date: r.date,
      amount: r.amount,
      title: isTransfer ? 'Transfer' : 'Money In',
      subtitle: r.description || partyName || '',
      icon: isTransfer ? '↔️' : '💵',
    });
  }

  // Filter by module if specified
  const filtered = filters?.module
    ? items.filter(i => i.module === filters.module)
    : items;

  // Sort by date descending
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  return filtered.slice(0, limit);
}

export async function deleteRecord(tableName: string, id: string) {
  const supabase = await createClient();

  // If this is a transaction, just delete it directly
  if (tableName === 'transactions') {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error('Failed to delete transaction');
    revalidatePath('/');
    return;
  }

  // For material_deliveries, cascade-delete linked transport and weighbridge records first
  if (tableName === 'material_deliveries') {
    // Clean up transport_records and their transactions
    const { data: transportRecords } = await supabase
      .from('transport_records')
      .select('id')
      .eq('delivery_id', id);

    if (transportRecords && transportRecords.length > 0) {
      for (const tr of transportRecords) {
        await supabase.from('transactions').delete()
          .eq('reference_table', 'transport_records')
          .eq('reference_id', tr.id);
      }
      await supabase.from('transport_records').delete().eq('delivery_id', id);
    }

    // Clean up weighbridge_records and their transactions
    const { data: weighbridgeRecords } = await supabase
      .from('weighbridge_records')
      .select('id')
      .eq('delivery_id', id);

    if (weighbridgeRecords && weighbridgeRecords.length > 0) {
      for (const wb of weighbridgeRecords) {
        await supabase.from('transactions').delete()
          .eq('reference_table', 'weighbridge_records')
          .eq('reference_id', wb.id);
      }
      await supabase.from('weighbridge_records').delete().eq('delivery_id', id);
    }
  }

  // Delete the operational record
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw new Error(`Failed to delete from ${tableName}`);

  // Also delete the associated transaction if one exists
  const { error: txnError } = await supabase
    .from('transactions')
    .delete()
    .eq('reference_table', tableName)
    .eq('reference_id', id);
  
  if (txnError) {
    console.error('Failed to clean up transaction', txnError);
  }

  revalidatePath('/');
  revalidatePath(`/${tableName.split('_')[0]}`);
}
