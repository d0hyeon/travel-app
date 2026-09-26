import { useFocusEffect } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { Suspense, useCallback, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TicketStep } from './steps/TicketStep'
import { TransportStep } from './steps/TransportStep'
import { TypeStep } from './steps/TypeStep'
import { TransportFormFunnelHeader } from './TransportFormFunnelHeader'
import type { TransportTicketDraft } from '../transport-ticket/transportTicket.types'
import type { TransportFormValues } from '../../../transport/transport-form/transportForm.types'

// 퍼널을 자체 스택으로 세운다. 부모 스택에서 이 화면은 엔트리 하나이므로
// 소비자가 replace 한 번만 해도 스텝 전체가 함께 걷힌다.
const Funnel = createNativeStackNavigator()

export type TransportSubmitValues = TransportFormValues & {
  type: TripTransportType
  tickets: TransportTicketDraft[]
}

interface Props {
  tripId: string
  isSubmitting?: boolean
  error?: unknown
  onStepChange?: (step: string) => void
  onSubmit: (value: TransportSubmitValues) => void
}

export function TransportFormFunnel({
  tripId,
  isSubmitting,
  error,
  onStepChange,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets()
  // 포커스된 스텝이 자기 navigation 을 올린다. 헤더가 셸에 있어 직접 참조할 수 없다.
  const goBackRef = useRef<() => void>(() => { })
  const [type, setType] = useState<TripTransportType>()
  const [detail, setDetail] = useState<Partial<TransportFormValues>>()
  // 프로그레스바는 스텝을 넘어 살아있어야 차오르는 모션이 나온다.
  // 헤더는 스텝마다 새로 마운트되므로 여기서 그린다.
  const [step, setStep] = useState<string>('type')

  const handleStepFocus = useCallback(
    (next: string, goBack: () => void) => {
      goBackRef.current = goBack
      setStep(next)
      onStepChange?.(next)
    },
    [onStepChange],
  )

  const submitWith = (tickets: TransportTicketDraft[]) => {
    if (type == null || detail == null) return
    onSubmit({ ...(detail as TransportFormValues), tickets, type })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {error != null && (
        <View style={styles.errorNotice}>
          <Typography color="error">
            {error instanceof Error ? error.message : '탑승권을 등록하지 못했어요'}
          </Typography>
        </View>
      )}
      <TransportFormFunnelHeader step={step} onBack={() => goBackRef.current()} />
      <Funnel.Navigator
        initialRouteName="type"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          // 헤더는 셸이 그리므로 화면만 밀린다. 진행률은 제자리에서 차오른다.
          animation: 'slide_from_right',
        }}
      >
        <Funnel.Screen name="type" options={{ title: '종류 선택' }}>
          {({ navigation }) => (
            <StepBoundary step="type" goBack={navigation.goBack} onFocus={handleStepFocus}>
              <TypeStep
                defaultValue={type}
                onNext={(next) => {
                  setType(next)
                  navigation.navigate('detail')
                }}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>

        <Funnel.Screen name="detail" options={{ title: '탑승권 정보' }}>
          {({ navigation }) =>
            type == null ? null : (
              <StepBoundary step="detail" goBack={navigation.goBack} onFocus={handleStepFocus}>
                <TransportStep
                  type={type}
                  defaultValues={detail}
                  onNext={(value) => {
                    setDetail(value)
                    navigation.navigate('ticket')
                  }}
                />
              </StepBoundary>
            )
          }
        </Funnel.Screen>

        <Funnel.Screen name="ticket" options={{ title: '탑승권 등록' }}>
          {({ navigation }) => (
            <StepBoundary step="ticket" goBack={navigation.goBack} onFocus={handleStepFocus}>
              <TicketStep
                tripId={tripId}
                type={type}
                isSubmitting={isSubmitting}
                onSkip={() => submitWith([])}
                onSubmit={submitWith}
              />
            </StepBoundary>
          )}
        </Funnel.Screen>
      </Funnel.Navigator>
    </View>
  )
}

// Navigator 바깥에서는 현재 스텝도 뒤로가기도 잡을 수 없어 스텝이 스스로 올린다.
interface StepBoundaryProps {
  step: string
  goBack: () => void
  onFocus: (step: string, goBack: () => void) => void
  children: React.ReactNode
}

function StepBoundary({ step, goBack, onFocus, children }: StepBoundaryProps) {
  useFocusEffect(useCallback(() => onFocus(step, goBack), [step, goBack, onFocus]))
  return <Suspense fallback={<ActivityIndicator style={styles.loading} />}>{children}</Suspense>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  errorNotice: { padding: 12, backgroundColor: palette.errorContainer },
  loading: { flex: 1 },
})
