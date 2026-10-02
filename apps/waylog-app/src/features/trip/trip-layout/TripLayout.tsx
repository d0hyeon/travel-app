import { assert } from '@waylog/utility'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../../../shared/config/tokens'
import { TripHeaderShade } from './TripHeaderShade'

export type TripLayoutVariant = 'default' | 'glass'

const GLASS_TRANSITION_DURATION = 220

interface TripLayoutContextValue {
  /** 모양을 요청하고, 요청을 거두는 함수를 돌려준다 */
  requestVariant: (variant: TripLayoutVariant) => () => void
  glassProgress: SharedValue<number>
  headerHeight: number
}

interface VariantRequest {
  variant: TripLayoutVariant
}

const TripLayoutContext = createContext<TripLayoutContextValue | null>(null)

export function useTripLayout() {
  const layout = useContext(TripLayoutContext)
  assert(layout != null, 'TripLayout 안에서만 쓸 수 있다')

  return layout
}

interface Props {
  header: ReactNode
  children: ReactNode
}

export function TripLayout({ header, children }: Props) {
  const insets = useSafeAreaInsets()
  const [requests, setRequests] = useState<VariantRequest[]>([])
  const variant = requests.at(-1)?.variant ?? 'default'
  const [headerHeight, setHeaderHeight] = useState(0)
  const glassProgress = useSharedValue(0)

  const requestVariant = useCallback((requested: TripLayoutVariant) => {
    const request = { variant: requested }
    setRequests((current) => [...current, request])
    return () => setRequests((current) => current.filter((item) => item !== request))
  }, [])

  useEffect(() => {
    glassProgress.set(withTiming(variant === 'glass' ? 1 : 0, { duration: GLASS_TRANSITION_DURATION }))
  }, [variant, glassProgress])

  const headerBackgroundStyle = useAnimatedStyle(() => ({ opacity: 1 - glassProgress.get() }))
  const contentInsetTop = variant === 'glass' ? 0 : headerHeight
  const layout = useMemo(
    () => ({ requestVariant, glassProgress, headerHeight }),
    [glassProgress, headerHeight],
  )

  return (
    <TripLayoutContext.Provider value={layout}>
      <View style={styles.screen}>
        <View style={[styles.content, { paddingTop: contentInsetTop }]}>{children}</View>
        <View
          pointerEvents="box-none"
          style={[styles.header, { paddingTop: insets.top }]}
          onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}
        >
          <Animated.View pointerEvents="none" style={[styles.headerBackground, headerBackgroundStyle]} />
          <TripHeaderShade progress={glassProgress} />
          {header}
        </View>
      </View>
    </TripLayoutContext.Provider>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerBackground: { ...StyleSheet.absoluteFill, backgroundColor: palette.background },
})
