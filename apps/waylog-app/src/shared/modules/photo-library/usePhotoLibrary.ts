import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Album, AssetField, MediaType, Query } from "expo-media-library";
import type { PhotoAlbum } from "./usePhotoAlbums";
import {
  CameraRoll,
  GetPhotosParams,
} from "@react-native-camera-roll/camera-roll";
import { Platform } from "react-native";

const PHOTO_PAGE_SIZE = 60;

export type PhotoLibraryCollection = Album;

export interface UsePhotoLibraryOptions {
  collection?: PhotoLibraryCollection;
}

export interface LibraryPhoto {
  id: string;
  uri: string;
}

export function usePhotoLibrary(options: UsePhotoLibraryOptions = {}) {
  return useSuspenseInfiniteQuery({
    queryKey: usePhotoLibrary.key(options),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getPhotoPage({ cursor: pageParam, ...options }),
    getNextPageParam: (page) => page.nextCursor,
    select: (response) => response.pages.flatMap((page) => page.photos),
  });
}

usePhotoLibrary.key = (options?: UsePhotoLibraryOptions) =>
  options != null ? ["photo-library", options] : ["photo-library"];

interface GetPhotoPageOption {
  cursor?: string;
  collection?: PhotoLibraryCollection;
}

async function getPhotoPage({ cursor, collection }: GetPhotoPageOption = {}) {
  const params: GetPhotosParams = {
    first: PHOTO_PAGE_SIZE,
    after: cursor,
    assetType: "Photos",
  };
  if (collection != null) {
    params.groupTypes = "Album";
    params.groupName = await collection.getTitle();
  }
  const result = await CameraRoll.getPhotos(params);

  return {
    photos: result.edges.map(({ node }) => ({
      id: node.id,
      uri: node.image.uri,
    })),
    nextCursor: result.page_info.has_next_page
      ? result.page_info.end_cursor
      : undefined,
  };
}

export async function resolvePhotoUri(uri: string) {
  if (Platform.OS !== "ios" || !uri.startsWith("ph://")) {
    return uri;
  }

  const result = await CameraRoll.iosGetImageDataById(uri, {
    convertHeicImages: true,
  });

  const filepath = result?.node?.image?.filepath;

  if (!filepath) {
    throw new Error(`Failed to resolve photo URI: ${uri}`);
  }

  return filepath;
}
