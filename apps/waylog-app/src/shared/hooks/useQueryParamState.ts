import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppNavigation, useAppRoute } from './useAppNavigation'

interface OptionWithDefault<T> {
  parse?: (value: string) => T
  defaultValue: T | (() => T)
}

interface Options<T> {
  parse?: (value?: string) => T
  defaultValue?: T | (() => T)
}

type Dispatch<A> = (value: A) => void

export function useQueryParamState<T>(key: string, options: OptionWithDefault<T>): [T, Dispatch<T>]
export function useQueryParamState<T>(
  key: string,
  options?: Options<T>,
): [T | undefined, Dispatch<T | undefined>]

export function useQueryParamState<T>(
  key: string,
  { defaultValue, parse }: Options<T> | OptionWithDefault<T> = {},
) {
  const navigation = useAppNavigation()
  const route = useAppRoute()

  const raw = (route.params as Record<string, unknown> | undefined)?.[key]
  const param = typeof raw === 'string' ? raw : undefined

  const resolvedFromParam = useMemo(() => {
    if (param == null) {
      return defaultValue instanceof Function ? defaultValue() : defaultValue
    }

    if (param === '') return undefined

    return parse != null ? parse(param) : param
  }, [param])

  // navigation.setParams 도 router.setParams 와 마찬가지로 다음 렌더에야 반영될 수 있다.
  // 그 사이 param 이 순간적으로 이전 값(또는 defaultValue)으로 읽히면 화면이 한 프레임
  // 초기화된 것처럼 깜빡인다. 요청 즉시 반영되는 로컬 값을 두고, params 가 실제로 그
  // 값에 수렴하면 그대로 유지한다.
  const [optimisticValue, setOptimisticValue] = useState(resolvedFromParam)

  useEffect(() => {
    setOptimisticValue(resolvedFromParam)
  }, [resolvedFromParam])

  const setValue = useCallback(
    (next: T) => {
      setOptimisticValue(next)
      navigation.setParams({ [key]: next == null ? '' : String(next) } as never)
    },
    [key, navigation],
  )

  return [optimisticValue, setValue]
}
