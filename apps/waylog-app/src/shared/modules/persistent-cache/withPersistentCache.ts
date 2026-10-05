export interface PersistentStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

interface PersistentCacheOptions<Args extends unknown[]> {
  storage: PersistentStorage;
  key: (...args: Args) => string;
}

export function withPersistentCache<Args extends unknown[], Result>(
  load: (...args: Args) => Promise<Result>,
  { storage, key }: PersistentCacheOptions<Args>,
) {
  const loadings = new Map<string, Promise<Result | null>>();

  const loadAndSave = (cacheKey: string, args: Args) => {
    const loading = load(...args)
      .then(async (result) => {
        if (result != null) {
          trySave(storage, cacheKey, result);
        }
        return result;
      })
      .catch((error) => {
        loadings.delete(cacheKey);
        throw error;
      });

    loadings.set(cacheKey, loading);
    return loading;
  };

  return async (...args: Args): Promise<Result> => {
    const cacheKey = key(...args);
    const stored = await tryReadStored<Result>(storage, cacheKey);
    if (stored == null) return loadAndSave(cacheKey, args);

    if (!loadings.has(cacheKey)) loadAndSave(cacheKey, args).catch(() => {});
    return stored;
  };
}

async function tryReadStored<Result>(
  storage: PersistentStorage,
  cacheKey: string,
): Promise<Result | null> {
  try {
    const text = await storage.get(cacheKey);
    return text == null ? null : (JSON.parse(text) as Result);
  } catch {
    return null;
  }
}

async function trySave(
  storage: PersistentStorage,
  cacheKey: string,
  result: unknown,
) {
  try {
    await storage.set(cacheKey, JSON.stringify(result));
  } catch {
    return;
  }
}
