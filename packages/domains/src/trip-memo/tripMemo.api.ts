import { supabase } from "../client";
import type { TripMemo } from "./tripMemo.type";
import type { DataRaw, UpdateDataType } from "../client";


function toData(row: DataRaw<'memos'>): TripMemo {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title ?? null,
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
  title?: string | null;
  content: string;
}

export async function createMemo({ tripId, title, content }: CreateMemo): Promise<TripMemo> {
  const { data, error } = await supabase
    .from('memos')
    .insert({
      trip_id: tripId,
      title: title ?? null,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return toData(data!);
}

export interface UpdateMemo {
  id: string;
  title?: string | null;
  content?: string;
  isPinned?: boolean;
}

export async function updateMemo({ id, ...data }: UpdateMemo): Promise<TripMemo> {
  const payload: UpdateDataType<'memos'> = {}

  if (data.title !== undefined) payload.title = data.title;
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
