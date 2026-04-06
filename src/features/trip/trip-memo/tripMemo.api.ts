import { supabase } from "~api/client";
import type { TripMemo } from "./tripMemo.type";
import type { DataRaw } from "~api/tables.types";


function toData(row: DataRaw<'memos'>): TripMemo {
  return {
    id: row.id,
    tripId: row.trip_id,
    content: row.content,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
  };
}

export const path = 'memos';

export async function getMemos(tripId: string): Promise<TripMemo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(toData);
}

export interface CreateMemo {
  tripId: string;
  content: string;
}

export async function createMemo({ tripId, content }: CreateMemo): Promise<TripMemo> {
  const { data, error } = await supabase
    .from('memos')
    .insert({
      trip_id: tripId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return toData(data!);
}

export interface UpdateMemo {
  id: string;
  content?: string;
  isPinned?: boolean;
}

export async function updateMemo({ id, ...data }: UpdateMemo): Promise<TripMemo> {
  const payload: Record<string, unknown> = {};

  if (data.content !== undefined) payload.content = data.content;
  if (data.isPinned !== undefined) payload.is_pinned = data.isPinned;

  const { data: updated, error } = await supabase
    .from('memos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toData(updated!);
}

export async function removeMemo(id: string): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
