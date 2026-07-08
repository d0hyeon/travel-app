import { arrayIncludes, type ValueOf } from "./types";

export function reverseKeyValue<T extends Record<string | number, string | number>>(
  value: T
) {
  return Object.fromEntries(
    Object.entries(value).map(([key, value]) => ([value, key]))
  ) as Record<ValueOf<T>, keyof T>;
}

export function arraySplit<T>(array: T[], condition: (item: T) => boolean): [T[], T[]] { 
  return array.reduce<[T[], T[]]>((acc, item) => {
    if (condition(item)) {
      acc[0].push(item);
    } else {
      acc[1].push(item);
    }
    
    return acc;
  }, [[], []])
}

export function omit<T extends Record<any, any>, Key extends keyof T>(obj: T, keys: Key[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !arrayIncludes(keys, key))
  ) as Omit<T, Key>;
}