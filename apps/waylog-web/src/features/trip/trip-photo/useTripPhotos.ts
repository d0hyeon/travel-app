import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, updatePhoto, uploadPhoto, type PhotoUpdate } from "~features/photo/photo.api";
import { findNearestPlaceFromPhoto } from "~features/photo/photo.utils";
import type { Photo } from "@waylog/domains/modules/photo";
import { tripKey } from "@waylog/domains/modules/trip";
import { useTripPlaces } from '@waylog/domains/modules/trip';
import { queryClient } from "~app/query-client";
import { useSuspenseQuery, type UseSuspenseQueryOptions } from "@waylog/react";

type FileUploadParams =
  | { files: File[]; placeId?: string }
  | { file: File; placeId?: string };

type QueryOptions = UseSuspenseQueryOptions<Photo[], Error, Photo[], string[]>

export function useTripPhotos(tripId: string, options?: Omit<QueryOptions, 'queryKey' | 'queryFn'>) {
  const queryClient = useQueryClient();
  const { data: places } = useTripPlaces(tripId);

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId),
    ...options
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async (params: FileUploadParams) => {
      const { placeId } = params
      const uploadSingle = async (targetFile: File) => {
        const resolvedPlaceId = placeId ?? await findNearestPlaceFromPhoto(targetFile, places)
        return uploadPhoto({ tripId, placeId: resolvedPlaceId, file: targetFile, isPublic: false })
      }
      const files = 'file' in params ? [params.file] : params.files;
      for (const file of files) { 
        const uploaded = await uploadSingle(file);

        queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) => {
          if (curr == null) return [uploaded];
          return [uploaded, ...curr];
        })
      }
    },
    onSuccess: () => refetch()
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: () => refetch()
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ photoId, ...patch }: { photoId: string } & PhotoUpdate) => updatePhoto(photoId, patch),
    onSuccess: (updatedPhoto) => {
      queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) => (
        curr?.map((photo) => photo.id === updatedPhoto.id ? updatedPhoto : photo) ?? [updatedPhoto]
      ))
    }
  })

  return { data, upload, remove, update, refetch, isUploading, ...queries }
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId];
useTripPhotos.prefetch = (tripId: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })
}
