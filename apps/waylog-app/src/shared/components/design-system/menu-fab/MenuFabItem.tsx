import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { fontSize, palette, radius } from '../../../config/tokens'
import { GlassSurface } from '../GlassSurface'
import { Typography } from '../Typography'
import { useMenuFabContext } from './MenuFabContext'
import { getItemOffsetY, getItemStagger, ITEM_HEIGHT } from './menuFabMotion'

// Liquid Glass 는 뒤를 굴절시켜 스스로 명암을 만든다. 흰 배경 위에서는
// 굴절할 것이 없어 흰 틴트를 주면 아무것도 보이지 않는다. 탭 캡슐과 같은
// 어두운 틴트를 줘야 밝은 콘텐츠 위에서도 유리의 윤곽이 잡힌다.
const GLASS_TINT = 'rgba(0,0,0,0.09)'

// 라벨이 읽힐 만큼만 뒤를 덮는다. 불투명하게 채우면 유리가 아니라 판이 된다.
const PILL_SCRIM = 'rgba(255,255,255,0.85)'

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
      <View style={styles.pillBase}>
        <GlassSurface fallbackBlurIntensity={40} tintColor={GLASS_TINT} style={styles.pill}>
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
  // 유리 뒤로 콘텐츠가 비쳐야 하므로 불투명하게 덮지 않는다. 다만 완전히
  // 비추면 라벨이 묻히므로 반투명한 흰 판을 깔아 글자의 바탕만 확보한다.
  pillBase: {
    borderRadius: radius.xl,
    backgroundColor: PILL_SCRIM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.divider,
    // 라운드 안쪽으로 블러를 가둔다. 이게 없으면 블러가 사각으로 삐져나온다.
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
