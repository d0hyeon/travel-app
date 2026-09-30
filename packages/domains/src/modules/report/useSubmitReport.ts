import { useMutation } from '@tanstack/react-query'
import { submitReport } from './report.api'

export function useSubmitReport() {
  const mutation = useMutation({ mutationFn: submitReport })

  return Object.assign(mutation.mutateAsync, mutation)
}
