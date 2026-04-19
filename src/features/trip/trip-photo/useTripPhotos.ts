import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, updatePhotoVisibility, uploadPhoto } from "~features/photo/photo.api";
import { findNearestPlaceFromPhoto } from "~features/photo/photo.utils";
import type { Photo } from "~features/photo/photo.types";
import type { PhotoUploadItem } from "~shared/components/photo/PhotoUploader";
import { tripKey } from "../trip.api";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { queryClient } from "~app/query-client";

type FileUploadParams =
  | { items?: never; item: PhotoUploadItem; placeId?: string }
  | { items: PhotoUploadItem[]; item?: never; placeId?: string };

export function useTripPhotos(tripId: string) {
  const queryClient = useQueryClient();
  const { data: places } = useTripPlaces(tripId);

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ item, items, placeId }: FileUploadParams) => {
      const uploadSingle = async ({ file, isPublic }: PhotoUploadItem) => {
        const resolvedPlaceId = placeId ?? await findNearestPlaceFromPhoto(file, places)
        return uploadPhoto({ tripId, placeId: resolvedPlaceId, file, isPublic })
      }

      if (item) return [await uploadSingle(item)]
      return Promise.all(items.map(uploadSingle))
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) => {
        if (curr == null) return data;
        return [...data, ...curr];
      })
    }
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: () => refetch()
  })

  const { mutateAsync: updateVisibility } = useMutation({
    mutationFn: ({ photoId, isPublic }: { photoId: string; isPublic: boolean }) => updatePhotoVisibility(photoId, isPublic),
    onSuccess: (updatedPhoto) => {
      queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) => (
        curr?.map((photo) => photo.id === updatedPhoto.id ? updatedPhoto : photo) ?? [updatedPhoto]
      ))
    }
  })

  return { data, upload, remove, updateVisibility, refetch, isUploading, ...queries }
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId];
useTripPhotos.prefetch = (tripId: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })
}
