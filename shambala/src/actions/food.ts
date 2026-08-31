'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { FoodRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createFoodRecord(data: Partial<FoodRecord>) {
  const supabase = await createClient();

  const { error } = await supabase.from('food_records').insert({
    project_id: DEFAULT_PROJECT_ID,
    worker_id: data.worker_id || null,
    worker_type_id: data.worker_type_id || null,
    food_category_id: data.food_category_id,
    start_date: data.start_date,
    end_date: data.end_date,
    quantity: data.quantity || null,
    unit: data.unit || null,
    amount: data.amount || null,
    shop_id: data.shop_id || null,
    comments: data.comments || null,
  });

  if (error) throw new Error('Failed to save food record');

  // If there is an amount, we optionally create a transaction if it was paid immediately.
  // For now, keeping it simple as per ERP requirements.

  revalidatePath('/');
  revalidatePath('/food');
}

export async function getFoodRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('food_records')
    .select(`
      *,
      worker:parties!food_records_worker_id_fkey(name),
      worker_type:worker_types(name),
      food_category:food_categories(name),
      shop:parties!food_records_shop_id_fkey(name)
    `)
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load food records');
  return data;
}

export async function getFoodCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('food_categories')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID);
  if (error) throw new Error('Failed to fetch food categories');
  return data;
}
