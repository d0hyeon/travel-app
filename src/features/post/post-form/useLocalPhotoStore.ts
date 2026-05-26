import { useCallback, useSyncExternalStore } from "react";
import type { DraftPostPhoto } from "./postDraftPhoto";
import { heicTo, isHeic } from "heic-to";

interface LocalPhoto {
  file: File;
  url: string;
}

const photoStore = new Set<LocalPhoto>();
const observers = new Set<VoidFunction>();

const disposeRegistry = new FinalizationRegistry((item: LocalPhoto) => {
  URL.revokeObjectURL(item.url);
})

export function useLocalPhotoStore() {
  const data = useSyncExternalStore(
    (subscribe) => {
      observers.add(subscribe);
      return () => observers.delete(subscribe)
    },
    () => photoStore,
  );

  const save = useCallback(async (files: File[]) => {
    const result = await Promise.all(files.map(async (_file) => {
      const file = await isHeic(_file)
        ? new File([await heicTo({ blob: _file, type: 'image/jpeg' })], _file.name)
        : _file
      

      const item = { file, url: URL.createObjectURL(file) };
      disposeRegistry.register(photoStore, item);
      photoStore.add(item);
      return item;
    }));
    observers.values().forEach(observer => observer());

    return result;
  }, [])


  return { data: Array.from(data), save };
}
