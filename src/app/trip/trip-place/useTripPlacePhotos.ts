import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { deletePhoto, getPhotosByPlaceId, photoKey, uploadPhoto } from "~app/photo/photo.api"
import type { Photo } from "~app/photo/photo.types"
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
        return Promise.all(files.map(file => uploadPhoto({ file, tripId, placeId })));
      }
      const response = await uploadPhoto({ file, tripId, placeId })
      return [response];
    },
    onSuccess: (data, { tripId }) => {
      queryClient.setQueryData<Photo[]>(usePlacePhotos.key(placeId), (curr) => {
        if (curr == null) return data;
        return [...data, ...curr];
      });
      queryClient.refetchQueries({
        queryKey: useTripPhotos.key(tripId),
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

  return { data, remove, upload, isUploading, refetch, ...queries }
}

usePlacePhotos.key = (placeId: string) => [photoKey, 'place', placeId]
