import {
  useMutation,
  useQueryClient,
  type UseMutateAsyncFunction,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";
import {
  deletePhoto,
  getPhotosByTripId,
  photoKey,
  updatePhoto,
  type Photo,
  type PhotoUpdate,
} from "@waylog/domains/modules/photo";
import { tripKey, useTripPlaces } from "@waylog/domains/modules/trip";
import { useSuspenseQuery, UseSuspenseQueryOptions } from "@waylog/react";
import { uploadPhoto } from "~features/photo/photo.api";
import { findNearestPlaceFromPhoto } from "~features/photo/photo.utils";
import { toast } from "~shared/components/toast/toast";
import { queryClient as appQueryClient } from "~shared/query-client";


// 웹 useTripPhotos 와 같은 시그니처를 유지한다.
// 웹은 File 을 받지만 앱은 picker 가 준 asset 을 받는다.
// EXIF 는 리사이즈 전에 읽어야 하므로 picker 가 준 것을 그대로 넘긴다.
interface UploadAsset {
  uri: string;
  exif?: Record<string, unknown> | null;
}

interface UploadParams {
  assets: UploadAsset[];
  placeId?: string;
}

interface UpdatePhotoParams extends PhotoUpdate {
  photoId: string;
}

type TripPhotosResult<Data> = UseSuspenseQueryResult<Data> & {
  upload: UseMutateAsyncFunction<void, Error, UploadParams>;
  remove: UseMutateAsyncFunction<boolean, Error, Photo>;
  update: UseMutateAsyncFunction<Photo, Error, UpdatePhotoParams>;
  isUploading: boolean;
};

type QueryOptions = Omit<
  UseSuspenseQueryOptions<Photo[]>,
  "queryKey" | "queryFn"
>;

export function useTripPhotos(
  tripId: string,
  options: QueryOptions & { enabled?: true },
): TripPhotosResult<Photo[]>;
export function useTripPhotos(
  tripId: string,
  options: QueryOptions & { enabled?: boolean },
): TripPhotosResult<Photo[] | undefined>;

export function useTripPhotos(tripId: string): TripPhotosResult<Photo[]>;
export function useTripPhotos(
  tripId: string,
  { enabled, ...options }: QueryOptions = {},
) {
  const queryClient = useQueryClient();
  const { data: places } = useTripPlaces(tripId, { enabled });
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId),
    enabled,
    ...options,
  });

  const { mutateAsync: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ assets, placeId }: UploadParams) => {
      if (places == null) return Promise.resolve();
      for (const asset of assets) {
        const uploaded = await uploadPhoto({
          tripId,
          placeId: placeId ?? findNearestPlaceFromPhoto(asset.exif, places),
          uri: asset.uri,
          isPublic: false,
        });

        queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) =>
          curr == null ? [uploaded] : [uploaded, ...curr],
        );
      }
    },
    onSuccess: () => refetch(),
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: (photo: Photo) => deletePhoto(photo),
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: useTripPhotos.key(tripId) });
      queryClient.setQueryData<Photo[]>(useTripPhotos.key(tripId), (curr) =>
        curr?.filter((item) => item.id !== photo.id),
      );
      toast.success("사진을 삭제했어요");
    },
    onError: () => {
      toast.error("사진을 삭제하지 못했어요");
      refetch();
    },
  });

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ photoId, ...patch }: UpdatePhotoParams) =>
      updatePhoto(photoId, patch),
    onSuccess: (updatedPhoto) => {
      queryClient.setQueryData<Photo[]>(
        useTripPhotos.key(tripId),
        (curr) =>
          curr?.map((photo) =>
            photo.id === updatedPhoto.id ? updatedPhoto : photo,
          ) ?? [updatedPhoto],
      );
    },
  });

  return { data, upload, remove, update, refetch, isUploading, ...queries };
}

useTripPhotos.key = (tripId: string) => [tripKey, photoKey, tripId];

/** 훅을 걸기 전에 캐시를 채운다. 웹 useTripPhotos.prefetch 와 같은 역할. */
useTripPhotos.prefetch = (tripId: string) => {
  void appQueryClient.prefetchQuery({
    queryKey: useTripPhotos.key(tripId),
    queryFn: () => getPhotosByTripId(tripId),
  });
};
