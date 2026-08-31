'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { MaterialDelivery, TransportRecord, WeighbridgeRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createMaterialDelivery(
  delivery: Partial<MaterialDelivery>,
  transport?: Partial<TransportRecord>,
  weighbridge?: Partial<WeighbridgeRecord>
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
    await supabase.from('transport_records').insert({
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
