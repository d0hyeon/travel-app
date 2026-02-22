import type { UseSuspenseQueryResult } from "@tanstack/react-query";

type Ref<T> = (node: T | null) => void;
export function mergeRef<T>(...refs: Ref<T>[]) {
  return (node: T | null) => {
    if (node != null) {
      refs.forEach((setRef) => setRef(node));
    }
  };
}

export function mergeProps<T extends Record<string, any>>(base: T, override: Partial<T>) {
  return Object.entries(override).reduce((acc, [key, value]) => {
    if (value instanceof Function) {
      const originMethod = acc[key] as Function;
      const overridedMethod = (...args: any) => {
        originMethod?.(...args);
        return value?.(...args);
      };

      return { ...acc, [key]: overridedMethod };
    }

    return { ...acc, [key]: value };
  }, base);
}

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