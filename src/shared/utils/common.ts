import type { ValueOf } from "./types";

export function reverseKeyValue<T extends Record<string | number, string | number>>(
  value: T
) {
  return Object.fromEntries(
    Object.entries(value).map(([key, value]) => ([value, key]))
  ) as Record<ValueOf<T>, keyof T>;
}