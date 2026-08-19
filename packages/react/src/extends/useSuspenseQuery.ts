import {
  type DefaultError,
  type QueryKey,
  useSuspenseQuery as _useSuspenseQuery,
  type UseSuspenseQueryOptions as _UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
  type UseBaseQueryOptions,
} from "@tanstack/react-query";

// 비활성 상태의 캐시를 실제 데이터와 분리하기 위한 키 접두사
const DISABLED_QUERY_KEY = ["DISABLED"] as const;

export type BaseQueryOptions<
  QueryData = unknown,
  QueryError = Error,
  Data = QueryData,
  Key extends QueryKey = QueryKey,
> = UseBaseQueryOptions<QueryData, QueryError, Data, Key>;

export type UseSuspenseQueryOptions<
  QueryData = unknown,
  QueryError = Error,
  Data = QueryData,
  Key extends QueryKey = QueryKey,
> = _UseSuspenseQueryOptions<QueryData, QueryError, Data, Key> & {
  enabled?: boolean;
  // enabled: false 일 때 queryFn 이 돌려줄 대체 값. suspense 쿼리에는 원래 없는 옵션이라
  // 이 래퍼가 자체적으로 정의한다.
  // queryFn 의 반환값 자리에 들어가므로 select 이후 타입(Data)이 아닌 QueryData 다.
  placeholderData?: QueryData;
};

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & {
    enabled: false;
    placeholderData: Data;
  },
): UseSuspenseQueryResult<Data, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & {
    enabled: false;
  },
): UseSuspenseQueryResult<undefined, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & {
    enabled: true;
  },
): UseSuspenseQueryResult<Data, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & {
    enabled: boolean;
  },
): UseSuspenseQueryResult<Data | undefined, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key>,
): UseSuspenseQueryResult<Data, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>({
  queryKey,
  queryFn,
  enabled = true,
  placeholderData,
  ...options
}: UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key>) {
  // 비활성 상태는 실제 데이터가 아닌 placeholder 를 캐시에 쓴다.
  // 같은 키를 공유하면 enabled 가 꺼질 때 받아둔 데이터를 placeholder 가 덮어쓰므로 키를 분리한다.
  const resolvedQueryKey = enabled
    ? queryKey
    : ([...DISABLED_QUERY_KEY, ...queryKey] as unknown as Key);

  const result = _useSuspenseQuery<QueryFnData, QueryError, Data, Key>({
    queryKey: resolvedQueryKey,
    queryFn: enabled
      ? queryFn
      : () =>
          Promise.resolve((placeholderData ?? null) as unknown as QueryFnData),
    ...options,
  });

  if (enabled) return result;

  return {
    ...result,
    data: result.data ?? undefined,
    isLoading: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isPending: false,
    isError: false,
    isFetching: false,
    isPaused: true,
    fetchStatus: "idle",
  } as UseSuspenseQueryResult<Data | undefined, QueryError>;
}
