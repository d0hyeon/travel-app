import { useSuspenseQuery } from '@tanstack/react-query'
import { supabase } from '~api/client'
import { photoKey, toPhoto } from '~features/photo/photo.api'
import type { Photo } from '~features/photo/photo.types'

async function fetchUserPhotos(userId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*, trips!inner(user_id)')
    .eq('trips.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toPhoto)
}

export function useUserPhotos(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserPhotos.key(userId),
    queryFn: () => fetchUserPhotos(userId),
  })
}

useUserPhotos.key = (userId: string) => [photoKey, 'by-user', userId]
