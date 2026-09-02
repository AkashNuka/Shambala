'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { MaterialDelivery, TransportTrip, WeighbridgeRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { postVoucher, getLedgerId } from './accounting';

export async function createMaterialDelivery(
  delivery: Partial<MaterialDelivery>,
  transport?: Partial<TransportTrip> & { account_id?: string },
  weighbridge?: Partial<WeighbridgeRecord> & { account_id?: string },
  account_id?: string
) {
  const supabase = await createClient();

  // Insert delivery
  const { data: deliveryData, error: deliveryError } = await supabase
    .from('material_deliveries')
    .insert({
      project_id: DEFAULT_PROJECT_ID,
      material_id: delivery.material_id,
      variant_id: delivery.variant_id || null,
      supplier_id: delivery.supplier_id || null,
      building_id: delivery.building_id || null,
      date: delivery.date,
      time: delivery.time || null,
      quantity: delivery.quantity || null,
      unit: delivery.unit || null,
      material_cost: delivery.material_cost || null,
      comments: delivery.comments || null,
    })
    .select('id')
    .single();

  if (deliveryError) {
    console.error('Failed to create delivery:', deliveryError);
    throw new Error('Failed to save material delivery');
  }

  const deliveryId = deliveryData.id;

  // Insert transport if provided
  if (transport && (transport.transport_type || transport.amount)) {
    await supabase.from('transport_trips').insert({
      project_id: DEFAULT_PROJECT_ID,
      delivery_id: deliveryId,
      vehicle_id: transport.vehicle_id || null,
      transport_type: transport.transport_type || null,
      source_location: transport.source_location || null,
      amount: transport.amount || null,
    });
  }

  // Insert weighbridge if provided
  if (weighbridge && (weighbridge.gross_weight || weighbridge.fee)) {
    await supabase.from('weighbridge_records').insert({
      delivery_id: deliveryId,
      weighbridge_id: weighbridge.weighbridge_id || null,
      gross_weight: weighbridge.gross_weight || null,
      tare_weight: weighbridge.tare_weight || null,
      fee: weighbridge.fee || null,
    });
  }

  // Transactions
  if (delivery.material_cost && delivery.material_cost > 0) {
    const materialInventoryLedgerId = await getLedgerId('Material Inventory');
    const supplierPayableLedgerId = await getLedgerId('Supplier Payable');

    // Accrue Material Purchase
    await postVoucher({
      voucher_no: `JV-MAT-${Date.now()}`,
      type: 'Purchase',
      date: delivery.date || new Date().toISOString().split('T')[0],
      narration: `Material purchase on ${delivery.date}`,
      reference_table: 'material_deliveries',
      reference_id: deliveryId,
      lines: [
        {
          ledger_id: materialInventoryLedgerId, // Debit Inventory
          debit: delivery.material_cost,
          cost_center_id: delivery.building_id || null,
        },
        {
          ledger_id: supplierPayableLedgerId, // Credit Payable
          credit: delivery.material_cost,
          party_id: delivery.supplier_id || null,
        }
      ]
    });

    // Immediate Payment (if account_id is provided, meaning it was paid immediately)
    if (account_id) {
      await postVoucher({
        voucher_no: `PV-MAT-${Date.now()}`,
        type: 'Payment',
        date: delivery.date || new Date().toISOString().split('T')[0],
        narration: `Payment for material on ${delivery.date}`,
        reference_table: 'material_deliveries',
        reference_id: deliveryId,
        lines: [
          {
            ledger_id: supplierPayableLedgerId, // Debit Payable
            debit: delivery.material_cost,
            party_id: delivery.supplier_id || null,
          },
          {
            ledger_id: account_id, // Credit Cash/Bank
            credit: delivery.material_cost,
          }
        ]
      });
    }
  }

  if (transport && transport.amount && transport.amount > 0) {
    const transportExpenseLedgerId = await getLedgerId('Transport Expense');
    const paymentAccountId = transport.account_id || account_id;
    
    // If not paid immediately, we should ideally accrue to a payable, but for simplicity
    // we'll require an account or default to cash. Or we can just use Supplier Payable.
    const creditLedgerId = paymentAccountId || await getLedgerId('Supplier Payable');

    await postVoucher({
      voucher_no: `EV-TRN-${Date.now()}`,
      type: paymentAccountId ? 'Payment' : 'Journal',
      date: delivery.date || new Date().toISOString().split('T')[0],
      narration: `Transport expense for material on ${delivery.date}`,
      reference_table: 'transport_trips',
      reference_id: deliveryId, // Technically transport trip ID, but this maps it
      lines: [
        {
          ledger_id: transportExpenseLedgerId,
          debit: transport.amount,
          cost_center_id: delivery.building_id || null,
        },
        {
          ledger_id: creditLedgerId,
          credit: transport.amount,
        }
      ]
    });
  }

  if (weighbridge && weighbridge.fee && weighbridge.fee > 0) {
    const expenseLedgerId = await getLedgerId('Transport Expense'); // Or 'Misc Expense'
    const paymentAccountId = weighbridge.account_id || account_id;
    const creditLedgerId = paymentAccountId || await getLedgerId('Supplier Payable');

    await postVoucher({
      voucher_no: `EV-WB-${Date.now()}`,
      type: paymentAccountId ? 'Payment' : 'Journal',
      date: delivery.date || new Date().toISOString().split('T')[0],
      narration: `Weighbridge fee for material on ${delivery.date}`,
      reference_table: 'weighbridge_records',
      reference_id: deliveryId,
      lines: [
        {
          ledger_id: expenseLedgerId,
          debit: weighbridge.fee,
          cost_center_id: delivery.building_id || null,
        },
        {
          ledger_id: creditLedgerId,
          credit: weighbridge.fee,
        }
      ]
    });
  }

  revalidatePath('/');
  revalidatePath('/materials');
}

export async function getMaterialDeliveries(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('material_deliveries')
    .select(`
      *,
      material:materials(name),
      variant:material_variants(name),
      supplier:parties!material_deliveries_supplier_id_fkey(name),
      building:buildings(display_name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load material deliveries');
  return data;
}

export async function getMaterials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  if (error) throw new Error('Failed to fetch materials');
  return data;
}

export async function getMaterialVariants(materialId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('material_variants')
    .select('*')
    .eq('material_id', materialId);
  if (error) throw new Error('Failed to fetch material variants');
  return data;
}
