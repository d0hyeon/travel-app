import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { Alert, AlertTitle, Box, CircularProgress, Container, IconButton, Stack, Typography } from '@mui/material'
import { Suspense, useState, type PropsWithChildren } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { createPhotoFileFromUrl, updatePhotoVisibility, uploadPostPhoto } from '~features/photo/photo.api'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { lazy } from '~shared/utils/react'
import { useCreatePost } from '../usePost'
import type { MetaStepValue } from './MetaStep'
import { isLocalDraftPostPhoto, type DraftPostPhoto } from './postDraftPhoto'
import { PostVisibility } from '../post.types'
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



const STEPS = ['trip', 'photo', 'meta'] as const;
type Step = typeof STEPS[number];



const STEP_TITLE: Record<Step, string> = {
  trip: '여행 선택',
  photo: '이미지 선택',
  meta: '상세 설정',
}

export default function PostFormPage() {
  const navigate = useNavigate()
  const { mutateAsync: createPost } = useCreatePost()

  const [searchParams] = useSearchParams()
  const initialTripId = searchParams.get('tripId')
  const skipTripStep = initialTripId != null
  const steps = initialTripId != null
    ? STEPS.filter(x => x !== 'trip')
    : STEPS

  const [step, setStep] = useQueryParamState<Step>('step', {
    defaultValue: skipTripStep ? 'photo' : 'trip',
  });
  const [tripId, setTripId] = useState<string | null>(initialTripId)
  const stepIndex = steps.findIndex(x => x === step);

  const { form, error, update, submit } = usePostForm({
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

      if (value.visibility === PostVisibility.PUBLIC) {
        value.photos
          .filter((photo) => photo.source === 'saved')
          .forEach((photo) => publishPhoto(photo.id))
      }

      await navigate(`/post/${post.id}`, { replace: true })
    }
  });

  const handleTripNext = (id: string | null) => {
    setTripId(id)
    setStep('photo')
  }

  const handlePhotoNext = (photos: DraftPostPhoto[]) => {
    update({ photos })
    setStep('meta')
  }


  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <TopNavigation>
          <IconButton
            sx={{ width: 36, height: 36 }}
            aria-label="뒤로"
            onClick={() => {
              if (stepIndex <= 0) {
                return navigate(-1);
              }
              setStep(steps[stepIndex - 1]);
            }}
          >
            <ChevronLeftIcon sx={{ color: '#111', strokeWidth: 1.8 }} />
          </IconButton>
          <Box flex={1} minWidth={0}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: '#9b9ba3', mb: '2px' }}>
              새 포스트 · {stepIndex + 1}/{steps.length}
            </Typography>
            <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: '#111' }}>
              {STEP_TITLE[step]}
            </Typography>
          </Box>

          <Stack direction="row" gap="4px" alignItems="center">
            {steps.map((s, idx) => {
              const isCurrent = idx === stepIndex
              const isDone = idx < stepIndex
              return (
                <Box
                  key={s}
                  sx={{
                    width: isCurrent ? 16 : 6,
                    height: 6,
                    borderRadius: '3px',
                    bgcolor: isCurrent || isDone ? 'primary.main' : 'rgba(0,0,0,0.12)',
                    transition: 'all .2s',
                  }}
                />
              )
            })}
          </Stack>
        </TopNavigation>

        <Box>
          {!!error && (
            <Alert color="error" >
              <AlertTitle>에러가 발생했어요!</AlertTitle>

              <Typography variant="caption">{JSON.stringify(error)}</Typography>
            </Alert>
          )}
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
                      return submit();
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

function TopNavigation(props: PropsWithChildren) {
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={20}
      sx={{
        height: 64,
        px: 2,
        py: '14px',
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} height="100%">
        {props.children}
      </Stack>
    </Box>
  )
}

function publishPhoto(photoId: string) {
  updatePhotoVisibility(photoId, true)
}