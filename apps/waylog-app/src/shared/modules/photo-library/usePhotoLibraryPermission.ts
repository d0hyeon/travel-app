import { useQuery } from "@waylog/react";
import {
  getPermissionsAsync,
  PermissionStatus,
  requestPermissionsAsync,
} from "expo-media-library";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { queryClient } from "~shared/query-client";
import { usePhotoLibrary } from "./usePhotoLibrary";
import { PermissionResponse } from "expo";

interface PhotoLibraryPermissionResult {
  requestPermission: () => Promise<PermissionResponse>;
}

interface PendingPermission {
  isLoading: true; 
  isDenied?: boolean; 
  isPermissionRequestAvailable?: boolean; 
  hasPermission?: boolean;
}

interface ResolvedPermission {
  isLoading: false;
  isDenied: boolean;
  isPermissionRequestAvailable: boolean;
  hasPermission: boolean;
}

type AsynablePermissionResult = PhotoLibraryPermissionResult & ResolvedPermission;

type SynablePermissionResult = PhotoLibraryPermissionResult & (ResolvedPermission | PendingPermission);

interface Options {
  suspense?: boolean;
}

export function usePhotoLibraryPermission(options: {
  suspense: true;
}): AsynablePermissionResult;
export function usePhotoLibraryPermission(
  options?: Options,
): SynablePermissionResult;
export function usePhotoLibraryPermission(options?: Options) {
  const {
    data: permission,
    isLoading,
    refetch,
  } = useQuery({
    ...options,
    queryKey: usePhotoLibraryPermission.key(),
    queryFn: async () => {
      const permission = await getPermissionsAsync(false, ["photo"]);
      if (permission.status !== PermissionStatus.UNDETERMINED) {
        return permission;
      }

      return requestPermissionsAsync(false, ["photo"]);
    },
  });

  const requestPermission = useCallback(async () => {
    const permission = await requestPermissionsAsync(false, ["photo"]);
    queryClient.setQueryData(usePhotoLibraryPermission.key(), permission);
    queryClient.invalidateQueries({ queryKey: usePhotoLibrary.key() });

    return permission;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        refetch();
        queryClient.invalidateQueries({ queryKey: usePhotoLibrary.key() });
      }
    });

    return () => subscription.remove();
  }, [refetch]);

  if (permission == null || isLoading) {
    return {
      hasPermission: undefined,
      isDenied: undefined,
      isPermissionRequestAvailable: undefined,
      isLoading: true,
      requestPermission,
    } satisfies SynablePermissionResult;
  }

  return {
    hasPermission: permission.status === PermissionStatus.GRANTED,
    isDenied: permission.status === PermissionStatus.DENIED,
    isPermissionRequestAvailable: permission.canAskAgain,
    isLoading,
    requestPermission,
  };
}

usePhotoLibraryPermission.key = () => ["photo-library-permission"];
