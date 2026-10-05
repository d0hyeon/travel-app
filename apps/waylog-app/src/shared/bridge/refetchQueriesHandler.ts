import type { RefetchQueriesParams } from '@waylog/bridge/contract'
import { queryClient } from '~shared/query-client'

export async function refetchBridgeQueries({ queryKeys }: RefetchQueriesParams): Promise<void> {
  const uniqueQueryKeys = Array.from(new Map(queryKeys.map((queryKey) => [JSON.stringify(queryKey), queryKey])).values())
  await Promise.all(uniqueQueryKeys.map((queryKey) => queryClient.refetchQueries({ queryKey, exact: true, type: 'all' })))
}
