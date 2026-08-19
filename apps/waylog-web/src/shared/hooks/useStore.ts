import { useMemo, useRef, useSyncExternalStore } from "react";

type CleanUpFn = VoidFunction;
type Listener = () => void;
type SetState<T> = (prev: T) => T;


interface Store<T> {
  getState: () => T;
  setState: (nextState: T | SetState<T>) => void;
  subscribe: (observer: () => void) => CleanUpFn;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (nextState: T | ((state: T) => T)) => { 
      if (nextState instanceof Function) {
        state = nextState(state);
      } else { 
        state = nextState;
      }
      listeners.forEach(listener => {
        listener()
      })
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  }
}

export function useStore<T>(store: Store<T>): [T, (nextStae: T) => void] {
  const accessedKeysRef = useRef(new Set<keyof T>());
  const lastStateRef = useRef(store.getState());

  const state = useSyncExternalStore(
    store.subscribe,
    () => {
      const currState = store.getState();
      if (isPrimitive(currState)) return currState;

      const prevState = lastStateRef.current;
      const accessedKeys = Array.from(accessedKeysRef.current.values());
      const changed = accessedKeys.some(key => prevState[key] !== currState[key]);

      lastStateRef.current = currState;

      if (!changed) return prevState;
      return currState;
    }
  )


  return useMemo(() => {
    if (state instanceof Object) {
      const trackingState = new Proxy(state, {
        get: (target, key) => {
          accessedKeysRef.current.add(key as keyof T);
          return target[key as keyof typeof target];
        },
      })

      return [trackingState, store.setState] as const;
    }
    
    return [state, store.setState] as const;
  }, [state])
}

function isPrimitive(value: unknown): value is number | string | boolean { 
  if (Array.isArray(value) || value instanceof Object) {
    return false;
  }

  return true;
}