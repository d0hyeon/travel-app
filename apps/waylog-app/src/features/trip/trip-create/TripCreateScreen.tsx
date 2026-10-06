import { MaterialIcons } from '@expo/vector-icons'
import { createNativeStackNavigator, type NativeStackHeaderProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import { useTrips } from '@waylog/domains/modules/trip'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Alert, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, LinearProgress, Stack, Typography } from '~shared/components/design-system'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { palette } from '~shared/config/tokens'
import { DateStep } from './DateStep'
import { DestinationStep, type Destination } from './DestinationStep'
import { InfoStep } from './InfoStep'

export type TripCreateParams = Record<string, never>

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_생성]: TripCreateParams
  }
}

const STEPS = ['destination', 'date', 'info'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS: Record<Step, string> = {
  destination: '어디로 떠나시나요?',
  date: '언제 떠나시나요?',
  info: '여행 이름을 입력해주세요',
}

// 퍼널을 자체 스택으로 세운다. 부모 스택에서 이 화면은 엔트리 하나이므로
// 생성 후 replace 한 번만 해도 스텝 전체가 함께 걷힌다.
const Funnel = createNativeStackNavigator()

export function TripCreateScreen() {
  const navigation = useAppNavigation()
  const { create } = useTrips()
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<Step>('destination')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  // 두 스택에 제스처를 함께 열어두면 같은 스와이프를 다투어 스텝 백과 퍼널 이탈이 번갈아 일어난다.
  // 첫 스텝에서만 부모가 받는다.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === 'destination' })
  }, [navigation, step])

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
      navigation.replace(AppRoute.여행_상세, { tripId: trip.id })
    } catch (error) {
      console.error('여행 생성 실패:', error)
      Alert.alert(
        '여행 생성에 실패했어요',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return (
    <Box style={[styles.screen, { paddingTop: insets.top }]}>
      <Funnel.Navigator
        initialRouteName="destination"
        screenOptions={{
          header: (props) => <TripCreateHeader {...props} />,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Funnel.Screen name="destination">
          {({ navigation: funnel }) => (
            <StepBoundary step="destination" onFocus={setStep}>
              <DestinationStep
                defaultValue={destinations}
                onNext={(next) => {
                  setDestinations(next)
                  funnel.navigate('date')
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
        <Funnel.Screen name="date">
          {({ navigation: funnel }) => (
            <StepBoundary step="date" onFocus={setStep}>
              <DateStep
                defaultValue={dateRange}
                onNext={(start, end) => {
                  setDateRange([start, end])
                  funnel.navigate('info')
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
        <Funnel.Screen name="info">
          {() => (
            <StepBoundary step="info" onFocus={setStep}>
              {destinations.length > 0 && (
                <InfoStep
                  destination={destinations.map((d) => d.name).join(', ')}
                  onNext={handleInfoNext}
                />
              )}
            </StepBoundary>
          )}
        </Funnel.Screen>
      </Funnel.Navigator>
    </Box>
  )
}

// Navigator 바깥에서는 현재 스텝을 읽을 수 없어 스텝이 스스로 알린다.
function StepBoundary({
  step,
  onFocus,
  children,
}: {
  step: Step
  onFocus: (step: Step) => void
  children: React.ReactNode
}) {
  useFocusEffect(useCallback(() => onFocus(step), [step, onFocus]))
  return <>{children}</>
}

function TripCreateHeader({ navigation, route }: NativeStackHeaderProps) {
  const currentIndex = STEPS.findIndex((step) => step === route.name)

  return (
    <Box>
      <Stack direction="row" alignItems="center" style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로가기"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <Typography variant="body2" style={styles.stepLabel}>
          여행 계획 세우기
        </Typography>
      </Stack>
      <LinearProgress value={((currentIndex + 1) / STEPS.length) * 100} />
      <Box style={styles.actions}>
        <Typography variant="h6">{STEP_LABELS[STEPS[currentIndex]]}</Typography>
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: 12, paddingVertical: 8 },
  backButton: { padding: 4 },
  stepLabel: { paddingHorizontal: 8 },
  actions: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
})
