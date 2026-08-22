import { supabase } from '@waylog/domains/clients'
import { toPhoto, type Photo } from '@waylog/domains/modules/photo'
import { toTrip, type Trip } from '@waylog/domains/modules/trip'
import { getFeed } from '@waylog/domains/modules/post'

export async function getUserTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase.rpc('get_user_trips', { p_user_id: userId })

  if (error) throw error
  return (data ?? []).map(toTrip)
}

export async function getUserPhotos(userId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toPhoto)
}

export interface UserPostPhoto {
  postId: string
  url: string
}

export async function getUserPostPhotos(userId: string): Promise<UserPostPhoto[]> {
  const posts = await getFeed()

  return posts
    .filter((post) => post.authorId === userId)
    .flatMap((post) => {
      const [coverPhoto] = post.photos
      return coverPhoto == null ? [] : [{ postId: post.id, url: coverPhoto.url }]
    })
}
