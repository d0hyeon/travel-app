import { createContext, use, useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useBatchedCallback } from '~shared/hooks/useBatchedCallback';
import { assert } from '~shared/utils/types';
import type { MarkerData } from './types';

interface ClusterContextValue {
  registryRef: React.RefObject<Map<string, MarkerData>>;
  version: number;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
}

const ClusterContext = createContext<ClusterContextValue | null>(null);

export function useClusterRegistry() {
  const context = use(ClusterContext);
  assert(!!context, 'context가 초기화되지 않았습니다.');

  const { registerMarker, unregisterMarker } = context;
  return { registerMarker, unregisterMarker };
}

export function useRegisteredMarker() {
  const context = use(ClusterContext);
  assert(!!context, 'context가 초기화되지 않았습니다.');

  const { version, registryRef } = context;
  return { version, data: registryRef.current };
}

export function ClusterProvider({ children }: PropsWithChildren) {
  const registryRef = useRef<Map<string, MarkerData>>(new Map());
  const [version, setVersion] = useState(0);

  const incrementVersion = useBatchedCallback(() => {
    setVersion(curr => curr + 1);
  });

  const registerMarker = useCallback((data: MarkerData) => {
    registryRef.current.set(data.id, data);
    incrementVersion();
  }, []);

  const unregisterMarker = useCallback((id: string) => {
    registryRef.current.delete(id);
    incrementVersion();
  }, []);

  const value = useMemo(() => (
    { registryRef, version, registerMarker, unregisterMarker }
  ), [version]);

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
}
