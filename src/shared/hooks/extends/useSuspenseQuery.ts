import {
  type DefaultError,
  type QueryKey,
  useSuspenseQuery as _useSuspenseQuery,
  type UseSuspenseQueryOptions as _UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
  type UseBaseQueryOptions,
} from '@tanstack/react-query';

export type BaseQueryOptions<
  QueryData = unknown,
  QueryError = Error,
  Data = QueryData,
  Key extends QueryKey = QueryKey,
> = Pick<
  UseBaseQueryOptions<QueryData, QueryError, Data, Key>,
  'gcTime' | 'retryOnMount' | 'retry' | 'retryDelay' | 'notifyOnChangeProps' | 'throwOnError'
> & {
  refetchInterval?: Exclude<UseBaseQueryOptions['refetchInterval'], Function>;
  refetchIntervalInBackground?: Exclude<UseBaseQueryOptions['refetchIntervalInBackground'], Function>;
  refetchOnWindowFocus?: Exclude<UseBaseQueryOptions['refetchOnWindowFocus'], Function>;
  staleTime?: Exclude<UseBaseQueryOptions['staleTime'], Function>;
  refetchOnMount?: Exclude<UseBaseQueryOptions['refetchOnMount'], Function>;
};

export type UseSuspenseQueryOptions<
  QueryData = unknown,
  QueryError = Error,
  Data = QueryData,
  Key extends QueryKey = QueryKey,
> = _UseSuspenseQueryOptions<QueryData, QueryError, Data, Key> & {
  enabled?: boolean;
  placeholderData?: Data;
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
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & { enabled: false },
): UseSuspenseQueryResult<undefined, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & { enabled: true },
): UseSuspenseQueryResult<Data, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(
  options: _UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key> & { enabled: boolean },
): UseSuspenseQueryResult<Data | undefined, QueryError>;

export function useSuspenseQuery<
  QueryFnData = unknown,
  QueryError = DefaultError,
  Data = QueryFnData,
  Key extends QueryKey = QueryKey,
>(options: UseSuspenseQueryOptions<QueryFnData, QueryError, Data, Key>): UseSuspenseQueryResult<Data, QueryError>;

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
  const result = _useSuspenseQuery<QueryFnData, QueryError, Data, Key>({
    queryKey: enabled ? queryKey : (DISABLED_QUERY_KEY as Key),
    queryFn: enabled ? queryFn : () => Promise.resolve((placeholderData ?? null) as unknown as QueryFnData),
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
    fetchStatus: 'idle',
  } as UseSuspenseQueryResult<Data | undefined, QueryError>;
}

const DISABLED_QUERY_KEY: QueryKey = ['DISABLED'];
