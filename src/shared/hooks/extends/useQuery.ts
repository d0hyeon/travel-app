import {
  useQuery as useBaseQuery,
  type DefaultError,
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

// _UseQueryOptions.enabled 는 함수 형태도 허용하지만 useSuspenseQuery 는 boolean 만 받는다.
// suspense 오버로드에서만 좁히고, useBaseQuery 분기의 함수 형태는 그대로 둔다.
//
// queryFn 을 직접 선언해 반환 타입에서 Data 를 추론한다.
// Omit 으로 감싼 인터페이스만 넘기면 queryFn 과 Data 의 연결이 끊겨 any 로 떨어진다.
type SuspenseQueryOptions<
  Data,
  Error,
  QueryKey extends readonly unknown[],
> = Omit<
  UseQueryOptions<Data, Error, Data, QueryKey>,
  "suspense" | "enabled" | "queryFn" | "placeholderData"
> & {
  suspense: true;
  queryFn: QueryFunction<Data, QueryKey>;
};

export function useQuery<
  Data,
  Error = DefaultError,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: SuspenseQueryOptions<Data, Error, QueryKey> & {
    enabled?: true;
  },
): UseSuspenseQueryResult<Data, Error>;

// enabled 가 꺼지는 구간에는 데이터가 없다. placeholderData 가 그 자리를 채운다.
export function useQuery<
  Data,
  Error = DefaultError,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: SuspenseQueryOptions<Data, Error, QueryKey> & {
    enabled: boolean;
    placeholderData: Data;
  },
): UseSuspenseQueryResult<Data, Error>;

export function useQuery<
  Data,
  Error = DefaultError,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: SuspenseQueryOptions<Data, Error, QueryKey> & {
    enabled: boolean;
  },
): UseSuspenseQueryResult<Data | undefined, Error>;

// suspense 를 런타임 값으로 넘기는 래퍼용. 어느 분기로 갈지 타입만으로 알 수 없어
// 데이터 유무를 보장하지 않는다.
export function useQuery<
  Data,
  Error = DefaultError,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: Omit<
    UseQueryOptions<Data, Error, Data, QueryKey>,
    "suspense" | "queryFn" | "enabled"
  > & {
    suspense: boolean;
    queryFn: QueryFunction<Data, QueryKey>;
    // suspense 분기로 갈 수 있으므로 함수 형태는 허용하지 않는다.
    enabled?: boolean;
  },
): BaseUseQueryResult<Data, Error>;

// suspense: true 를 제외해, 위 오버로드에 맞지 않는 suspense 호출이
// 조용히 이쪽으로 흘러내리지 않게 한다.
export function useQuery<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
>(
  options: UseQueryOptions<T, Error, Data, QueryKey> & {
    suspense?: false;
  },
): BaseUseQueryResult<Data, Error>;

export function useQuery<
  T,
  Error,
  Data = T,
  QueryKey extends readonly unknown[] = unknown[],
>(
  // 오버로드가 호출부를 이미 검증한다. 구현부는 두 분기를 모두 받도록 넓게 둔다.
  options: UseQueryOptions<T, Error, Data, QueryKey>,
) {
  // suspense 는 마운트 시점에 고정되므로 렌더마다 훅 순서가 바뀌지 않는다.
  // 두 훅을 함께 마운트하면 suspense: false 여도 useSuspenseQuery 가 살아있어,
  // queryKey 가 바뀔 때마다 데이터 없는 새 키로 suspend 한다.
  const [isSuspense] = useState(() => options.suspense ?? false);

  if (isSuspense) {
    // suspense 오버로드는 enabled 를 boolean, placeholderData 를 값으로만 받는다.
    // 함수 형태는 useBaseQuery 분기에서만 도달하므로 여기서는 버린다.
    const { enabled, placeholderData, ...rest } = options;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery<T, Error, Data, QueryKey>({
      ...rest,
      enabled: typeof enabled === "boolean" ? enabled : undefined,
      placeholderData:
        typeof placeholderData === "function" ? undefined : placeholderData,
    });
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useBaseQuery(options);
}
