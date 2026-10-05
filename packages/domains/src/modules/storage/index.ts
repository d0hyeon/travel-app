export type StorageValue = string | null

export interface PlatformStorage {
  getItem(key: string): StorageValue | Promise<StorageValue>
  setItem(key: string, value: string): void | Promise<void>
}

export interface Storage {
  get(key: string): string | null
  set(key: string, value: string): void
}

const memoryValues = new Map<string, string>()
let configuredStorage: Storage = {
  get: (key) => memoryValues.get(key) ?? null,
  set: (key, value) => void memoryValues.set(key, value),
}

export function configureStorage(platformStorage: PlatformStorage): void {
  const cache = new Map<string, string>()

  configuredStorage = {
    get(key) {
      const value = platformStorage.getItem(key)
      if (isPromise(value)) {
        void value.then((storedValue) => {
          if (storedValue != null) cache.set(key, storedValue)
        })
        return cache.get(key) ?? null
      }
      if (value == null) return null
      cache.set(key, value)
      return value
    },
    set(key, value) {
      cache.set(key, value)
      void platformStorage.setItem(key, value)
    },
  }

}

export function getStorage(): Storage {
  if (configuredStorage == null) {
    throw new Error('getStorage()에 접근하기 전에 initializeClient()를 호출해야 합니다.')
  }
  return configuredStorage
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise
}
