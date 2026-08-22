import { supabase } from '@waylog/domains/clients'
import type { Photo } from '@waylog/domains/modules/photo'
import { toPhoto } from '@waylog/domains/modules/photo'
import * as ImageManipulator from 'expo-image-manipulator'

export * from '@waylog/domains/modules/photo'

// 웹은 File + canvas 로 줄이지만 RN 에는 둘 다 없다.
// 로컬 uri 를 받아 같은 크기로 줄인 뒤 같은 스토리지 흐름을 탄다.
export interface AppPhotoUploadParams {
  tripId: string
  placeId?: string
  uri: string
  isPublic: boolean
}

const MAX_SIZE = 1280

async function resize(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: MAX_SIZE } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  })

  return result.uri
}

async function uploadToStorage(storagePath: string, uri: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('storage-upload-url', {
    body: { storagePath, contentType: 'image/jpeg' },
  })
  if (error) throw error

  const { url, publicUrl } = data as { url: string; publicUrl: string }

  // RN 의 fetch 는 로컬 uri 를 blob 으로 읽을 수 있다.
  const blob = await (await fetch(uri)).blob()

  const uploadRes = await fetch(url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  })
  if (!uploadRes.ok) throw new Error(`Storage upload failed: ${uploadRes.status}`)

  return publicUrl
}

export async function uploadPhoto({
  tripId,
  placeId,
  uri,
  isPublic,
}: AppPhotoUploadParams): Promise<Photo> {
  const resized = await resize(uri)
  const storagePath = `${tripId}/${placeId ?? '_'}/${Date.now()}.jpg`

  const publicUrl = await uploadToStorage(storagePath, resized)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error: insertError } = await supabase
    .from('photos')
    .insert({
      user_id: user!.id,
      trip_id: tripId,
      place_id: placeId ?? null,
      is_public: isPublic,
      url: publicUrl,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (insertError) throw insertError
  return toPhoto(created!)
}
