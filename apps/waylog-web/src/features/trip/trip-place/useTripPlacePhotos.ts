import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { deletePhoto, getPhotosByPlaceId, photoKey, updatePhoto, uploadPhoto, type PhotoUpdate } from "~features/photo/photo.api"
import type { Photo } from "@waylog/domains/photo"
import { useTripPhotos } from "../trip-photo/useTripPhotos";

type UploadParams = 
  { files: File[]; file?: never; tripId: string; } |
  { files?: never; file: File; tripId: string; }

export function usePlacePhotos(placeId: string) {
  const queryClient = useQueryClient();
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: usePlacePhotos.key(placeId),
    queryFn: () => getPhotosByPlaceId(placeId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ tripId, file, files }: UploadParams) => { 
      if (files) {
        return Promise.all(files.map((targetFile) => uploadPhoto({ file: targetFile, tripId, placeId, isPublic: false })));
      }
      const response = await uploadPhoto({ file, tripId, placeId, isPublic: false })
      return [response];
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Photo[]>(usePlacePhotos.key(placeId), (curr) => {
        if (curr == null) return data;
        return [...data, ...curr];
      });
    }
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: (_, { tripId, id }) => {
      queryClient.setQueryData<Photo[]>(usePlacePhotos.key(placeId), (curr) => {
        if (curr == null) return data;
        return curr.filter(x => x.id !== id)
      });
      queryClient.refetchQueries({
        queryKey: useTripPhotos.key(tripId),
      });
    }
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ photoId, ...patch }: { photoId: string; tripId: string } & PhotoUpdate) => updatePhoto(photoId, patch),
    onSuccess: (updatedPhoto, { tripId }) => {
      queryClient.setQueryData<Photo[]>(usePlacePhotos.key(placeId), (curr) => (
        curr?.map((photo) => photo.id === updatedPhoto.id ? updatedPhoto : photo) ?? [updatedPhoto]
      ));
      queryClient.refetchQueries({
        queryKey: useTripPhotos.key(tripId),
      });
    }
  })

  return { data, remove, upload, update, isUploading, refetch, ...queries }
}

usePlacePhotos.key = (placeId: string) => [photoKey, 'place', placeId]
