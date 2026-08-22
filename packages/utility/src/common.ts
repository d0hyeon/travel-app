import type { ValueOf } from './utility.types'

export function reverseKeyValue<T extends Record<string | number, string | number>>(value: T) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [item, key])) as Record<ValueOf<T>, keyof T>;
}

export function arrayIncludes<T>(value: T[] | readonly T[], item: unknown): item is T {
  return value.includes(item as T);
}

export function arraySplit<T>(array: T[], condition: (item: T) => boolean): [T[], T[]] {
  return array.reduce<[T[], T[]]>((acc, item) => {
    acc[condition(item) ? 0 : 1].push(item);
    return acc;
  }, [[], []])
}

export function omit<T extends Record<any, any>, Key extends keyof T>(obj: T, keys: Key[]) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !arrayIncludes(keys, key))) as Omit<T, Key>;
}

export function assert(value: boolean, fallback: string | Error = 'Value is required'): asserts value {
  if (value) return;
  throw typeof fallback === 'string' ? new Error(fallback) : fallback;
}
