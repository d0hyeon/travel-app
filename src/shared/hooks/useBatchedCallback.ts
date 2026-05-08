import { useCallback, useRef } from 'react';
import { usePreservedCallback } from './extends/usePreservedCallback';

interface Options {
  once?: boolean;
}

export function useBatchedCallback<T = never>(onFlush: (items: T[]) => void, { once = false }: Options = {}) {
  const itemsRef = useRef<T[]>([]);
  const scheduledIdRef = useRef<number | null>(null);
  const flushedRef = useRef(false);

  const preservedCallback = usePreservedCallback(onFlush);

  const collect = useCallback((...args: [T] extends [never] ? [] : [item: T]) => {
    if (once && flushedRef.current) return;

    if (args.length > 0) itemsRef.current.push(args[0] as T);

    if (scheduledIdRef.current) cancelAnimationFrame(scheduledIdRef.current);
    scheduledIdRef.current = requestAnimationFrame(() => {
      scheduledIdRef.current = null;
      const items = itemsRef.current;
      itemsRef.current = [];
      if (once) flushedRef.current = true;
      preservedCallback(items);
    });
  }, [once]);

  return collect;
}
