// src/services/supabaseApi.ts
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export async function getProfilesFromDb(filters?: { search?: string, area?: string, city?: string }): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*');

  if (filters?.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},role_title.ilike.${q},bio.ilike.${q}`);
  }
  if (filters?.area && filters.area !== 'Todas') query = query.eq('area', filters.area);
  if (filters?.city && filters.city !== 'Todas') query = query.eq('city', filters.city);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function createProfileDb(payload: Partial<Profile>, ownerId: string) {
  const row = { ...payload, owner_id: ownerId };
  const { data, error } = await supabase.from('profiles').insert([row]).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfileDb(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function deleteProfileDb(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
  return;
}
