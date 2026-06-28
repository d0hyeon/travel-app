import {
  useQuery as useBaseQuery,
  type QueryFunction,
  type UseQueryOptions as _UseQueryOptions,
  type UseQueryResult as BaseUseQueryResult,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query'
import { useSuspenseQuery } from './useSuspenseQuery';
import { useMemo } from 'react';

// _UseQueryOptions.queryFn 은 skipToken 값을 허용하지만 useSuspenseQuery 는 받지 않는다.
// skipToken 은 키가 아니라 값이므로 queryFn 자체를 좁혀 제거한다.
type BaseUseQueryOptions<QueryData, Error, Data, QueryKey extends readonly unknown[]> = Omit<
  _UseQueryOptions<QueryData, Error, Data, QueryKey>,
  'queryFn'
> & {
  queryFn?: QueryFunction<QueryData, QueryKey>
}

export interface UseQueryOptions<T, Error, Data = T, QueryKey extends readonly unknown[] = unknown[]> extends BaseUseQueryOptions<T, Error, Data, QueryKey> {
  suspense?: boolean;
}


export function useQuery<T, Error, Data = T, QueryKey extends readonly unknown[] = unknown[]>(
  options: Omit<UseQueryOptions<T, Error, Data, QueryKey>, 'suspense'> & { suspense: true }
): UseSuspenseQueryResult<Data, Error>;

export function useQuery<T, Error, Data = T, QueryKey extends readonly unknown[] = unknown[]>(
  options: UseQueryOptions<T, Error, Data, QueryKey>
): BaseUseQueryResult<Data, Error>;

export function useQuery<T, Error, Data = T, QueryKey extends readonly unknown[] = unknown[]>(
  options: UseQueryOptions<T, Error, Data, QueryKey>
) {
  const isSuspense = useMemo(() => options.suspense ?? false, []);

  const suspenseQuery = useSuspenseQuery({
    ...options,
    enabled: isSuspense,
  })

  const asyncQuery = useBaseQuery({
    ...options,
    enabled: !isSuspense,
  })

  if (isSuspense) return suspenseQuery

  return asyncQuery;
}