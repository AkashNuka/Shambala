'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID, DEFAULT_CASH_ACCOUNT_ID } from '@/lib/constants';
import { postVoucher, getLedgerId } from './accounting';

export async function createStandaloneTransportRecord(data: any & { account_id?: string }) {
  const supabase = await createClient();

  const { data: record, error } = await supabase
    .from('transport_trips')
    .insert({
      project_id: DEFAULT_PROJECT_ID,
      vehicle_id: data.vehicle_id || null,
      transport_type: data.transport_type || null,
      source_location: data.source_location || null,
      amount: data.amount,
      date: data.date,
      payment_method: data.payment_method,
      status: data.status || 'completed'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Accounting for standalone transport
  if (data.amount && data.amount > 0) {
    const transportExpenseLedgerId = await getLedgerId('Transport Expense');
    const payableLedgerId = await getLedgerId('Supplier Payable');

    // Accrual Journal
    await postVoucher({
      voucher_no: `JV-TRN-${Date.now()}`,
      type: 'Journal',
      date: data.date,
      narration: `Standalone transport expense`,
      reference_table: 'transport_trips',
      reference_id: record.id,
      lines: [
        {
          ledger_id: transportExpenseLedgerId, // Debit Expense
          debit: data.amount,
        },
        {
          ledger_id: payableLedgerId, // Credit Liability
          credit: data.amount,
        }
      ]
    });

    // Immediate Payment (if paid)
    if (data.payment_method !== 'credit' && data.account_id) {
      await postVoucher({
        voucher_no: `PV-TRN-${Date.now()}`,
        type: 'Payment',
        date: data.date,
        narration: `Payment for standalone transport`,
        reference_table: 'transport_trips',
        reference_id: record.id,
        lines: [
          {
            ledger_id: payableLedgerId, // Debit Liability
            debit: data.amount,
          },
          {
            ledger_id: data.account_id, // Credit Cash/Bank
            credit: data.amount,
          }
        ]
      });
    }
  }

  return record;
}
