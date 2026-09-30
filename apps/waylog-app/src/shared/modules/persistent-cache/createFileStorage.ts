import { Directory, File, Paths } from 'expo-file-system'
import type { PersistentStorage } from './withPersistentCache'

export function createFileStorage(directoryName: string): PersistentStorage {
  const directory = new Directory(Paths.cache, directoryName)
  const getFile = (key: string) => new File(directory, `${encodeURIComponent(key)}.json`)

  return {
    async get(key) {
      const file = getFile(key)
      return file.exists ? file.text() : null
    },
    async set(key, value) {
      directory.create({ idempotent: true, intermediates: true })
      getFile(key).write(value)
    },
  }
}
