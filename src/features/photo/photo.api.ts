import type { DataRaw } from '~api/tables.types';
import { supabase } from '~api/client'
import type { Photo, PhotoUploadParams } from './photo.types'
import { heicTo, isHeic } from 'heic-to'
import Resizer from 'react-image-file-resizer';

export const photoKey = 'photos'
const BUCKET_NAME = 'photos'

function toPhoto(row: DataRaw<'photos'>): Photo {
  return {
    id: row.id,
    tripId: row.trip_id,
    placeId: row.place_id,
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


const resizeImage = async (_file: File) => {
  const file = (await isHeic(_file)) ? await convertHeicToJPEG(_file) : _file;
  const [fileName, fileType = 'JPEG'] = splitExtension(file.name);

  return new Promise<File>((resolve, reject) => {
    Resizer.imageFileResizer(
      file,
      1000,
      1000,
      fileType,
      100,
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

export async function uploadPhoto({ tripId, placeId, file: _file }: PhotoUploadParams): Promise<Photo> {
  const file = await resizeImage(_file);
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const storagePath = `${tripId}/${placeId}/${fileName}`

  // Presigned URL 생성
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storagePath)

  if (signedError) throw signedError

  // Presigned URL로 업로드
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .uploadToSignedUrl(storagePath, signedData.token, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  const { data: created, error: insertError } = await supabase
    .from('photos')
    .insert({
      trip_id: tripId,
      place_id: placeId,
      url: urlData.publicUrl,
      storage_path: storagePath,
    })
    .select()
    .single()

  if (insertError) throw insertError
  return toPhoto(created!)
}

export async function deletePhoto(photo: Photo): Promise<boolean> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([photo.storagePath])

  if (storageError) throw storageError

  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo.id)

  if (dbError) throw dbError
  return true
}

export async function deletePhotosByTripId(tripId: string): Promise<void> {
  const photos = await getPhotosByTripId(tripId)

  if (photos.length > 0) {
    const storagePaths = photos.map(p => p.storagePath)
    await supabase.storage.from(BUCKET_NAME).remove(storagePaths)
  }
}
