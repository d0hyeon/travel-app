import { createContext, startTransition, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams as useRouterSearchParams, type NavigateOptions as RouterNavigateOptions } from "react-router";
import { useVariation } from "~shared/hooks/useVariation";
import { assert } from "~shared/utils/assert";

type NextValue = URLSearchParams | ((curr: URLSearchParams) => URLSearchParams)
export type NavigateOptions = RouterNavigateOptions;
type Setter = (next: NextValue, options?: NavigateOptions) => void;

const SearchParamsContext = createContext<readonly [URLSearchParams, Setter] | null>(null);

export function SearchParamProvider({ children }: PropsWithChildren) {
  const [searchParams, updateSearchParams] = useRouterSearchParams();
  const [requestCount, setRequestCount] = useState(0);

  const [getSearchParams, requestUpdateSearchParams] = useVariation(searchParams);
  const [getOptions, setOptions] = useVariation<NavigateOptions | undefined>(undefined);
  useEffect(() => {
    if (searchParams !== getSearchParams()) {
      requestUpdateSearchParams(searchParams);
    }
  }, [searchParams])


  const setSearchParams = useCallback((params: NextValue, options?: NavigateOptions) => {
    const prevParams = getSearchParams();
    const prevOptions = getOptions();

    const nextParams = params instanceof Function
      ? params(prevParams)
      : params;

    requestUpdateSearchParams(
      toSearchParams({
        ...toObject(prevParams),
        ...toObject(nextParams)
      })
    )
    setOptions(mergeOptions(prevOptions, options));
    setRequestCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (requestCount === 0) return;
    const params = getSearchParams();
    const options = getOptions();

    startTransition(() => {
      updateSearchParams(params, options);
      setRequestCount(0);
      setOptions(undefined);
    })
  }, [requestCount])


  const value = useMemo(() => [searchParams, setSearchParams] as const, [searchParams])

  return (
    <SearchParamsContext.Provider value={value}>
      {children}
    </SearchParamsContext.Provider>
  )
}

export function useSearchParams() {
  const context = use(SearchParamsContext);

  assert(context != null, 'context가 초기화 되지 않았습니다.');
  return context;
}

const toObject = (params: URLSearchParams) => {
  return Object.fromEntries(params.entries());
}
const toSearchParams = (value: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(value).forEach(([k, v]) => {
    params.set(k, v);
  })
  return params;
}

const mergeOptions = <Curr extends NavigateOptions, Next extends NavigateOptions>(
  curr?: Curr,
  next?: Next
) => {
  if (curr == null && next == null) return;
  if (curr == null) return next;
  if (next == null) return curr;

  return Object.entries(next).reduce<Curr & Next>((result, [key, value]) => {
    if (typeof value === 'boolean') {
      // @ts-ignore;
      const prev = result[key] ?? false;
      return {
        ...result,
        [key]: value && prev,
      }
    }
    return { ...result, [key]: value }
  }, curr as Curr & Next)
}