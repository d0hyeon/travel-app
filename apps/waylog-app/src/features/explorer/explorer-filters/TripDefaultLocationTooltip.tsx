import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeOut } from 'react-native-reanimated'
import { Typography } from '~shared/components/design-system'

const DISMISS_AFTER_SECONDS = 5
const TOOLTIP_COLOR = 'rgba(0,0,0,0.55)'

export function TripDefaultLocationTooltip() {
  const [remainingSeconds, setRemainingSeconds] = useState(DISMISS_AFTER_SECONDS)

  useEffect(() => {
    if (remainingSeconds === 0) return

    const timer = setTimeout(() => setRemainingSeconds(remainingSeconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [remainingSeconds])

  if (remainingSeconds === 0) return null

  return (
    <Animated.View exiting={FadeOut} style={styles.container}>
      <Pressable onPress={() => setRemainingSeconds(0)} style={styles.tooltip}>
        <View style={styles.arrow} />
        <View style={styles.bubble}>
          <Typography variant="caption" color="common.white">
            예정된 여행지로 지역을 설정했어요
          </Typography>
          <Typography variant="caption" color="common.white" style={styles.countdown}>
            {remainingSeconds}
          </Typography>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: '100%', left: -6, width: 280, marginTop: 4 },
  tooltip: { alignSelf: 'flex-start' },
  arrow: {
    marginLeft: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: TOOLTIP_COLOR,
  },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: TOOLTIP_COLOR },
  countdown: { fontVariant: ['tabular-nums'], opacity: 0.7 },
})
