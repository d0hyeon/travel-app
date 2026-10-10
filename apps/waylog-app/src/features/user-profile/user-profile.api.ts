import { supabase } from '@waylog/domains/clients'
import { toPhoto, type Photo } from '@waylog/domains/modules/photo'
import { getUserPosts } from '@waylog/domains/modules/post'

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
  const posts = await getUserPosts(userId)

  return posts.flatMap((post) => {
    const [coverPhoto] = post.photos
    return coverPhoto == null ? [] : [{ postId: post.id, url: coverPhoto.url }]
  })
}
