import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { deletePhoto, getPhotosByPlaceId, photoKey, uploadPhoto } from "~features/photo/photo.api"
import type { Photo, PhotoUploadParams } from "~features/photo/photo.types"

export function usePlacePhotos(placeId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: usePlacePhotos.key(placeId),
    queryFn: () => getPhotosByPlaceId(placeId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: (params: Omit<PhotoUploadParams, 'placeId'>) =>
      uploadPhoto({ placeId, ...params }),
    onError: (error) => {
      alert(error.message)
    },
    onSuccess: () => refetch()
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: () => refetch()
  })

  return { data, remove, upload, isUploading, refetch, ...queries }
}

usePlacePhotos.key = (placeId: string) => [photoKey, 'place', placeId]
