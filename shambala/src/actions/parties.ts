'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';
import type { Party } from '@/lib/types';

export async function getParties(search?: string, role?: string): Promise<Party[]> {
  const supabase = await createClient();

  let query = supabase
    .from('parties')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('is_active', true)
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Party[]) || [];
}

export async function createParty(data: Partial<Party>): Promise<Party> {
  const supabase = await createClient();

  const { data: party, error } = await supabase
    .from('parties')
    .insert({
      project_id: DEFAULT_PROJECT_ID,
      name: data.name?.trim(),
      class: data.class || 'person',
      role: data.role || 'general',
      worker_type_id: data.worker_type_id || null,
      phone: data.phone || null,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return party as Party;
}

export async function updateParty(id: string, data: Partial<Party>): Promise<Party> {
  const supabase = await createClient();

  const { data: party, error } = await supabase
    .from('parties')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return party as Party;
}

export async function getParty(id: string): Promise<Party> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Party;
}

export async function getPartyTransactions(partyId: string, dateFrom?: string, dateTo?: string) {
  const supabase = await createClient();
  
  // Get all transactions where this party is involved
  let query = supabase
    .from('transactions')
    .select('*, account:accounts(name, type)')
    .eq('party_id', partyId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo) query = query.lte('date', dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteParty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('parties')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
