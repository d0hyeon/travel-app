import { startTransition, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type SetStateAction } from 'react'
import { mockStorage } from './plugins/mockStorage'
import { assert } from '~shared/utils/types'

export type ExpandStorage = Omit<Storage, 'setItem'> & {
  setItem: (key: string, value: any, ...options: any[]) => void
}

type Store<T = unknown> = {
  value: T;
  listeners: Set<VoidFunction>;
}
const storageStore = new Map<string, Store>();

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

export function useStorageStore<T, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue: T,
  options: Options<T, S>,
): [T, SetState<T, S>]
export function useStorageStore<T = unknown, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue: T,
): [T, SetState<T, S>]
export function useStorageStore<T = unknown, S extends ExpandStorage = ExpandStorage>(
  key: string,
): [T | undefined, SetState<T | undefined, S>];


export function useStorageStore<T, S extends ExpandStorage = ExpandStorage>(
  key: string,
  initialValue?: T,
  {
    storage = (typeof window === 'undefined' ? mockStorage : localStorage) as unknown as S,
    parse = JSON.parse,
    stringify = JSON.stringify,
  }: Options<T, S> = {},
) {
  const getStore = useCallback(() => {
    if (storageStore.has(key)) {
      return storageStore.get(key) as Store<T>;
    }

    const storageValue = storage.getItem(key);
    const parsedValue = storageValue != null ? parse(storageValue) : null;
    const store: Store<T | undefined> = {
      value: parsedValue ?? initialValue,
      listeners: new Set()
    }
    storageStore.set(key, store);
    return store;
  }, [key]);
  
  const state = useSyncExternalStore<T | undefined>(
    (listener) => {
      const store = getStore();
      store.listeners.add(listener);

      return () => store.listeners.delete(listener);
    },
    () => getStore().value
  )

  const setState = useCallback(
    (next: SetStateAction<T | undefined>, ...options: SetItemOptionParameters<Parameters<S['setItem']>>) => {
      const store = getStore();
      const nextState = next instanceof Function ? next(store.value) : next
      
      if (nextState) {
        storage.setItem(key, stringify(nextState), ...options);
      } else {
        storage.removeItem(key)
      }

      store.value = nextState;
      startTransition(() => {
        store.listeners.forEach(callback => callback());
      })
    },
    [key, storage],
  )

  return useMemo(() => [state, setState] as const, [state, setState])
}
