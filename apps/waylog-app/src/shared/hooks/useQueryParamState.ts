import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

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

  const resolvedFromParam = useMemo(() => {
    if (param == null) {
      return defaultValue instanceof Function ? defaultValue() : defaultValue
    }

    if (param === '') return undefined

    return parse != null ? parse(param) : param
  }, [param])

  // router.setParams 는 다음 렌더에야 반영된다. 그 사이 param 이 순간적으로
  // 이전 값(또는 defaultValue)으로 읽히면 화면이 한 프레임 초기화된 것처럼 깜빡인다.
  // 요청 즉시 반영되는 로컬 값을 두고, URL 이 실제로 그 값에 수렴하면 그대로 유지한다.
  const [optimisticValue, setOptimisticValue] = useState(resolvedFromParam)

  useEffect(() => {
    setOptimisticValue(resolvedFromParam)
  }, [resolvedFromParam])

  const setValue = useCallback(
    (next: T) => {
      setOptimisticValue(next)
      router.setParams({ [key]: next == null ? '' : String(next) })
    },
    [key, router],
  )

  return [optimisticValue, setValue]
}
