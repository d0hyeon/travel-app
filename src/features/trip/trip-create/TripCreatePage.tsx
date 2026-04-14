import { Box, CircularProgress, Container, LinearProgress, Typography } from '@mui/material'
import { Suspense, useEffect, useState } from 'react'
import { PrefetchPageLinks, useNavigate } from 'react-router'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { lazy } from '~shared/utils/react'
import { useTrips } from '../useTrips'
import type { Destination } from './DestinationStep'

const DestinationStep = lazy(async () => {
  const { DestinationStep } = await import('./DestinationStep')
  return { default: DestinationStep }
})

const DateStep = lazy(async () => {
  const { DateStep } = await import('./DateStep')
  return { default: DateStep }
})

const InfoStep = lazy(async () => {
  const { InfoStep } = await import('./InfoStep')
  return { default: InfoStep }
})

const STEPS = ['destination', 'date', 'info'] as const
type Step = typeof STEPS[number]

const STEP_LABELS: Record<Step, string> = {
  destination: '어디로 떠나시나요?',
  date: '언제 떠나시나요?',
  info: '여행 이름을 입력해주세요',
}

export default function TripCreatePage() {
  const navigate = useNavigate()
  const { create } = useTrips()

  const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'destination' })
  const currentIndex = STEPS.indexOf(step as Step)

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  // 이전 스텝 상태 없이 직접 접근하면 처음으로 돌려보냄
  useEffect(() => {
    if (step === 'date' && destinations.length === 0) {
      setStep('destination')
    }
    if (step === 'info' && (destinations.length === 0 || dateRange === null)) {
      setStep(destinations.length === 0 ? 'destination' : 'date')
    }
  }, [step])

  const handleDestinationNext = (dests: Destination[]) => {
    setDestinations(dests)
    setStep('date', { replace: false })
  }

  const handleDateNext = (start: string, end: string) => {
    setDateRange([start, end])
    setStep('info', { replace: false })
  }

  const handleInfoNext = async (name: string) => {
    if (destinations.length === 0 || !dateRange) return
    const primary = destinations[0]
    try {
      const trip = await create({
        name: name || `${destinations.map(d => d.name).join(', ')} 여행`,
        destinations: destinations.map(d => d.name),
        lat: primary.lat,
        lng: primary.lng,
        startDate: dateRange[0],
        endDate: dateRange[1],
        exchangeRate: null,
        exchangeRates: null,
      })
      navigate(`/trip/${trip.id}`)
    } catch (e) {
      console.error('여행 생성 실패:', e)
      alert('여행 생성에 실패했어요: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column" overflow="auto">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* 헤더 */}
        <Box position="sticky" top={0} bgcolor="background.paper" zIndex={10}>
          <TopNavigation position="relative">
            <Typography variant="body2">
              여행 계획 세우기
            </Typography>
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
        <PrefetchPageLinks page={`/trip/:tripId`} />
        {/* 스텝 컨텐츠 */}
        <Box >
          {/* 타이틀 */}
          <Box px={3} pt={3} pb={4}>
            <Typography variant="h6">
              {STEP_LABELS[step as Step]}
            </Typography>
          </Box>
          <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>}>
            <SwitchCase
              value={step as Step}
              cases={{
                destination: () => (
                  <DestinationStep defaultValue={destinations} onNext={handleDestinationNext} />
                ),
                date: () => (
                  <DateStep defaultValue={dateRange} onNext={handleDateNext} />
                ),
                info: () => destinations.length > 0 && (
                  <InfoStep destination={destinations.map(d => d.name).join(', ')} onNext={handleInfoNext} />
                ),
              }}
            />
          </Suspense>
        </Box>
      </Container>
    </Box>
  )
}
