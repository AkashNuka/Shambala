'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { MachineryRecord, FuelRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { postVoucher, getLedgerId } from './accounting';

export async function createMachineryRecord(
  data: Partial<MachineryRecord> & { account_id?: string },
  fuelData?: Partial<FuelRecord> & { account_id?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase.from('machinery_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    machine_id: data.machine_id,
    operator_id: data.operator_id || null,
    building_id: data.building_id || null,
    date: data.date,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    hours: data.hours || null,
    amount: data.amount || null,
    charging_type: data.charging_type || null,
    comments: data.comments || null,
  });

  if (error) throw new Error('Failed to save machinery record');

  if (fuelData) {
    const { error: fuelError } = await supabase.from('fuel_records').insert({
      project_id: DEFAULT_PROJECT_ID,
      machine_id: data.machine_id,
      building_id: data.building_id || null,
      fuel_type: fuelData.fuel_type,
      quantity: fuelData.quantity,
      unit: fuelData.unit || 'Liters',
      rate: fuelData.rate || null,
      amount: fuelData.amount || null,
      previous_meter: fuelData.previous_meter || null,
      current_meter: fuelData.current_meter || null,
      date: data.date,
      provider_id: fuelData.provider_id || null,
      comments: fuelData.comments || null,
    });
    if (fuelError) console.error('Failed to save fuel record', fuelError);

    if (fuelData.amount && fuelData.amount > 0) {
      const fuelExpenseLedgerId = await getLedgerId('Machine Fuel Expense');
      const supplierPayableLedgerId = await getLedgerId('Supplier Payable');
      
      await postVoucher({
        voucher_no: `JV-FUEL-${Date.now()}`,
        type: 'Journal',
        date: data.date || new Date().toISOString().split('T')[0],
        narration: `Fuel expense on ${data.date}`,
        reference_table: 'fuel_records',
        lines: [
          { ledger_id: fuelExpenseLedgerId, debit: fuelData.amount, cost_center_id: data.building_id || null },
          { ledger_id: supplierPayableLedgerId, credit: fuelData.amount, party_id: fuelData.provider_id || null }
        ]
      });

      const fuelAccountId = fuelData.account_id || data.account_id;
      if (fuelAccountId) {
        await postVoucher({
          voucher_no: `PV-FUEL-${Date.now()}`,
          type: 'Payment',
          date: data.date || new Date().toISOString().split('T')[0],
          narration: `Fuel payment on ${data.date}`,
          reference_table: 'fuel_records',
          lines: [
            { ledger_id: supplierPayableLedgerId, debit: fuelData.amount, party_id: fuelData.provider_id || null },
            { ledger_id: fuelAccountId, credit: fuelData.amount }
          ]
        });
      }
    }
  }

  if (data.amount && data.amount > 0) {
    const machineryExpenseLedgerId = await getLedgerId('Labour Expense'); // Assuming operator is labour
    const payableLedgerId = await getLedgerId('Worker Payable');

    await postVoucher({
      voucher_no: `JV-MAC-${Date.now()}`,
      type: 'Journal',
      date: data.date || new Date().toISOString().split('T')[0],
      narration: `Machinery expense for ${data.date}`,
      reference_table: 'machinery_records',
      lines: [
        { ledger_id: machineryExpenseLedgerId, debit: data.amount, cost_center_id: data.building_id || null },
        { ledger_id: payableLedgerId, credit: data.amount, party_id: data.operator_id || null }
      ]
    });

    if (data.account_id) {
      await postVoucher({
        voucher_no: `PV-MAC-${Date.now()}`,
        type: 'Payment',
        date: data.date || new Date().toISOString().split('T')[0],
        narration: `Machinery payment for ${data.date}`,
        reference_table: 'machinery_records',
        lines: [
          { ledger_id: payableLedgerId, debit: data.amount, party_id: data.operator_id || null },
          { ledger_id: data.account_id, credit: data.amount }
        ]
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/machinery');
}

export async function createFuelRecord(data: Partial<FuelRecord> & { account_id?: string }) {
  const supabase = await createClient();

  const { error } = await supabase.from('fuel_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    machine_id: data.machine_id,
    building_id: data.building_id || null,
    fuel_type: data.fuel_type,
    quantity: data.quantity,
    unit: data.unit || 'Litres',
    rate: data.rate || null,
    amount: data.amount || null,
    previous_meter: data.previous_meter || null,
    current_meter: data.current_meter || null,
    date: data.date,
    provider_id: data.provider_id || null,
    comments: data.comments || null,
  });

  if (error) throw new Error('Failed to save fuel record');

  if (data.amount && data.amount > 0) {
    const fuelExpenseLedgerId = await getLedgerId('Machine Fuel Expense');
    const supplierPayableLedgerId = await getLedgerId('Supplier Payable');

    await postVoucher({
      voucher_no: `JV-FUEL-${Date.now()}`,
      type: 'Journal',
      date: data.date || new Date().toISOString().split('T')[0],
      narration: `Fuel expense on ${data.date}`,
      reference_table: 'fuel_records',
      lines: [
        { ledger_id: fuelExpenseLedgerId, debit: data.amount, cost_center_id: data.building_id || null },
        { ledger_id: supplierPayableLedgerId, credit: data.amount, party_id: data.provider_id || null }
      ]
    });

    if (data.account_id) {
      await postVoucher({
        voucher_no: `PV-FUEL-${Date.now()}`,
        type: 'Payment',
        date: data.date || new Date().toISOString().split('T')[0],
        narration: `Fuel payment on ${data.date}`,
        reference_table: 'fuel_records',
        lines: [
          { ledger_id: supplierPayableLedgerId, debit: data.amount, party_id: data.provider_id || null },
          { ledger_id: data.account_id, credit: data.amount }
        ]
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/machinery');
}

export async function getMachineryRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('machinery_records')
    .select(`
      *,
      machine:machinery(machine_id, machine_type),
      operator:parties!machinery_records_operator_id_fkey(name),
      building:buildings(display_name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load machinery records');
  return data;
}
