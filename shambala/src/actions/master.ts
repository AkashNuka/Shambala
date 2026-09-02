'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';

export async function getBuildings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('direction')
    .order('number');
  
  if (error) throw new Error('Failed to load buildings');
  return data;
}

export async function getWorkerTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('worker_types')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('name');
  
  if (error) throw new Error('Failed to load worker types');
  return data;
}

export async function getWorkTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_types')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('name');
  
  if (error) throw new Error('Failed to load work types');
  return data;
}

export async function getTransportVehicles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transport_vehicles')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  
  if (error) throw new Error('Failed to load transport vehicles');
  return data;
}

export async function getWeighbridges() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('weighbridges')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  
  if (error) throw new Error('Failed to load weighbridges');
  return data;
}

export async function getMachinery() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('machinery')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('is_active', true);
  
  if (error) throw new Error('Failed to load machinery');
  return data;
}

export async function getFuelTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fuel_types')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  
  if (error) throw new Error('Failed to load fuel types');
  return data;
}

export async function getFoodCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('food_categories')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  
  if (error) throw new Error('Failed to load food categories');
  return data;
}
