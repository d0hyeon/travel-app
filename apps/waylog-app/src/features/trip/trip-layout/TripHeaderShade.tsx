import MaskedView from '@react-native-masked-view/masked-view'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

const SHADE_COLORS = [
  'rgba(0,0,0,0.1)',
  'rgba(0, 0, 0, 0.08)',
  'rgba(0, 0, 0, 0.02)',
  'rgba(0,0,0,0)',
] as const
const SHADE_LOCATIONS = [0, 0.5, 0.8, 1] as const

const BLUR_MASK_COLORS = [
  'rgba(0,0,0,0.9)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.1)',
  'rgba(0,0,0,0)',
] as const
const BLUR_MASK_LOCATIONS = [0, 0.5, 0.9, 1] as const
const BLUR_INTENSITY = 30

const SHADE_OVERHANG = 15

interface Props {
  progress: SharedValue<number>
}

/** 화면 최상단부터 제목 아래까지 깔리는 그라데이션 그림자와, 아래로 갈수록 옅어지는 블러. */
export function TripHeaderShade({ progress }: Props) {
  const shadeStyle = useAnimatedStyle(() => ({ opacity: progress.get() }))

  return (
    <Animated.View pointerEvents="none" style={[styles.shade, shadeStyle]}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={BLUR_MASK_COLORS}
            locations={BLUR_MASK_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
      <LinearGradient colors={SHADE_COLORS} locations={SHADE_LOCATIONS} style={StyleSheet.absoluteFill} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -SHADE_OVERHANG },
})
