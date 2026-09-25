import { toScreenName, type ToScreenName } from './AppRoute'

export function registerLinkingScreens<P extends string>(
  paths: readonly P[],
): { [K in P as ToScreenName<K>]: K } {
  return Object.fromEntries(paths.map((path) => [toScreenName(path), path])) as { [K in P as ToScreenName<K>]: K }
}
