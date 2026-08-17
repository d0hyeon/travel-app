import {
  useQuery as useBaseQuery,
  type QueryFunction,
  type UseQueryOptions as _UseQueryOptions,
  type UseQueryResult as BaseUseQueryResult,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";
import { useSuspenseQuery } from "./useSuspenseQuery";
import { useState } from "react";

// _UseQueryOptions.queryFn 은 skipToken 값을 허용하지만 useSuspenseQuery 는 받지 않는다.
// skipToken 은 키가 아니라 값이므로 queryFn 자체를 좁혀 제거한다.
type BaseUseQueryOptions<
  QueryData,
  Error,
  Data,
  QueryKey extends readonly unknown[],
> = Omit<_UseQueryOptions<QueryData, Error, Data, QueryKey>, "queryFn"> & {
  queryFn?: QueryFunction<QueryData, QueryKey>;
};

export interface UseQueryOptions<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
> extends BaseUseQueryOptions<T, Error, Data, QueryKey> {
  suspense?: boolean;
}

export function useQuery<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: Omit<UseQueryOptions<T, Error, Data, QueryKey>, "suspense"> & {
    suspense: true;
  },
): UseSuspenseQueryResult<Data, Error>;

export function useQuery<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: UseQueryOptions<T, Error, Data, QueryKey>,
): BaseUseQueryResult<Data, Error>;

export function useQuery<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
>(options: UseQueryOptions<T, Error, Data, QueryKey>) {
  // suspense 는 마운트 시점에 고정되므로 렌더마다 훅 순서가 바뀌지 않는다.
  // 두 훅을 함께 마운트하면 suspense: false 여도 useSuspenseQuery 가 살아있어,
  // queryKey 가 바뀔 때마다 데이터 없는 새 키로 suspend 한다.
  const [isSuspense] = useState(() => options.suspense ?? false);

  if (isSuspense) {
    // suspense 분기는 항상 활성이고, 데이터가 준비될 때까지 suspend 하므로
    // placeholder 를 보여줄 순간이 없다. 두 옵션 모두 이 분기에서는 의미가 없어 제외한다.
    const {
      enabled: _enabled,
      placeholderData: _placeholderData,
      ...suspenseOptions
    } = options;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery<T, Error, Data, QueryKey>(suspenseOptions);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useBaseQuery(options);
}
