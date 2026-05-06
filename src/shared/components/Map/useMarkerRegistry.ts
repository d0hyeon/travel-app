import { useCallback, useRef, useState } from 'react';
import type { MarkerData } from './types';

export function useMarkerRegistry() {
  const registryRef = useRef<Map<string, MarkerData>>(new Map());
  const [version, setVersion] = useState(0);

  const registerMarker = useCallback((data: MarkerData) => {
    registryRef.current.set(data.id, data);
    setVersion(v => v + 1);
  }, []);

  const unregisterMarker = useCallback((id: string) => {
    registryRef.current.delete(id);
    setVersion(v => v + 1);
  }, []);
  

  return { registryRef, version, registerMarker, unregisterMarker };
}
