import { useSuspenseQuery } from '@tanstack/react-query'
import { supabase } from '@waylog/domains/clients'
import { photoKey, toPhoto } from '~features/photo/photo.api'

export function useUserPhotos(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserPhotos.key(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map(toPhoto)
    },
  })
}

useUserPhotos.key = (userId: string) => [photoKey, 'by-user', userId]
