import { updateUserProfile, userProfileKey, type UserProfileUpdate } from '@waylog/domains/modules/user-profile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bridgeClient } from '~shared/bridge/bridgeClient'

export function useUpdateUserProfile(userId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (patch: UserProfileUpdate) => updateUserProfile(userId, patch),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [userProfileKey, userId] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      await bridgeClient.refetchQueries({ queryKeys: [[userProfileKey, userId], ['user', userId]] }).catch(() => undefined)
    },
  })

  return Object.assign(mutation.mutateAsync, mutation)
}
