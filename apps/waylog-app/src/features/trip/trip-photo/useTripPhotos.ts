import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { deletePhoto, getPhotosByTripId, photoKey, updatePhoto, type Photo, type PhotoUpdate } from '@waylog/domains/photo'
import { tripKey } from '@waylog/domains/trip'
import { uploadPhoto } from '../../photo/photo.api'

// 웹 useTripPhotos 와 같은 시그니처를 유지한다.
// 웹은 File 을 받지만 앱은 로컬 uri 를 받는다 — EXIF 기반 장소 추정은 후속 작업이다.
interface UploadParams {
  uris: string[]
  placeId?: string
}

export function useTripPhotos(tripId: string) {
  const queryClient = useQueryClient()

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId),
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ uris, placeId }: UploadParams) => {
      for (const uri of uris) {
        const uploaded = await uploadPhoto({ tripId, placeId, uri, isPublic: false })

        queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) =>
          curr == null ? [uploaded] : [uploaded, ...curr],
        )
      }
    },
    onSuccess: () => refetch(),
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: () => refetch(),
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ photoId, ...patch }: { photoId: string } & PhotoUpdate) =>
      updatePhoto(photoId, patch),
    onSuccess: (updatedPhoto) => {
      queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) =>
        curr?.map((photo) => (photo.id === updatedPhoto.id ? updatedPhoto : photo)) ?? [
          updatedPhoto,
        ],
      )
    },
  })

  return { data, upload, remove, update, refetch, isUploading, ...queries }
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId]
