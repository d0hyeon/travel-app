import { useQuery } from "@waylog/react";

import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useMemo } from "react";
import { AppState } from "react-native";
import { queryClient } from "~shared/query-client";

interface PushPermissionResult {
  requestPermission: () => Promise<boolean>;
}

interface AsynablePermissionResult extends PushPermissionResult {
  isLoading: false;
  isDenied: boolean;
  isPermissionRequestAvailable: boolean;
  hasPermission: boolean;
  status: Notifications.PermissionStatus;
}
interface SynablePermissionResult extends PushPermissionResult {
  isLoading: boolean;
  isDenied?: boolean;
  isPermissionRequestAvailable?: boolean;
  hasPermission?: boolean;
  status?: Notifications.PermissionStatus;
}

interface Options {
  suspense?: boolean;
}

export function usePushPermission(options: {
  suspense: true;
}): AsynablePermissionResult;
export function usePushPermission(options?: Options): SynablePermissionResult;
export function usePushPermission(options?: Options) {
  const {
    data: permission,
    isLoading,
    refetch,
  } = useQuery({
    ...options,
    queryKey: usePushPermission.key(),
    queryFn: () => Notifications.getPermissionsAsync(),
  });

  const requestPermission = useCallback(async () => {
    const result = await Notifications.requestPermissionsAsync();
    queryClient.setQueryData(usePushPermission.key(), result);

    return result.granted;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        refetch();
      }
    });

    return () => subscription.remove();
  }, [refetch]);

  return useMemo(() => {
    if (permission == null) {
      return {
        hasPermission: undefined,
        isDenied: undefined,
        isPermissionRequestAvailable: undefined,
        isLoading,
        status: undefined,
        requestPermission,
      };
    }

    return {
      hasPermission:
        permission.status === Notifications.PermissionStatus.GRANTED,
      isDenied: permission.status === Notifications.PermissionStatus.DENIED,
      isPermissionRequestAvailable: permission.canAskAgain,
      isLoading,
      status: permission.status,
      requestPermission,
    };
  }, [permission, isLoading, requestPermission]);
}

usePushPermission.key = () => ["push-permission"];
