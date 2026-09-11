import type { Photo } from '@waylog/domains/modules/photo'
import { useState } from 'react'

interface PhotoPatch {
  placeId?: string | null
  isPublic?: boolean
}

interface Params {
  photos: Photo[]
  initialIndex: number
  onUpdate?: (params: { photoId: string } & PhotoPatch) => Promise<unknown>
}

/**
 * 사진 상세 뷰어가 보여 주는 목록과 현재 위치를 들고 있는다.
 *
 * 서버 갱신이 목록 쿼리에 반영되기 전에도 열려 있는 뷰어가 바뀐 값을 보여야 해
 * 뷰어 안에 사본을 두고 낙관적으로 갱신한다.
 */
export function usePhotoViewerState({ photos, initialIndex, onUpdate }: Params) {
  const [viewerPhotos, setViewerPhotos] = useState(photos)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const currentPhoto = viewerPhotos[currentIndex]

  const updateCurrentPhoto = async (patch: PhotoPatch) => {
    await onUpdate?.({ photoId: currentPhoto.id, ...patch })
    setViewerPhotos((items) =>
      items.map((item) => (item.id === currentPhoto.id ? { ...item, ...patch } : item)),
    )
  }

  return { viewerPhotos, currentIndex, currentPhoto, setCurrentIndex, updateCurrentPhoto }
}
