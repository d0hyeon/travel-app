import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'

// 웹 shared/hooks/urls/useQueryParamState 와 같은 시그니처를 유지한다.
// Expo Router 도 파일 라우팅 위에 실제 URL 개념을 가지므로 저장 모델이 같다.
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
  const params = useLocalSearchParams()
  const router = useRouter()

  const raw = params[key]
  const param = Array.isArray(raw) ? raw[0] : raw

  const value = useMemo(() => {
    if (param == null) {
      return defaultValue instanceof Function ? defaultValue() : defaultValue
    }

    if (param === '') return undefined

    return parse != null ? parse(param) : param
  }, [param])

  const setValue = useCallback(
    (next: T) => {
      router.setParams({ [key]: next == null ? '' : String(next) })
    },
    [key, router],
  )

  return [value, setValue]
}
