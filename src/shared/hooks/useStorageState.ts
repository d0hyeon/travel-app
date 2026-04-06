import { useCallback, useMemo, useState, type SetStateAction } from 'react'
import { mockStorage } from './plugins/mockStorage'

export type ExpandStorage = Omit<Storage, 'setItem'> & {
  setItem: (key: string, value: any, ...options: any[]) => void
}

type Options<T, S = ExpandStorage> = {
  storage?: S
  parse?: (data: string) => T | undefined
  stringify?: (data: T) => unknown
}

type SetItemOptionParameters<T extends unknown[]> = T extends [unknown, unknown, ...infer Rest] ? Rest : never

type SetState<T, S extends ExpandStorage> = (
  nextState: T | ((prevState: T) => T),
  ...options: SetItemOptionParameters<Parameters<S['setItem']>>
) => void

export function useStorageState<T, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue: T,
  options: Options<T, S>,
): [T, SetState<T, S>, VoidFunction]
export function useStorageState<T = unknown, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue: T,
): [T, SetState<T, S>, VoidFunction]
export function useStorageState<T = unknown, S extends ExpandStorage = ExpandStorage>(
  key: string,
): [T | undefined, SetState<T | undefined, S>, VoidFunction]

export function useStorageState<T, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue?: T,
  {
    storage = (typeof window === 'undefined' ? mockStorage : localStorage) as unknown as S,
    parse = JSON.parse,
    stringify = JSON.stringify,
  }: Options<T, S> = {},
) {
  const storageValue = storage.getItem(key)
  const [state, _setState] = useState<T | undefined>(() => {
    if (storageValue && parse) {
      try {
        return parse(storageValue)
      } catch {
        storage.removeItem(key)
      }
    }

    return initialValue
  })

  const setState = useCallback(
    (next: SetStateAction<T | undefined>, ...options: SetItemOptionParameters<Parameters<S['setItem']>>) => {
      const nextState = next instanceof Function ? next(state) : next
      _setState(nextState)

      if (nextState == null) {
        storage.removeItem(key)
        return
      }

      storage.setItem(key, stringify(nextState), ...options)
    },
    [key, state, storage, stringify],
  )

  const clear = useCallback(() => {
    storage.removeItem(key)
    _setState(initialValue)
  }, [initialValue, key, storage])

  return useMemo(() => [state, setState, clear] as const, [state, setState, clear])
}
