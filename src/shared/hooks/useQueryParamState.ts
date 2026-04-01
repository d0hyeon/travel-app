import { useCallback, useMemo } from "react";
import { useSearchParams, type NavigateOptions } from "~shared/modules/useSearchParams";

interface OptionWithDefault<T> {
  parse?: (value: string) => T;
  defaultValue: T | (() => T);
}

interface Options<T> {
  parse?: (value?: string) => T;
  defaultValue?: T | (() => T);
}

type Dispatch<A> = (value: A, options?: NavigateOptions) => void;


export function useQueryParamState<T>(key: string, options: OptionWithDefault<T>): [T, Dispatch<T>];
export function useQueryParamState<T>(key: string, options?: Options<T>): [T | undefined, Dispatch<T | undefined>]

export function useQueryParamState<T>(key: string, { defaultValue, parse }: Options<T> | OptionWithDefault<T> = { }) {
  const [searchParams, setParams] = useSearchParams();
  const param = searchParams.get(key);

  const value = useMemo(() => {
    if (param != null) {
      if (parse != null) return parse(param);
      return param;
    }
    if (defaultValue instanceof Function) {
      return defaultValue();
    }
    return defaultValue;
  }, [param]);

  const setValue = useCallback((value: T, options?: NavigateOptions) => {
    setParams((searchParams) => { 
      if (value == null) {
        if(searchParams.has(key)) searchParams.delete(key);
      } else {
        searchParams.set(key, value.toString());
      }
      return searchParams;
    }, { replace: true, ...options });
  }, [setParams]);

  return [value, setValue] as const;
}