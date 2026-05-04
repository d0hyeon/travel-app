import type { ValueOf } from "./types";

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