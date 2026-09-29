import type { BridgeInterface, BridgeMethod } from "@waylog/bridge/contract";
import type { BridgeHost } from "@waylog/bridge/host";
import { useEffect, useEffectEvent } from "react";

type BridgeResolverMap = Partial<BridgeInterface>;

export function useBridgeResolvers(
  host: BridgeHost | undefined,
  resolvers: BridgeResolverMap,
): void {
  const callback = useEffectEvent((host: BridgeHost) => {
    const methods = objectKeys(resolvers);
    const unsubscribes = methods.map((method) => {
      if (resolvers[method]) {
        return host.register(method, resolvers[method]);
      }
      return () => {};
    });

    return () => unsubscribes.forEach((unregister) => unregister());
  });

  useEffect(() => {
    if (!host) return;
    const cleanup = callback(host);

    return cleanup;
  }, [host]);
}

function objectKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
