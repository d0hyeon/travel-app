import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, uploadPhoto } from "~features/photo/photo.api";
import { findNearestPlaceFromPhoto } from "~features/photo/photo.utils";
import type { Photo } from "~features/photo/photo.types";
import { tripKey } from "../trip.api";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { queryClient } from "~app/query-client";

type FileUploadParams =
  | { files?: never; file: File; placeId?: string }
  | { files: File[]; file?: never; placeId?: string };

export function useTripPhotos(tripId: string) {
  const queryClient = useQueryClient();
  const { data: places } = useTripPlaces(tripId);

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, files, placeId }: FileUploadParams) => {
      const uploadSingle = async (file: File) => {
        const resolvedPlaceId = placeId ?? await findNearestPlaceFromPhoto(file, places)
        return uploadPhoto({ tripId, placeId: resolvedPlaceId, file })
      }

      if (file) return [await uploadSingle(file)]
      return Promise.all(files.map(uploadSingle))
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

  return { data, upload, remove, refetch, isUploading, ...queries }
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId];
useTripPhotos.prefetch = (tripId: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })
}
