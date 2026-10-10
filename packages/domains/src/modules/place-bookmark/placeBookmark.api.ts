import { assert } from '@waylog/utility'
import { getSession } from '../../gateways/auth'
import { supabase } from '../../gateways/client'
import { toPlace, type Place } from '../place'

export const placeBookmarkKey = 'place-bookmarks'

const UNIQUE_VIOLATION = '23505'

function getBookmarkerId() {
  const bookmarker = getSession()
  assert(bookmarker != null, '인증 정보가 만료되었습니다.')
  return bookmarker.id
}

export async function addPlaceBookmark(placeId: string) {
  const bookmarkerId = getBookmarkerId()
  const { error } = await supabase
    .from('place_bookmarks')
    .insert({ user_id: bookmarkerId, place_id: placeId })

  const isAlreadyBookmarked = error?.code === UNIQUE_VIOLATION
  if (error != null && !isAlreadyBookmarked) throw error
}

export async function removePlaceBookmark(placeId: string) {
  const bookmarkerId = getBookmarkerId()
  const { error } = await supabase
    .from('place_bookmarks')
    .delete()
    .eq('user_id', bookmarkerId)
    .eq('place_id', placeId)

  if (error) throw error
}

export async function getBookmarkedPlaces(): Promise<Place[]> {
  if (getSession() == null) return []

  const { data: bookmarks, error } = await supabase
    .from('place_bookmarks')
    .select('places(*)')
    .order('created_at', { ascending: false })
  if (error) throw error

  return (bookmarks ?? []).map((bookmark) => toPlace(bookmark.places))
}
