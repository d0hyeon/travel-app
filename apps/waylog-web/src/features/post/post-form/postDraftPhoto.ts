import type { Photo } from '~features/photo/photo.types'

export interface DraftPostPhoto {
  id: string;
  source: 'saved' | 'local'
  url: string;
  file?: File;
  placeId: string | null;
}

export function isLocalDraftPostPhoto(photo: DraftPostPhoto): photo is DraftPostPhoto & { source: 'local'; file: File } {
  return photo.source === 'local' && photo.file instanceof File
}
