import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { LinearProgress, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TRANSPORT_FORM_STEPS, type TransportFormStep } from './transportFormFunnel.types'

const STEP_TITLE: Record<string, string> = {
  type: '종류 선택',
  detail: '교통편 정보',
  ticket: '탑승권 등록',
}

interface Props {
  step: string
  onBack: () => void
}

// 퍼널 셸이 그린다. 스텝 화면마다 헤더를 따로 그리면 매번 새로 마운트되어
// 프로그레스바에 이전 값이 없고, 차오르는 모션이 나오지 않는다.
export function TransportFormFunnelHeader({ step, onBack }: Props) {
  const stepIndex = TRANSPORT_FORM_STEPS.indexOf(step as TransportFormStep)

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={28} color={palette.text} />
        </Pressable>
        <View style={styles.heading}>
          <Typography style={styles.stepLabel}>
            교통편 · {stepIndex + 1}/{TRANSPORT_FORM_STEPS.length}
          </Typography>
          <Typography style={styles.title}>{STEP_TITLE[step] ?? ''}</Typography>
        </View>
        <View style={styles.progress}>
          {TRANSPORT_FORM_STEPS.map((formStep, index) => (
            <View
              key={formStep}
              style={[
                styles.progressStep,
                {
                  width: index === stepIndex ? 16 : 6,
                  backgroundColor: index <= stepIndex ? palette.primary : 'rgba(0,0,0,0.12)',
                },
              ]}
            />
          ))}
        </View>
      </View>
      <LinearProgress value={((stepIndex + 1) / TRANSPORT_FORM_STEPS.length) * 100} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.background,
  },
  heading: { flex: 1 },
  stepLabel: { fontSize: 11.5, color: palette.textSecondary },
  title: { fontSize: 17, fontWeight: '700' },
  progress: { flexDirection: 'row', gap: 4 },
  progressStep: { height: 6, borderRadius: 3 },
})
