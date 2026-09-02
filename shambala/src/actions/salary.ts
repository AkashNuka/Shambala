'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { SalaryRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { postVoucher, getLedgerId } from './accounting';

export async function createSalaryRecord(data: Partial<SalaryRecord> & { account_id?: string }) {
  const supabase = await createClient();

  const { data: record, error } = await supabase.from('salary_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    employee_id: data.employee_id,
    worker_type_id: data.worker_type_id || null,
    start_date: data.start_date,
    end_date: data.end_date,
    amount: data.amount,
    payment_date: data.payment_date,
    payment_method: data.payment_method || 'cash',
    cash_provider_id: data.cash_provider_id || null,
    comments: data.comments || null,
  }).select('id').single();

  if (error) {
    console.error('Failed to create salary record:', error);
    throw new Error('Failed to save salary record');
  }

  // Always post a Journal Voucher to accrue the salary expense
  if (data.amount && data.amount > 0) {
    const salaryExpenseLedgerId = await getLedgerId('Salary Expense');
    const workerPayableLedgerId = await getLedgerId('Worker Payable');

    // 1. Accrual Journal
    await postVoucher({
      voucher_no: `JV-SAL-${Date.now()}`,
      type: 'Journal',
      date: data.start_date || new Date().toISOString().split('T')[0],
      narration: `Salary for period ${data.start_date} to ${data.end_date}`,
      reference_table: 'salary_records',
      reference_id: record.id,
      lines: [
        {
          ledger_id: salaryExpenseLedgerId, // Debit Expense
          debit: data.amount,
        },
        {
          ledger_id: workerPayableLedgerId, // Credit Liability
          credit: data.amount,
          party_id: data.employee_id,
        }
      ]
    });

    // 2. Immediate Payment (if paid)
    if (data.payment_method !== ('credit' as any) && data.account_id) {
      await postVoucher({
        voucher_no: `PV-SAL-${Date.now()}`,
        type: 'Payment',
        date: data.payment_date || data.start_date || new Date().toISOString().split('T')[0],
        narration: `Salary payment for ${data.start_date}`,
        reference_table: 'salary_records',
        reference_id: record.id,
        lines: [
          {
            ledger_id: workerPayableLedgerId, // Debit Liability
            debit: data.amount,
            party_id: data.employee_id,
          },
          {
            ledger_id: data.account_id, // Credit Cash/Bank
            credit: data.amount,
          }
        ]
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/salary');
}

export async function getSalaryRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('salary_records')
    .select(`
      *,
      employee:parties!salary_records_employee_id_fkey(name),
      worker_type:worker_types(name),
      cash_provider:parties!salary_records_cash_provider_id_fkey(name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load salary records');
  return data;
}
