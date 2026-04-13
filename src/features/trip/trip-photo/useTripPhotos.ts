import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import exifr from 'exifr'
import { deletePhoto, getPhotosByTripId, photoKey, uploadPhoto } from "~features/photo/photo.api";
import type { Photo } from "~features/photo/photo.types";
import { tripKey } from "../trip.api";
import { useTrip } from "../useTrip";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { calcDistance } from '~shared/utils/geo'
import { queryClient } from "~app/query-client";

const PLACE_MATCH_DISTANCE_LIMIT = 500

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

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, files, placeId }: FileUploadParams) => {
      const uploadSingle = async (file: File) => {
        let resolvedPlaceId = placeId

        if (!resolvedPlaceId) {
          const exif = await exifr.parse(file, { gps: true, pick: ['DateTimeOriginal', 'latitude', 'longitude'] })
          const { DateTimeOriginal: takenAt, latitude: lat, longitude: lng } = exif ?? {}

          if (takenAt instanceof Date && lat != null && lng != null) {
            const takenDate = [
              takenAt.getFullYear(),
              String(takenAt.getMonth() + 1).padStart(2, '0'),
              String(takenAt.getDate()).padStart(2, '0'),
            ].join('-')

            if (takenDate >= trip.startDate && takenDate <= trip.endDate) {
              const nearest = places
                .map(place => ({ place, distance: calcDistance({ lat, lng }, place) }))
                .filter(({ distance }) => distance <= PLACE_MATCH_DISTANCE_LIMIT)
                .toSorted((a, b) => a.distance - b.distance)[0]
              resolvedPlaceId = nearest?.place.id
            }
          }
        }

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
