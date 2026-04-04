import { supabase } from "~app/lib/supabase"
import type { MutableTripChecklist, TripChecklist } from "./tripChecklist.type"

type RawData = {
  id: string;
  trip_id: string;
  title: string;
  content: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  is_completed: boolean;
  member_id: string | null;
}
function toData(row: RawData): TripChecklist {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    content: row.content ?? undefined,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    isCompleted: row.is_completed,
    memberId: row.member_id ?? undefined
  }
}

export const path = 'checklist'

export async function getChecklist(tripId: string): Promise<TripChecklist[]> {
  const { data, error } = await supabase
    .from('checklist')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  

  if (error) throw error;
  return data.map(toData)
}


export type CreateChecklist = Omit<MutableTripChecklist, 'isCompleted'> & {
  tripId: string;
}

export async function createChecklist(data: CreateChecklist) {
  const { data: created, error } = await supabase
      .from('checklist')
      .insert({
        trip_id: data.tripId,
        title: data.title,
        content: data.content ?? null,
        started_at: data.startedAt ?? null,
        ended_at: data.endedAt ?? null,
        member_id: data.memberId ?? null
      })
      .select()
      .single()
  
    if (error) throw error
    return toData(created!)
}

export type UpdateChecklist = Partial<MutableTripChecklist> & {
  id: string;
}

export async function updateChecklist({ id, ...data }: UpdateChecklist) {
  const payload = {} as any;
  
  if (data.startedAt !== undefined) payload.started_at = data.startedAt;
  if (data.endedAt !== undefined) payload.ended_at = data.endedAt;
  if (data.title !== undefined) payload.title = data.title;
  if (data.content !== undefined) payload.content = data.content;
  if (data.isCompleted !== undefined) payload.is_completed = data.isCompleted;
  if(data.memberId !== undefined) payload.member_id = data.memberId;
  
  const { data: updated, error } = await supabase
    .from('checklist')
    .update(payload as never)
    .eq('id', id)
    .select()
    .single()
  
    if (error) throw error
    return toData(updated!)
}

export async function removeChecklist(id: string) {
  const { error } = await supabase
    .from('checklist')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}