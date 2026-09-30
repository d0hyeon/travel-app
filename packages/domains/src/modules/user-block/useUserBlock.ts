import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { postKey } from '../post'
import { blockUser, getBlockedUsers, unblockUser, userBlockKey } from './userBlock.api'

export function useBlockedUsers() {
  return useSuspenseQuery({
    queryKey: [userBlockKey],
    queryFn: getBlockedUsers,
  })
}

function useRefreshAfterBlockChange() {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [userBlockKey] }),
      queryClient.invalidateQueries({ queryKey: [postKey] }),
    ])
  }
}

export function useBlockUser() {
  const refresh = useRefreshAfterBlockChange()
  const mutation = useMutation({ mutationFn: blockUser, onSuccess: refresh })

  return Object.assign(mutation.mutateAsync, mutation)
}

export function useUnblockUser() {
  const refresh = useRefreshAfterBlockChange()
  const mutation = useMutation({ mutationFn: unblockUser, onSuccess: refresh })

  return Object.assign(mutation.mutateAsync, mutation)
}
