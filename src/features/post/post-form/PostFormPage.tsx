import { Box, CircularProgress, Container, LinearProgress, Typography } from '@mui/material'
import { Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getAuth } from '~features/auth/useAuth'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { lazy } from '~shared/utils/react'
import type { MetaStepValue } from './MetaStep'
import { useCreatePost } from '../usePost'

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

const STEPS = ['trip', 'photo', 'meta'] as const
type Step = typeof STEPS[number]

const STEP_LABELS: Record<Step, string> = {
  trip: '어떤 여행에 대한 포스트인가요?',
  photo: '담을 사진을 골라주세요',
  meta: '한 줄 적어주세요',
}

export default function PostFormPage() {
  const navigate = useNavigate()
  const auth = getAuth()
  const { mutateAsync: createPost } = useCreatePost()

  const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'trip' })
  const currentIndex = STEPS.indexOf(step as Step)

  const [tripId, setTripId] = useState<string | null>(null)
  const [photoIds, setPhotoIds] = useState<string[]>([])

  // 비정상 진입(직접 URL 이동) 방지
  useEffect(() => {
    if (step === 'photo' && tripId == null) setStep('trip')
    if (step === 'meta' && (tripId == null || photoIds.length === 0)) {
      setStep(tripId == null ? 'trip' : 'photo')
    }
  }, [step])

  const handleTripNext = (id: string) => {
    setTripId(id)
    setStep('photo', { replace: false })
  }

  const handlePhotoNext = (ids: string[]) => {
    setPhotoIds(ids)
    setStep('meta', { replace: false })
  }

  const handleSubmit = async (value: MetaStepValue) => {
    if (!auth || !tripId) return
    try {
      const post = await createPost({
        authorId: auth.id,
        tripId,
        title: value.title || null,
        description: value.description || null,
        scope: value.scope,
        visibility: value.visibility,
        photoIds,
        coverPhotoId: value.coverPhotoId,
      })
      navigate(`/post/${post.id}`)
    } catch (e) {
      console.error('포스트 생성 실패:', e)
      alert('포스트 생성에 실패했어요: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box position="sticky" top={0} bgcolor="background.paper" zIndex={10}>
          <TopNavigation position="relative">
            <Typography variant="body2">새 포스트</Typography>
          </TopNavigation>
          <LinearProgress
            variant="buffer"
            value={((currentIndex + 1) / STEPS.length) * 100}
            sx={{
              borderRadius: 1,
              height: 2,
              '.MuiLinearProgress-bar': { transitionDuration: '0.3s', transitionTimingFunction: 'ease-in-out' },
            }}
          />
        </Box>

        <Box>
          <Box px={3} pt={3} pb={2}>
            <Typography variant="h6">{STEP_LABELS[step as Step]}</Typography>
          </Box>
          <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>}>
            <SwitchCase
              value={step as Step}
              cases={{
                trip: () => <TripStep defaultValue={tripId} onNext={handleTripNext} />,
                photo: () => tripId && (
                  <PhotoStep tripId={tripId} defaultValue={photoIds} onNext={handlePhotoNext} />
                ),
                meta: () => tripId && photoIds.length > 0 && (
                  <MetaStep tripId={tripId} photoIds={photoIds} onSubmit={handleSubmit} />
                ),
              }}
            />
          </Suspense>
        </Box>
      </Container>
    </Box>
  )
}
