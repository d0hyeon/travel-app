import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signUp } from '../../modules/user-profile'
import { assert } from '../../utils'
import { AuthError } from './AuthError'
import { useAuth, usePendingSignUp } from './useAuth'

export function useSignUp() {
  const queryClient = useQueryClient()
  const pendingUser = usePendingSignUp()

  const mutation = useMutation({
    mutationFn: () => {
      assert(pendingUser != null, new AuthError())
      return signUp(pendingUser)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: useAuth.key(pendingUser?.id) }),
  })

  return Object.assign(mutation.mutateAsync, mutation)
}
