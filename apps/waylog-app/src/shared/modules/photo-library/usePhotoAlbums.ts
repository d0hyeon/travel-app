import { useSuspenseQuery } from '@tanstack/react-query'
import { Album } from 'expo-media-library'

export interface PhotoAlbum {
  id: string
  title: string
  album: Album
}

export function usePhotoAlbums(permissionVersion: number) {
  return useSuspenseQuery({
    queryKey: ['photo-library', 'albums', permissionVersion],
    queryFn: async (): Promise<PhotoAlbum[]> => {
      const albums = await Album.getAll()
      return Promise.all(albums.map(async (album) => ({ id: album.id, title: await album.getTitle(), album })))
    },
  })
}
