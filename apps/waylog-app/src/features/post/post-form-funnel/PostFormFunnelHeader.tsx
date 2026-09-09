import { MaterialIcons } from '@expo/vector-icons'
import type { NativeStackHeaderProps } from '@react-navigation/native-stack'
import { Pressable, View } from 'react-native'
import { LinearProgress, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { POST_FORM_STEPS, type PostFormStep } from './postFormFunnel.types'

interface Props extends NativeStackHeaderProps {
  startStep: PostFormStep
}

export function PostFormFunnelHeader({ navigation, route, options, startStep }: Props) {
  // 건너뛴 스텝은 진행률에서도 빠져야 1/2, 2/2 로 읽힌다.
  const steps = POST_FORM_STEPS.slice(POST_FORM_STEPS.indexOf(startStep))
  const stepIndex = steps.findIndex((step) => step === route.name)

  return (
    <View>
      <View style={{ height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: palette.divider, backgroundColor: palette.background }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={28} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Typography sx={{ fontSize: 11.5, color: palette.textSecondary }}>새 포스트 · {stepIndex + 1}/{steps.length}</Typography>
          <Typography sx={{ fontSize: 17, fontWeight: '700' }}>{options.title}</Typography>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {steps.map((step, index) => (
            <View key={step} style={{ width: index === stepIndex ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: index <= stepIndex ? palette.primary : 'rgba(0,0,0,0.12)' }} />
          ))}
        </View>
      </View>
      <LinearProgress value={((stepIndex + 1) / steps.length) * 100} />
    </View>
  )
}
