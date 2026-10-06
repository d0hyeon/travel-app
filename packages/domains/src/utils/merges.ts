import type { UseSuspenseQueryResult } from '@tanstack/react-query'

type ExtractData<T extends readonly UseSuspenseQueryResult<unknown>[]> = {
  [K in keyof T]: T[K] extends UseSuspenseQueryResult<infer D> ? D : never;
};

interface MergedQueryStatus {
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  error: Error | null;
}
interface MergedQueryResult<R> extends MergedQueryStatus {
  data: R;
}

export function mergeQueriesResults<
  const T extends readonly UseSuspenseQueryResult<unknown>[],
  R,
>(queries: T, selector: (data: ExtractData<T>) => R): MergedQueryResult<R> {
  const isLoading = queries.some((q) => q.isLoading);
  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);
  const isFetching = queries.some((q) => q.isFetching);
  const isSuccess = queries.every((q) => q.isSuccess);
  const error = (queries.find((q) => q.error)?.error as Error) ?? null;

  const dataArray = queries.map((q) => q.data) as ExtractData<T>;
  const data = selector(dataArray);

  return { data, isLoading, isPending, isError, error, isFetching, isSuccess };
}

export function mergeQueriesStatus(
  ...queries: readonly Omit<UseSuspenseQueryResult<unknown>, 'data'>[]
): MergedQueryStatus {
  return {
    isLoading: queries.some((q) => q.isLoading),
    isPending: queries.some((q) => q.isPending),
    isError: queries.some((q) => q.isError),
    isFetching: queries.some((q) => q.isFetching),
    isSuccess: queries.every((q) => q.isSuccess),
    error: (queries.find((q) => q.error)?.error as Error) ?? null,
  };
}