import { PostVisibility } from '@waylog/domains/modules/post'
import { usePreservedCallback } from '@waylog/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { PostFormValues } from './postFormFunnel.types'

const EMPTY_VALUES: PostFormValues = {
  tripId: null,
  photos: [],
  places: [],
  visibility: PostVisibility.PUBLIC,
  description: '',
}

interface UsePostFormOptions {
  defaultValue?: Partial<PostFormValues>
  onSubmit: (value: PostFormValues) => Promise<void>
}

export function usePostForm({ defaultValue, onSubmit }: UsePostFormOptions) {
  const [error, setError] = useState<unknown>(null)
  const handleSubmit = usePreservedCallback(onSubmit)

  const { getValues, reset, handleSubmit: submitWithValidation } = useForm<PostFormValues>({
    defaultValues: { ...EMPTY_VALUES, ...defaultValue },
  })

  // getValues 는 구독하지 않으므로 갱신을 직접 알린다.
  const [, setVersion] = useState(0)

  const update = (patch: Partial<PostFormValues>) => {
    reset({ ...getValues(), ...patch })
    setVersion((current) => current + 1)
  }

  const submit = submitWithValidation(async (values) => {
    try {
      await handleSubmit(values)
    } catch (cause) {
      setError(cause)
    }
  })

  return { values: getValues(), error, update, submit }
}
