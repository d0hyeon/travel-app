import { supabase } from '../api'
import type { DataRaw } from '../api'
import type { Photo } from './photo.types'

export const photoKey = 'photos'

export interface PhotoUpdate {
  isPublic?: boolean
  placeId?: string | null
}

export function toPhoto(row: DataRaw<'photos'>): Photo {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    placeId: row.place_id,
    isPublic: row.is_public,
    url: row.url,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }
}

export async function getPhotosByTripId(tripId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toPhoto)
}

export async function getPhotosByPlaceId(placeId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toPhoto)
}

export async function deletePhoto(photo: Photo): Promise<boolean> {
  const { error: fnError } = await supabase.functions.invoke('storage-delete', {
    body: { storagePaths: [photo.storagePath] },
  })
  if (fnError) throw fnError

  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo.id)

  if (dbError) throw dbError
  return true
}

export async function updatePhoto(photoId: string, patch: PhotoUpdate): Promise<Photo> {
  const update: { is_public?: boolean; place_id?: string | null } = {}
  if (patch.isPublic !== undefined) update.is_public = patch.isPublic
  if (patch.placeId !== undefined) update.place_id = patch.placeId

  const { data, error } = await supabase
    .from('photos')
    .update(update)
    .eq('id', photoId)
    .select()
    .single()

  if (error) throw error
  return toPhoto(data)
}

export async function deletePhotosByTripId(tripId: string): Promise<void> {
  const photos = await getPhotosByTripId(tripId)

  if (photos.length > 0) {
    const storagePaths = photos.map(p => p.storagePath)
    await supabase.functions.invoke('storage-delete', { body: { storagePaths } })
  }
}
