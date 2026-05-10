import { Box, CircularProgress, Container } from '@mui/material'
import { Suspense, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { createPhotoFileFromUrl, uploadPostPhoto } from '~features/photo/photo.api'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { lazy } from '~shared/utils/react'
import { useCreatePost } from '../usePost'
import type { MetaStepValue } from './MetaStep'
import { isLocalDraftPostPhoto, type DraftPostPhoto } from './postDraftPhoto'
import { PostFormStepHeader, type PostFormStep } from './PostFormStepHeader'
import { usePostForm } from './usePostForm'

const TripStep = lazy(async () => {
  const { TripStep } = await import('./TripStep')
  return { default: TripStep }
})

const PhotoStep = lazy(async () => {
  const { PhotoStep } = await import('./PhotoStep')
  return { default: PhotoStep }
})

const MetaStep = lazy(async () => {
  const { MetaStep } = await import('./MetaStep')
  return { default: MetaStep }
})

type Step = PostFormStep

const FULL_STEPS = ['trip', 'photo', 'meta'] as const satisfies readonly PostFormStep[]
const SKIP_TRIP_STEPS = ['photo', 'meta'] as const satisfies readonly PostFormStep[]


export default function PostFormPage() {
  const navigate = useNavigate()
  const { mutateAsync: createPost } = useCreatePost()

  const [searchParams] = useSearchParams()
  const initialTripId = searchParams.get('tripId')
  const skipTripStep = initialTripId != null
  const steps = skipTripStep ? SKIP_TRIP_STEPS : FULL_STEPS

  const [step, setStep] = useQueryParamState<Step>('step', {
    defaultValue: skipTripStep ? 'photo' : 'trip',
  });
  const [tripId, setTripId] = useState<string | null>(initialTripId)

  const { form, update, submit } = usePostForm({
    onSubmit: async (value) => {
      const isPublic = value.visibility !== 'PRIVATE'
      const uploadedPhotos = await Promise.all(
        value.photos.map(async (photo) => {
          const file = isLocalDraftPostPhoto(photo)
            ? photo.file
            : await createPhotoFileFromUrl(photo.url, `${photo.id}.jpg`)
          const { url, storagePath } = await uploadPostPhoto(tripId, file)
          return { url, storagePath, placeId: photo.placeId, isPublic }
        }),
      )

      const post = await createPost({
        tripId,
        description: value.description,
        visibility: value.visibility,
        placeIds: value.places.map((p) => p.placeId),
        photos: uploadedPhotos,
      })
      navigate(`/post/${post.id}`)
    }
  });

  const handleTripNext = (id: string | null) => {
    setTripId(id)
    setStep('photo', { replace: false })
  }

  const handlePhotoNext = (photos: DraftPostPhoto[]) => {
    update({ photos })
    setStep('meta', { replace: false })
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <PostFormStepHeader step={step as Step} steps={steps} />

        <Box>
          <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>}>
            <SwitchCase
              value={step as Step}
              cases={{
                trip: () => <TripStep defaultValue={tripId} onNext={handleTripNext} />,
                photo: () => (
                  <PhotoStep
                    tripId={tripId}
                    defaultValue={form.photos ?? []}
                    onNext={handlePhotoNext}
                  />
                ),
                meta: () => !!form.photos && (
                  <MetaStep
                    tripId={tripId}
                    selectedPhotos={form.photos}
                    onNext={(values: MetaStepValue) => {
                      update(values);
                      submit();
                    }}
                  />
                ),
              }}
            />
          </Suspense>
        </Box>
      </Container>
    </Box>
  )
}
