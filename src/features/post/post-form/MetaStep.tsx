import { Box, Button, Stack } from '@mui/material'
import { useMemo, useState, useTransition } from 'react'
import { useTripPhotos } from '~features/trip/trip-photo/useTripPhotos'
import { BottomArea } from '~shared/components/BottomArea'
import { PostVisibility, type PostScope } from '../post.types'
import { suggestScope } from '../post.utils'
import { PostDescriptionField } from './PostDescriptionField'
import { PostScopeField } from './PostScopeField'
import { PostTitleField } from './PostTitleField'
import { PostVisibilityField } from './PostVisibilityField'

export interface MetaStepValue {
  title: string
  description: string
  scope: PostScope | null
  visibility: PostVisibility
  coverPhotoId: string | null
}

interface Props {
  tripId: string
  photoIds: string[]
  onSubmit: (value: MetaStepValue) => void | Promise<void>
}

export function MetaStep({ tripId, photoIds, onSubmit }: Props) {
  const { data: photos } = useTripPhotos(tripId)
  const selectedPhotos = useMemo(
    () => photoIds.map(id => photos.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => p != null),
    [photoIds, photos],
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<PostScope | null>(() => suggestScope(selectedPhotos))
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PRIVATE)

  const [isPending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        scope,
        visibility,
        coverPhotoId: photoIds[0] ?? null,
      })
    })
  }

  return (
    <>
      <Box px={3} pb={`${BOTTOM_AREA_HEIGHT + 16}px`}>
        <Stack spacing={3}>
          <PostTitleField value={title} onChange={setTitle} />
          <PostDescriptionField value={description} onChange={setDescription} />
          <PostScopeField tripId={tripId} value={scope} onChange={setScope} />
          <PostVisibilityField
            value={visibility}
            onChange={setVisibility}
            hasTripContext={tripId != null}
          />
        </Stack>
      </Box>

      <BottomArea>
        <Button
          variant="contained"
          fullWidth
          size="large"
          loading={isPending}
          onClick={submit}
        >
          게시
        </Button>
      </BottomArea>
    </>
  )
}

const BOTTOM_AREA_HEIGHT = 64
