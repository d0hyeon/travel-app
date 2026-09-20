import { MaterialIcons } from '@expo/vector-icons'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'

const EXPAND_DURATION = 220
const EXPAND_EASING = Easing.bezier(0.4, 0, 0.2, 1)
const COLLAPSED_ICON_ROTATION = -90

interface AccordionProps {
  children: ReactNode
  defaultExpanded?: boolean
}

interface AccordionSummaryProps {
  children: ReactNode
}

interface AccordionDetailsProps {
  children: ReactNode
}

const ExpandedContext = createContext({ isExpanded: false, toggle: () => {} })

export function Accordion({ children, defaultExpanded = false }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const toggle = () => setIsExpanded((expanded) => !expanded)

  return (
    <ExpandedContext.Provider value={{ isExpanded, toggle }}>
      <View style={styles.root}>{children}</View>
    </ExpandedContext.Provider>
  )
}

Accordion.Summary = function AccordionSummary({ children }: AccordionSummaryProps) {
  const { isExpanded, toggle } = useContext(ExpandedContext)

  const rotation = useDerivedValue(() =>
    withTiming(isExpanded ? 0 : COLLAPSED_ICON_ROTATION, {
      duration: EXPAND_DURATION,
      easing: EXPAND_EASING,
    }),
  )

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }))

  return (
    <Pressable onPress={toggle} style={styles.summary}>
      <Typography style={styles.summaryLabel}>{children}</Typography>
      <Animated.View style={iconStyle}>
        <MaterialIcons name="expand-more" size={18} color={palette.textSecondary} />
      </Animated.View>
    </Pressable>
  )
}

Accordion.Details = function AccordionDetails({ children }: AccordionDetailsProps) {
  const { isExpanded } = useContext(ExpandedContext)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  // 높이를 모르는 첫 프레임에는 아직 펼치고 접을 수 없다.
  const isMeasured = contentHeight != null
  const expandedHeight = contentHeight ?? 0

  const detailsStyle = useAnimatedStyle(() => {
    const height = isExpanded ? expandedHeight : 0
    if (!isMeasured) return { height }

    return { height: withTiming(height, { duration: EXPAND_DURATION, easing: EXPAND_EASING }) }
  })

  return (
    <Animated.View style={[styles.detailsViewport, detailsStyle]}>
      {/* 흐름에 두면 접힌 높이에 눌려 제 높이를 보고하지 못한다.
          빼내면 부모 높이와 무관하게 늘 자기 높이로 그려지고, 그 값이 펼칠 높이가 된다. */}
      <View
        style={styles.details}
        onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: palette.textSecondary },
  detailsViewport: { overflow: 'hidden' },
  details: { position: 'absolute', left: 0, right: 0, top: 0, padding: 10, gap: 10 },
})
