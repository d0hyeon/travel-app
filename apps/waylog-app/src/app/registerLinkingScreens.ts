import { toScreenName } from './AppRoute'

export function registerLinkingScreens(paths: readonly string[]): Record<string, string> {
  return Object.fromEntries(paths.map((path) => [toScreenName(path), path]))
}
