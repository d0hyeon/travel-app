import { useCallback, useMemo, type Dispatch } from "react";
import { useSearchParams } from "react-router-dom";

interface OptionWithDefault<T> {
  parse?: (value: string) => T;
  defaultValue: T;
}

interface Options<T> {
  parse?: (value?: string) => T;
  defaultValue?: T;
}



export function useQueryParamState<T>(key: string, options: OptionWithDefault<T>): [T, Dispatch<T>];
export function useQueryParamState<T>(key: string, options?: Options<T>): [T | undefined, Dispatch<T | undefined>]

export function useQueryParamState<T>(key: string, { defaultValue, parse }: Options<T> | OptionWithDefault<T> = { }) {
  const [searchParams, setParams] = useSearchParams();
  const param = searchParams.get(key);

  const value = useMemo(() => {
    if (param != null && !!parse) {
      return parse(param);
    }
    return param ?? defaultValue;
  }, [param, defaultValue]);

  const setValue = useCallback((value: T) => {
    if (value == null) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value.toString());
    }

    setParams(searchParams);
  }, [value, searchParams]);

  return [value, setValue] as const;

}