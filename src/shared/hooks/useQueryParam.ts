import { useSearchParams } from "react-router-dom";

interface OptionWithDefault<T> {
  parse?: (value: string) => T;
  defaultValue: T;
}

interface Options<T> {
  parse?: (value?: string) => T;
  defaultValue?: T;
}

export function useQueryParam<T>(key: string, options: OptionWithDefault<T>): T;
export function useQueryParam<T>(key: string, options?: Options<T>): T | undefined

export function useQueryParam<T>(key: string, { defaultValue, parse }: Options<T> | OptionWithDefault<T> = { }) {
  const [searchParams] = useSearchParams();
  const value = searchParams.get(key);

  if (value != null && !!parse) {
    return parse(value);
  }
  return value ?? defaultValue;
}