import { use, useMemo, useRef, useSyncExternalStore } from "react";

type CleanUpFn = () => void;
type Listener = () => void;
type SetState<T> = (prev: T) => T;

interface BaseStore<T> {
  setState: (nextState: T | SetState<T>) => void;
  subscribe: (observer: () => void) => CleanUpFn;
}

interface DefaultStore<T> extends BaseStore<T> {
  getState: () => T;
  resolved: true;
  promise: null;
}

interface AsyncResolvedStore<T> extends BaseStore<T> {
  getState: () => T;
  resolved: true;
  promise: null;
}
interface AsyncPendingStore<T> extends BaseStore<T> {
  getState: () => null;
  resolved: false;
  promise: Promise<void>;
}
type AsyncStore<T> = AsyncPendingStore<T> | AsyncResolvedStore<T>;

type Store<T> = AsyncStore<T> | DefaultStore<T>;
type InitialState<T> = T | Promise<T> | (() => T | Promise<T>);

export function createStore<T>(initialState: InitialState<T>): Store<T> {
  const listeners = new Set<Listener>();

  let state: T | Promise<T>;
  let initialized = false;

  // initialState 를 즉시 실행하지 않는다. 모듈 로드 시점에 실행되면
  // 앱이 아직 초기화하지 않은 자원(supabase 클라이언트 등)에 접근하게 된다.
  // 첫 구독이나 첫 조회가 일어날 때 시작한다.
  function initialize() {
    if (initialized) return;
    initialized = true;
    state = initialState instanceof Function ? initialState() : initialState;

    if (state instanceof Promise) {
      promise = state.then((value) => {
        resolvedState = value;
        resolved = true;
        promise = null;
      });
    } else {
      resolvedState = state;
      resolved = true;
    }
  }

  let resolvedState: T | null = null;
  let resolved = false;
  let promise: Promise<void> | null = null;

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    get resolved() {
      initialize();
      return resolved;
    },
    get promise() {
      initialize();
      return promise;
    },
    getState: () => {
      initialize();
      return resolvedState;
    },
    setState: (nextState: T | SetState<T>) => {
      initialize();
      if (nextState instanceof Function) {
        if (!resolved) throw new Error("초기화가 완료되지 않았습니다.");
        resolvedState = nextState(resolvedState as T);
      } else {
        resolvedState = nextState;
      }
      resolved = true;
      notify();
    },
    subscribe: (listener: Listener) => {
      initialize();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } as Store<T>;
}

export function useStoreValue<T, V = T>(
  store: Store<T>,
  selector?: (state: T) => V,
) {
  const getValue = selector ?? ((state) => state);
  if (!store.resolved) use(store.promise);
  const lastStateRef = useRef<V | T | null>(null);

  return useSyncExternalStore(store.subscribe, () => {
    if (!store.resolved) throw new Error("초기화가 완료되지 않았습니다.");
    const currState = getValue(store.getState());
    if (isPrimitive(currState)) return currState;

    const prevState = lastStateRef.current;
    if (currState === prevState) return prevState;

    lastStateRef.current = currState;
    return currState;
  });
}

export function useSetStoreValue<T>(store: Store<T>) {
  return store.setState;
}

export function useStoreState<T>(store: Store<T>) {
  const state = useStoreValue(store);
  const setState = useSetStoreValue(store);

  return useMemo(() => [state, setState] as const, [state]);
}

function isPrimitive(value: unknown): value is number | string | boolean {
  if (Array.isArray(value) || value instanceof Object) {
    return false;
  }

  return true;
}
export const useStore = useStoreState;
