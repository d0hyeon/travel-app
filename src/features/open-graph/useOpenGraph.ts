import { useSuspenseQuery } from '@tanstack/react-query';
import { readOpenGraph } from './openGraph.api';



export function useOpenGraph(url: string) {
  return useSuspenseQuery({
    queryKey: useOpenGraph.key(url),
    queryFn: () => readOpenGraph(url!),
    staleTime: Infinity,
    retry: false,
  })
}

useOpenGraph.key = (url: string) => [readOpenGraph.path, url];
