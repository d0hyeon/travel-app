import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../../config/tokens'
import type { TabNavigationVariant } from './TabNavigation.types'

const VARIANT_TRANSITION_CONFIG = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
}

export const TAB_BAR_HEIGHT = {
  default: 84,
  apple: 64,
} as const

/**
 * apple variant 에서 탭바가 화면 좌우 가장자리에서 떨어진 거리.
 * 탭바 위에 놓이는 하단 CTA 는 이 값으로 들여써야 끝선이 맞는다.
 */
export const TAB_BAR_SIDE_INSET = 16

// 시안의 떠 있는 pill. 화면 가장자리에서 띄우고 사방을 라운드 처리한다.
// 하단은 홈 인디케이터와 겹쳐 보이지 않도록 좌우보다 넉넉히 띄운다.
const FLOATING_MARGIN = {
  side: TAB_BAR_SIDE_INSET,
  bottom: 24,
} as const

/**
 * apple variant 탭바가 화면 바닥에서 차지하는 총 높이.
 * 탭바는 scene 위에 떠 있어 레이아웃 높이를 잡지 않는다. 그 아래로
 * 이어지는 콘텐츠는 이 값만큼 끝에 여백을 둬야 마지막 항목이 가려지지 않는다.
 */
export const FLOATING_TAB_BAR_RESERVE = TAB_BAR_HEIGHT.apple + FLOATING_MARGIN.bottom

/**
 * variant 에 따라 탭바 외형을 만든다. variant 하나에서 파생될 뿐 다른 상태에
 * 영향을 주지 않으므로, 캡슐·제스처와 달리 따로 떼어 둘 수 있다.
 *
 * variantProgress 를 함께 내주는 이유는 캡슐·버스트가 apple 에서만 보이도록
 * 자신의 opacity 에 이 값을 곱해 쓰기 때문이다.
 */
export function useTabBarAppearance(variant: TabNavigationVariant) {
  const insets = useSafeAreaInsets()
  const isApple = variant === 'apple'
  const variantProgress = useDerivedValue<number>(() =>
    withTiming(isApple ? 1 : 0, VARIANT_TRANSITION_CONFIG),
  )

  // 그림자와 클리핑은 같은 뷰에 둘 수 없다. overflow: hidden 이 그림자까지 잘라낸다.
  // 바깥은 여백·그림자만, 안쪽은 라운드 클리핑만 담당한다.
  //
  // insets.bottom 은 default 에만 준다. 바닥에 붙는 탭바는 홈 인디케이터 영역까지
  // 배경을 채우고 그만큼 안쪽을 비워야 하지만, 떠 있는 pill 은 여백 자체가
  // 인디케이터를 비켜간다. 양쪽에 다 주면 탭이 높아지고 바닥 간격도 과해진다.
  const shadowStyle = useAnimatedStyle(() => ({
    marginHorizontal: interpolate(variantProgress.get(), [0, 1], [0, FLOATING_MARGIN.side]),
    marginBottom: interpolate(variantProgress.get(), [0, 1], [0, FLOATING_MARGIN.bottom]),
    shadowColor: '#000',
    shadowOpacity: interpolate(variantProgress.get(), [0, 1], [0.5, 0.15]),
    shadowOffset: {
      width: 0,
      height: interpolate(variantProgress.get(), [0, 1], [-6, 4]),
    },
    shadowRadius: interpolate(variantProgress.get(), [0, 1], [10, 16]),
    elevation: interpolate(variantProgress.get(), [0, 1], [12, 8]),
  }))

  const containerStyle = useAnimatedStyle(() => ({
    height:
      interpolate(variantProgress.get(), [0, 1], [TAB_BAR_HEIGHT.default, TAB_BAR_HEIGHT.apple]) +
      interpolate(variantProgress.get(), [0, 1], [insets.bottom, 0]),
    paddingTop: interpolate(variantProgress.get(), [0, 1], [8, 0]),
    paddingBottom: interpolate(variantProgress.get(), [0, 1], [insets.bottom, 0]),
    borderTopLeftRadius: interpolate(variantProgress.get(), [0, 1], [28, TAB_BAR_HEIGHT.apple / 2]),
    borderTopRightRadius: interpolate(variantProgress.get(), [0, 1], [28, TAB_BAR_HEIGHT.apple / 2]),
    borderBottomLeftRadius: interpolate(variantProgress.get(), [0, 1], [0, TAB_BAR_HEIGHT.apple / 2]),
    borderBottomRightRadius: interpolate(variantProgress.get(), [0, 1], [0, TAB_BAR_HEIGHT.apple / 2]),
    backgroundColor: isApple ? 'rgba(251,251,253,0.72)' : palette.background,
  }))

  const defaultGradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(variantProgress.get(), [0, 1], [1, 0]),
  }))

  return { isApple, variantProgress, shadowStyle, containerStyle, defaultGradientStyle }
}
