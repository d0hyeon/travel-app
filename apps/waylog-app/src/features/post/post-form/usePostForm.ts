import { PostVisibility } from '@waylog/domains/modules/post'
import { assert } from '@waylog/utility'
import { usePreservedCallback, useVariation } from '@waylog/react'
import { useCallback, useState } from 'react'
import type { DraftPostPhoto, PostPlaceSelection } from './postForm.types'

export type PostFormValues = {
  photos: DraftPostPhoto[]
  visibility: PostVisibility
  places: PostPlaceSelection[]
  description: string
}

interface UsePostFormOptions {
  onSubmit: (value: PostFormValues) => void | Promise<void>
}

export function usePostForm(options: UsePostFormOptions) {
  const [getForm, setForm] = useVariation<Partial<PostFormValues>>({
    photos: [],
    visibility: PostVisibility.PUBLIC,
    places: [],
    description: '',
  })
  const [, setVersion] = useState(0)
  const [error, setError] = useState<null | unknown>(null)
  const getIsValid = useCallback(() => Object.values(getForm()).every((value) => value != null), [])

  const update = useCallback((values: Partial<PostFormValues>) => {
    const prev = getForm()
    setForm({ ...prev, ...values })
    setVersion((version) => version + 1)
  }, [])

  const handleSubmit = usePreservedCallback(options.onSubmit)
  const submit = useCallback(async () => {
    assert(getIsValid(), '값이 누락 되었습니다.')
    try {
      await handleSubmit(getForm() as PostFormValues)
    } catch (cause) {
      setError(cause)
    }
  }, [])

  return {
    form: getForm(),
    isValid: getIsValid(),
    error,
    update,
    submit,
  }
}
