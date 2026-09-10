import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { fontSize, palette, radius } from '../../../config/tokens'
import { Typography } from '../Typography'
import { useMenuFabContext } from './MenuFabContext'
import { getItemOffsetY, getItemStagger, ITEM_HEIGHT } from './menuFabMotion'

export interface MenuFabItemProps {
  icon?: ReactNode
  onPress?: () => void
  children?: ReactNode
}

export function MenuFabItem({ icon, onPress, children }: MenuFabItemProps) {
  const { menuProgress, index, itemCount, isOpen, closeMenu } = useMenuFabContext()
  const { start, end } = getItemStagger(index, itemCount)

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      menuProgress.get(),
      [start, end],
      [0, 1],
      Extrapolation.CLAMP,
    )

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [12, 0]) },
        { scale: interpolate(progress, [0, 1], [0.92, 1]) },
      ],
    }
  })

  return (
    <Animated.View
      pointerEvents={isOpen ? 'box-none' : 'none'}
      accessibilityElementsHidden={!isOpen}
      importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
      style={[styles.slot, { bottom: getItemOffsetY(index) }, animatedStyle]}
    >
      <Pressable
        accessibilityRole="button"
        disabled={!isOpen}
        style={styles.pill}
        onPress={() => {
          closeMenu()
          onPress?.()
        }}
      >
        {icon}
        <Typography variant="body2" style={styles.label}>
          {children}
        </Typography>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
  },
  pill: {
    minHeight: ITEM_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.divider,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  label: {
    fontSize: fontSize.body2,
    color: palette.text,
  },
})
