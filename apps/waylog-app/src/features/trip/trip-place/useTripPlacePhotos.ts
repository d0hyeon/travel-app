import type { Photo } from '@waylog/domains/modules/photo'
import { useTripPhotos } from '../trip-photo/useTripPhotos'

interface UploadAsset {
  uri: string
  exif?: Record<string, unknown> | null
}

/**
 * 웹 usePlacePhotos 와 같은 역할. 장소 하나의 사진만 다룬다.
 * 웹은 placeId 로 따로 조회하지만 앱은 여행 사진 목록을 이미 들고 있어 그중에서 고른다.
 */
export function usePlacePhotos(tripId: string, placeId: string | undefined) {
  const { data: photos, upload, remove, update, isUploading, refetch, ...queries } = useTripPhotos(tripId)

  const data = photos.filter((photo) => photo.placeId === placeId)

  return {
    data,
    isUploading,
    refetch,
    upload: (assets: UploadAsset[]) => {
      if (placeId == null) return Promise.resolve()
      return upload({ assets, placeId })
    },
    remove: (photo: Photo) => remove(photo),
    update,
    ...queries,
  }
}
