import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAsyncEffect } from "@waylog/react";
import { use, useCallback, useEffect, useState } from "react";

interface Options {
  suspense?: boolean;
}

export function useStorageStore<T>(
  key: string,
  initialValue: T,
  options?: Options,
): [T, (next: T) => void] {
  const storageSuspend = Storage.load<T>(key);
  const storageValue = options?.suspense ? use(storageSuspend) : null;

  const [value, setValue] = useState<T>(storageValue ?? initialValue);

  useAsyncEffect(async () => {
    if (storageValue != null) return;

    let cancelled = false;
    const loadedValue = await storageSuspend;
    if (!cancelled && loadedValue != null) {
      setValue(loadedValue);
    }

    return () => {
      cancelled = true;
    };
  }, [key]);

  const update = useCallback(
    (next: T) => {
      Storage.save(key, next);
      setValue(next);
    },
    [key],
  );

  return [value, update];
}

const Storage = {
  load: <T>(key: string) => {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return Promise.resolve<T>(cached as T);
    }

    return new Promise<T | null>(async (resolve) => {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) {
        return resolve(null);
      }
      const value = JSON.parse(raw);
      cache.set(key, value);
      resolve(value);
    });
  },
  save: <T>(key: string, value: T) => {
    cache.set(key, value);
    AsyncStorage.setItem(key, JSON.stringify(value));
  },
};
const cache = new Map<string, unknown>();
