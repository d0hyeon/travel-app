import { Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Box, CircularProgress, Container, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { lazy } from '~shared/lib/react'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { SwitchCase } from '~shared/components/SwitchCase'
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
  info: '여행 이름과 멤버를 입력해주세요',
}

export default function TripCreatePage() {
  const navigate = useNavigate()
  const { create } = useTrips()

  const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'destination' })
  const currentIndex = STEPS.indexOf(step as Step)

  const [destination, setDestination] = useState<Destination | null>(null)
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  // 이전 스텝 상태 없이 직접 접근하면 처음으로 돌려보냄
  useEffect(() => {
    if (step === 'date' && destination === null) {
      setStep('destination')
    }
    if (step === 'info' && (destination === null || dateRange === null)) {
      setStep(destination === null ? 'destination' : 'date')
    }
  }, [step])

  const goBack = () => {
    const prev = STEPS[currentIndex - 1]
    if (prev) setStep(prev)
    else navigate('/')
  }

  const handleDestinationNext = (dest: Destination) => {
    setDestination(dest)
    setStep('date')
  }

  const handleDateNext = (start: string, end: string) => {
    setDateRange([start, end])
    setStep('info')
  }

  const handleInfoNext = async (name: string, memberNames: string[]) => {
    if (!destination || !dateRange) return
    const trip = await create({
      name: name || `${destination.name} 여행`,
      destination: destination.name,
      lat: destination.lat,
      lng: destination.lng,
      startDate: dateRange[0],
      endDate: dateRange[1],
      isOverseas: isOverseasByCoordinate(destination.lat, destination.lng),
      exchangeRate: null,
      exchangeRates: null,
      memberNames,
    })
    navigate(`/trip/${trip.id}`)
  }

  return (
    <Box minHeight="100dvh" display="flex" flexDirection="column">
      <Container maxWidth="sm" disableGutters sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* 헤더 */}
        <Stack direction="row" alignItems="center" px={1} pt={1.5} spacing={1}>
          <IconButton onClick={goBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            <LinearProgress
              variant="determinate"
              value={((currentIndex + 1) / STEPS.length) * 100}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" minWidth={28} textAlign="right">
            {currentIndex + 1}/{STEPS.length}
          </Typography>
        </Stack>

        {/* 타이틀 */}
        <Box px={3} pt={3} pb={2}>
          <Typography variant="h6" fontWeight="bold">
            {STEP_LABELS[step as Step]}
          </Typography>
        </Box>

        {/* 스텝 컨텐츠 */}
        <Box flex={1}>
          <Suspense fallback={<Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>}>
            <SwitchCase
              value={step as Step}
              cases={{
                destination: () => (
                  <DestinationStep defaultValue={destination} onNext={handleDestinationNext} />
                ),
                date: () => (
                  <DateStep defaultValue={dateRange} onNext={handleDateNext} />
                ),
                info: () => destination && (
                  <InfoStep destination={destination.name} onNext={handleInfoNext} />
                ),
              }}
            />
          </Suspense>
        </Box>
      </Container>
    </Box>
  )
}
