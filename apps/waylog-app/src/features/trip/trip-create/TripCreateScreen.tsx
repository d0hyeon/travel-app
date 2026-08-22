import { useTrips } from '@waylog/domains/modules/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, LinearProgress, Stack, Typography } from '../../../shared/components/mui'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { palette } from '../../../shared/config/tokens'
import { DateStep } from './DateStep'
import { DestinationStep, type Destination } from './DestinationStep'
import { InfoStep } from './InfoStep'

const STEPS = ['destination', 'date', 'info'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS: Record<Step, string> = {
  destination: '어디로 떠나시나요?',
  date: '언제 떠나시나요?',
  info: '여행 이름을 입력해주세요',
}

export function TripCreateScreen() {
  const router = useRouter()
  const { create } = useTrips()
  const insets = useSafeAreaInsets()

  const [step, setStep] = useQueryParamState<Step>('step', { defaultValue: 'destination' })
  const currentIndex = STEPS.indexOf(step)

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

  const handleDestinationNext = (nextDestinations: Destination[]) => {
    setDestinations(nextDestinations)
    setStep('date')
  }

  const handleDateNext = (start: string, end: string) => {
    setDateRange([start, end])
    setStep('info')
  }

  const handleInfoNext = async (name: string) => {
    if (destinations.length === 0 || !dateRange) return
    const primary = destinations[0]

    try {
      const trip = await create({
        name: name || `${destinations.map((d) => d.name).join(', ')} 여행`,
        destinations: destinations.map((d) => d.name),
        lat: primary.lat,
        lng: primary.lng,
        startDate: dateRange[0],
        endDate: dateRange[1],
        exchangeRate: null,
        exchangeRates: null,
      })
      router.replace(`/trip/${trip.id}`)
    } catch (error) {
      console.error('여행 생성 실패:', error)
      Alert.alert(
        '여행 생성에 실패했어요',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top }}>
      <Stack direction="row" alignItems="center" sx={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={() => router.back()}
          style={{ padding: 4 }}
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Typography variant="body2" sx={{ paddingHorizontal: 8 }}>
          여행 계획 세우기
        </Typography>
      </Stack>
      <LinearProgress value={((currentIndex + 1) / STEPS.length) * 100} />

      <Box sx={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
        <Typography variant="h6">{STEP_LABELS[step]}</Typography>
      </Box>

      {step === 'destination' && (
        <DestinationStep defaultValue={destinations} onNext={handleDestinationNext} />
      )}
      {step === 'date' && <DateStep defaultValue={dateRange} onNext={handleDateNext} />}
      {step === 'info' && destinations.length > 0 && (
        <InfoStep
          destination={destinations.map((d) => d.name).join(', ')}
          onNext={handleInfoNext}
        />
      )}
    </Box>
  )
}
