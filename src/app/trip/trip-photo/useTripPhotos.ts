import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, uploadPhoto } from "~app/photo/photo.api";
import type { Photo } from "~app/photo/photo.types";
import { tripKey } from "../trip.api";
import { queryClient } from "~app/lib/query-client";

type FileUploadParams =
  | { files?: never; file: File; placeId?: string }
  | { files: File[]; file?: never; placeId?: string };

export function useTripPhotos(tripId: string) {
  const queryClient = useQueryClient();
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, files, placeId }: FileUploadParams) => {
      if (file) {
        const response = await uploadPhoto({ tripId, placeId, file });
        return [response];
      }

      return Promise.all(files.map(file => uploadPhoto({ file, tripId, placeId })))
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