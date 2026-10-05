import AsyncStorage from "@react-native-async-storage/async-storage";
import { use, useCallback, useSyncExternalStore } from "react";

interface Options {
  suspense?: boolean;
}

interface Store<T> {
  value: T;
  listeners: Set<VoidFunction>;
  loaded: boolean;
  promise: Promise<void> | null;
}

const storageStore = new Map<string, Store<unknown>>();

function getOrCreateStore<T>(key: string, initialValue: T): Store<T> {
  const existing = storageStore.get(key);
  if (existing != null) return existing as Store<T>;

  const store: Store<T> = {
    value: initialValue,
    listeners: new Set(),
    loaded: false,
    promise: null,
  };
  storageStore.set(key, store);

  store.promise = AsyncStorage.getItem(key).then((raw) => {
    if (raw != null) store.value = JSON.parse(raw);
    store.loaded = true;
    store.promise = null;
    store.listeners.forEach((listener) => listener());
  });

  return store;
}

export function useStorageStore<T>(
  key: string,
  initialValue: T,
  options?: Options,
): [T, (next: T) => void] {
  const getStore = useCallback(
    () => getOrCreateStore(key, initialValue),
    [key, initialValue],
  );

  if (options?.suspense === true) {
    const store = getStore();
    if (!store.loaded && store.promise != null) use(store.promise);
  }

  const value = useSyncExternalStore(
    (listener) => {
      const store = getStore();
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => getStore().value,
  );

  const update = useCallback(
    (next: T) => {
      const store = getStore();
      store.value = next;
      store.loaded = true;
      AsyncStorage.setItem(key, JSON.stringify(next));
      store.listeners.forEach((listener) => listener());
    },
    [key, getStore],
  );

  return [value, update];
}
