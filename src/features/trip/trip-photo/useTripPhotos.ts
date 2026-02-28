import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, uploadPhoto } from "~features/photo/photo.api";
import type { Photo, PhotoUploadParams } from "~features/photo/photo.types";
import { tripKey } from "../trip.api";

export function useTripPhotos(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: (params: Omit<PhotoUploadParams, 'tripId'>) =>
      uploadPhoto({ tripId, ...params }),
    onSuccess: () => refetch()
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onSuccess: () => refetch()
  })

  return { data, upload, remove, refetch, isUploading, ...queries }
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId];
