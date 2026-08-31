'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { MachineryRecord, FuelRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createMachineryRecord(data: Partial<MachineryRecord>, fuelData?: Partial<FuelRecord>) {
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
  }

  revalidatePath('/');
  revalidatePath('/machinery');
}

export async function createFuelRecord(data: Partial<FuelRecord>) {
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

export async function getMachinery() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('machinery')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('is_active', true);
  if (error) throw new Error('Failed to fetch machinery');
  return data;
}
