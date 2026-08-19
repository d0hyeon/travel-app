import type { DataRaw } from '@waylog/domains/api';
import { apiClient, supabase } from '@waylog/domains/api'
import type { Photo, PhotoUploadParams } from '@waylog/domains/photo'
import { toPhoto } from '@waylog/domains/photo'
import { heicTo, isHeic } from 'heic-to'
import Resizer from 'react-image-file-resizer';


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
  const { data, contentType } = await apiClient.get('/functions/v1/file', {
    params: { url },
    parse: async (response) => {
      const data = await response.blob();
      return { data, contentType: response.headers.get('Content-Type') ?? 'image/jpeg' }
    }
  });

  return new File([data], fileName, { type: contentType })
}

// 조회·삭제·수정은 공유 패키지에 있다. 브라우저 전용(HEIC 변환·리사이즈) 업로드만 여기 남는다.
export * from '@waylog/domains/photo'
