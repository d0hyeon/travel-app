import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deletePhoto, getPhotosByTripId, photoKey, uploadPhoto } from "~features/photo/photo.api";
import { extractPhotoExif, resolvePhotoPlaceId } from "~features/photo/photo.utils";
import type { Photo } from "~features/photo/photo.types";
import { tripKey } from "../trip.api";
import { useTrip } from "../useTrip";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { queryClient } from "~app/query-client";

type FileUploadParams =
  | { files?: never; file: File; placeId?: string }
  | { files: File[]; file?: never; placeId?: string };

export function useTripPhotos(tripId: string) {
  const queryClient = useQueryClient();
  const { data: trip } = useTrip(tripId);
  const { data: places } = useTripPlaces(tripId);

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId)
  })

  const resolveExifPlaceId = async (file: File) => {
    const exif = await extractPhotoExif(file)
    return resolvePhotoPlaceId(exif, places, trip)
  }

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, files, placeId }: FileUploadParams) => {
      const uploadSingle = async (f: File) => {
        const resolvedPlaceId = placeId ?? await resolveExifPlaceId(f)
        return uploadPhoto({ tripId, placeId: resolvedPlaceId, file: f })
      }

      if (file) {
        return [await uploadSingle(file)]
      }

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