import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { fontSize, palette, radius } from '~shared/config/tokens'
import { GlassSurface } from '~shared/components/design-system/GlassSurface'
import { Typography } from '~shared/components/design-system/Typography'
import { useMenuFabContext } from './MenuFabContext'
import { CLOSE_DURATION_MS, getItemOffsetY, getItemStagger, ITEM_ENTRY_SPRING, ITEM_HEIGHT } from './menuFabMotion'

// 검은 틴트는 블러와 겹치면 탁한 회색으로 보인다. 흰 틴트를 줘야 서리
// 낀 유리(frosted glass) 특유의 밝고 뽀얀 느낌이 난다. 지도·사진처럼 색이
// 있는 배경은 그 색이 옅게 비쳐야 하므로 흰 틴트를 옅게, 흰 리스트 화면
// 위에서는 더 진하게 줘 존재감을 확보한다.
const GLASS_TINT: Record<'colored' | 'plain', string> = {
  colored: 'rgba(255,255,255,0.35)',
  plain: 'rgba(255,255,255,0.55)',
}

export interface MenuFabItemProps {
  icon?: ReactNode
  onPress?: () => void
  children?: ReactNode
}

export function MenuFabItem({ icon, onPress, children }: MenuFabItemProps) {
  const { menuProgress, index, itemCount, isOpen, closeMenu, surface } = useMenuFabContext()
  const { start } = getItemStagger(index, itemCount)
  const entry = useSharedValue(0)

  useAnimatedReaction(
    () => menuProgress.get() > start,
    (isEntering, wasEntering) => {
      if (isEntering === wasEntering) return
      entry.set(
        isEntering ? withSpring(1, ITEM_ENTRY_SPRING) : withTiming(0, { duration: CLOSE_DURATION_MS }),
      )
    },
  )

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(entry.get(), 0), 1),
    transform: [
      { translateY: interpolate(entry.get(), [0, 1], [16, 0]) },
      { scale: interpolate(entry.get(), [0, 1], [0.92, 1]) },
    ],
  }))

  return (
    <Animated.View
      pointerEvents={isOpen ? 'box-none' : 'none'}
      accessibilityElementsHidden={!isOpen}
      importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
      style={[styles.slot, { bottom: getItemOffsetY(index) }, animatedStyle]}
    >
      <View style={styles.clip}>
        <GlassSurface fallbackBlurIntensity={40} tintColor={GLASS_TINT[surface]} style={styles.pill}>
          <Pressable
            accessibilityRole="button"
            disabled={!isOpen}
            style={styles.pillBody}
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
        </GlassSurface>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // 그림자는 유리 바깥에 둔다. pill 의 overflow: hidden 이 그림자까지 잘라낸다.
  slot: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // 라운드 안쪽으로 블러를 가둔다. 이게 없으면 블러가 사각으로 삐져나온다.
  // 배경은 깔지 않는다 — GlassSurface 의 tintColor 가 곧 명암이다. 불투명한
  // 판을 더 얹으면 굴절이 판 위에서 일어나 유리가 아니라 회색 판이 된다.
  clip: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.divider,
    overflow: 'hidden',
  },
  pill: {
    borderRadius: radius.xl,
  },
  pillBody: {
    minHeight: ITEM_HEIGHT,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: fontSize.body2,
    color: palette.text,
  },
})
