import { supabase } from "@waylog/domains/api";
import type { DataRaw } from "@waylog/domains/api";
import type { Post } from "~features/post/post.types";


export async function getFeedByPlace(placeId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      description,
      created_at,
      updated_at,
      visibility,
      author_id,
      trip_id,

      post_locations!inner (
        place_id,
        display_order,
        
        place:places (
          id,
          name,
          address,
          lat,
          lng
        )
      ),

      post_photos (
        display_order,
        is_public,
        place_id,
        url,
        storage_path
      )
    `)
    .eq('post_locations.place_id', placeId)
    .eq('visibility', 'PUBLIC')
    .order('created_at', { ascending: false })

  if (error) {
    throw error;
  }

  return data.map((row) => {
    return {
      ...row,
      tripId: row.trip_id,
      authorId: row.author_id,
      photos: row.post_photos.map(photo => ({
        url: photo.url,
        storagePath: photo.storage_path,
        placeId: photo.place_id,
        isPublic: photo.is_public
      })),
      places: row.post_locations.map(location => ({
        placeId: location.place_id,
        name: location.place.name,
        lat: location.place.lat,
        lng: location.place.lng,
        address: location.place.address
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }) satisfies Post[];
}