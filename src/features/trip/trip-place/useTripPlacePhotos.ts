import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { deletePhoto, getPhotosByPlaceId, photoKey, updatePhotoVisibility, uploadPhoto } from "~features/photo/photo.api"
import type { Photo } from "~features/photo/photo.types"
import type { PhotoUploadItem } from "~shared/components/photo/PhotoUploader";
import { useTripPhotos } from "../trip-photo/useTripPhotos";

type UploadParams = 
  { items: PhotoUploadItem[]; item?: never; tripId: string; } |
  { items?: never; item: PhotoUploadItem; tripId: string; }

export function usePlacePhotos(placeId: string) {
  const queryClient = useQueryClient();
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: usePlacePhotos.key(placeId),
    queryFn: () => getPhotosByPlaceId(placeId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ tripId, item, items }: UploadParams) => { 
      if (items) {
        return Promise.all(items.map(({ file, isPublic }) => uploadPhoto({ file, tripId, placeId, isPublic })));
      }
      const response = await uploadPhoto({ file: item.file, tripId, placeId, isPublic: item.isPublic })
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

  const { mutateAsync: updateVisibility } = useMutation({
    mutationFn: ({ photoId, isPublic }: { photoId: string; isPublic: boolean; tripId: string }) => updatePhotoVisibility(photoId, isPublic),
    onSuccess: (updatedPhoto, { tripId }) => {
      queryClient.setQueryData<Photo[]>(usePlacePhotos.key(placeId), (curr) => (
        curr?.map((photo) => photo.id === updatedPhoto.id ? updatedPhoto : photo) ?? [updatedPhoto]
      ));
      queryClient.refetchQueries({
        queryKey: useTripPhotos.key(tripId),
      });
    }
  })

  return { data, remove, upload, updateVisibility, isUploading, refetch, ...queries }
}

usePlacePhotos.key = (placeId: string) => [photoKey, 'place', placeId]
