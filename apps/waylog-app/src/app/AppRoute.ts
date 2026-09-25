import { AppRoute as BaseAppRoute } from '@waylog/routes'

type ToScreenName<S extends string> = S extends `${infer H}:${infer T}` ? `${H}_${ToScreenName<T>}` : S

export function toScreenName<S extends string>(path: S): ToScreenName<S> {
  return path.replaceAll(':', '_') as ToScreenName<S>
}

type ScreenRoute = { readonly [K in keyof typeof BaseAppRoute]: ToScreenName<(typeof BaseAppRoute)[K]> }

export const AppRoute = Object.fromEntries(
  Object.entries(BaseAppRoute).map(([key, value]) => [key, toScreenName(value)]),
) as ScreenRoute
