import type { DataRaw } from '~api/tables.types';
import { supabase } from '~api/client'
import type { Photo, PhotoUploadParams } from './photo.types'
import { heicTo, isHeic } from 'heic-to'
import Resizer from 'react-image-file-resizer';

export const photoKey = 'photos'

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

async function convertHeicToJPEG(file: File) {
  const blob = await heicTo({ blob: file, type: 'image/jpeg' });
  return new File([blob], file.name);
}
function splitExtension(value: string) {
  const [extension, ...filenames] = value.split('.').reverse();

  return [filenames.join('.'), extension] as const;
}

const ResizeQualityOption = {
  Low: { maxSize: 1600, quality: 80 },
  Medium: { maxSize: 1000, quality: 90 },
} as const;

const resizeImage = async (_file: File, quality: keyof typeof ResizeQualityOption = 'Medium') => {
  const file = (await isHeic(_file)) ? await convertHeicToJPEG(_file) : _file;
  const [fileName, fileType = 'JPEG'] = splitExtension(file.name);

  return new Promise<File>((resolve, reject) => {
    Resizer.imageFileResizer(
      file,
      ResizeQualityOption[quality].maxSize,
      ResizeQualityOption[quality].maxSize,
      'WEBP',
      ResizeQualityOption[quality].quality,
      0,
      (result) => {
        if (result instanceof File || result instanceof Blob) {
          return resolve(new File([result], `${fileName}.${fileType}`, { type: result.type }));
        }
        reject();
      },
      'file',
      200,
      200,
    );
  });
};

async function uploadToStorage(storagePath: string, file: File): Promise<string> {
  const { data, error } = await supabase.functions.invoke('storage-upload-url', {
    body: { storagePath, contentType: file.type || 'image/webp' },
  })
  if (error) throw error

  const { url, publicUrl } = data as { url: string; publicUrl: string }

  const uploadRes = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'image/webp' },
  })
  if (!uploadRes.ok) throw new Error(`Storage upload failed: ${uploadRes.status}`)

  return publicUrl
}

export async function uploadPhoto({ tripId, placeId, file: _file, isPublic }: PhotoUploadParams): Promise<Photo> {
  const file = await resizeImage(_file);
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const storagePath = `${tripId}/${placeId ?? '_'}/${fileName}`

  const publicUrl = await uploadToStorage(storagePath, file)

  const { data: { user } } = await supabase.auth.getUser()

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

export interface PostPhotoUploadResult {
  url: string
  storagePath: string
}

export async function uploadPostPhoto(tripId: string | null, file: File): Promise<PostPhotoUploadResult> {
  const resized = await resizeImage(file, 'Low');
  const fileExt = resized.name.split('.').pop()
  const scope = tripId ?? 'orphan'
  const storagePath = `posts/${scope}/${Date.now()}.${fileExt}`
  const url = await uploadToStorage(storagePath, resized)
  return { url, storagePath }
}

export async function createPhotoFileFromUrl(url: string, fileName = `${Date.now()}.jpg`): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('사진 파일을 다시 가져오지 못했어요')
  }

  const blob = await response.blob()
  const contentType = blob.type || 'image/jpeg'
  return new File([blob], fileName, { type: contentType })
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

export async function updatePhotoVisibility(photoId: string, isPublic: boolean): Promise<Photo> {
  const { data, error } = await supabase
    .from('photos')
    .update({ is_public: isPublic })
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
