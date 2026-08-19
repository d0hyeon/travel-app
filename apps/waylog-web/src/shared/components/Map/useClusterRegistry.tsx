import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type DependencyList, type PropsWithChildren } from 'react';
import { useBatchedCallback } from '~shared/hooks/useBatchedCallback'
import { assert } from '~shared/utils/types';
import type { MarkerData } from './types';

interface ClusterContextValue {
  version: number;
  getRegistry: () => Map<string, MarkerData>;
  registerMarker: (data: Omit<MarkerData, 'id'>) => string;
  unregisterMarker: (id: string) => void;
}

const ClusterContext = createContext<ClusterContextValue | null>(null);

function useClusterRegistry() {
  const context = use(ClusterContext);
  assert(!!context, 'context가 초기화되지 않았습니다.');

  const { registerMarker, unregisterMarker } = context;
  return { registerMarker, unregisterMarker };
}

export function useRegisterClusterMarker(
  props: Omit<MarkerData, 'id'>,
  dependencies?: DependencyList
) {
  const { registerMarker, unregisterMarker } = useClusterRegistry();

  useEffect(() => {
    const id = registerMarker(props);

    return () => unregisterMarker(id);
  }, dependencies)
}

export function useRegisteredMarker() {
  const context = use(ClusterContext);
  assert(!!context, 'context가 초기화되지 않았습니다.');

  const { version, getRegistry } = context;
  // version을 key로 삼아 Map 스냅샷을 반환 — Ref 참조 동일성 문제로 useMemo가 깨지지 않던 버그 수정
  const snapshot = useMemo(() => new Map(getRegistry()), [version]);
  return { version, data: snapshot };
}

export function ClusterProvider({ children }: PropsWithChildren) {
  const registryRef = useRef<Map<string, MarkerData>>(new Map());
  const [version, setVersion] = useState(0);

  const incrementVersion = useBatchedCallback(() => {
    setVersion(curr => curr + 1);
  });

  const registerMarker = useCallback((data: Omit<MarkerData, 'id'>) => {
    const id = `${data.position.lat}:${data.position.lng}`
    registryRef.current.set(id, { ...data, id });
    incrementVersion();

    return id;
  }, []);

  const unregisterMarker = useCallback((id: string) => {
    registryRef.current.delete(id);
    incrementVersion();
  }, []);

  const getRegistry = useCallback(() => registryRef.current, [])

  const value = useMemo(() => (
    { version, getRegistry, registerMarker, unregisterMarker }
  ), [version]);

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
}
