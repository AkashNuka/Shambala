'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { LabourRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { postVoucher, getLedgerId } from './accounting';

export async function createLabourRecord(data: Partial<LabourRecord> & { account_id?: string }) {
  const supabase = await createClient();

  const { data: record, error } = await supabase.from('labour_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    worker_id: data.worker_id,
    worker_type_id: data.worker_type_id,
    work_type_id: data.work_type_id,
    building_id: data.building_id,
    date: data.date,
    time: data.time || null,
    amount: data.amount || null,
    cash_provider_id: data.cash_provider_id || null,
    payment_method: data.payment_method || 'cash',
    comments: data.comments || null,
  }).select('id').single();

  if (error) {
    console.error('Failed to create labour record:', error);
    throw new Error('Failed to save labour record');
  }

  // Always post a Journal Voucher to accrue the expense and liability
  if (data.amount && data.amount > 0) {
    const labourExpenseLedgerId = await getLedgerId('Labour Expense');
    const workerPayableLedgerId = await getLedgerId('Worker Payable');

    // 1. Accrual Journal
    await postVoucher({
      voucher_no: `JV-LAB-${Date.now()}`,
      type: 'Journal',
      date: data.date || new Date().toISOString().split('T')[0],
      narration: `Labour work on ${data.date}`,
      reference_table: 'labour_records',
      reference_id: record.id,
      lines: [
        {
          ledger_id: labourExpenseLedgerId, // Debit Expense
          debit: data.amount,
          cost_center_id: data.building_id || null,
        },
        {
          ledger_id: workerPayableLedgerId, // Credit Liability
          credit: data.amount,
          party_id: data.worker_id,
        }
      ]
    });

    // 2. Immediate Payment (if paid)
    if (data.payment_method !== ('credit' as any) && data.account_id) {
      await postVoucher({
        voucher_no: `PV-LAB-${Date.now()}`,
        type: 'Payment',
        date: data.date || new Date().toISOString().split('T')[0],
        narration: `Payment for labour work on ${data.date}`,
        reference_table: 'labour_records',
        reference_id: record.id,
        lines: [
          {
            ledger_id: workerPayableLedgerId, // Debit Liability
            debit: data.amount,
            party_id: data.worker_id,
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
  revalidatePath('/labour');
}

export async function getLabourRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('labour_records')
    .select(`
      *,
      worker:parties!labour_records_worker_id_fkey(name),
      worker_type:worker_types(name),
      work_type:work_types(name),
      building:buildings(display_name),
      cash_provider:parties!labour_records_cash_provider_id_fkey(name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load labour records');
  return data;
}
