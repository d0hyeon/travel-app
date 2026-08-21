import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { runOnJS } from 'react-native-reanimated'

interface Props {
  uri: string
  width: number
  height: number
  onZoomingChange?: (isZooming: boolean) => void
}

/** 웹 ZoomArea의 pinch, double-tap, 확대 상태 이동을 네이티브 제스처로 옮긴다. */
export function ZoomArea({ uri, width, height, onZoomingChange }: Props) {
  const scale = useSharedValue(1)
  const startScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value
    })
    .onUpdate((event) => {
      scale.value = Math.min(4, Math.max(1, startScale.value * event.scale))
      onZoomingChange != null && runOnJS(onZoomingChange)(scale.value > 1.01)
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        scale.value = withSpring(1)
        onZoomingChange != null && runOnJS(onZoomingChange)(false)
        translateX.value = withSpring(0)
        translateY.value = withSpring(0)
      }
    })

  const pan = Gesture.Pan().manualActivation(true)
    .onTouchesMove((_event, stateManager) => {
      if (scale.value > 1.01) {
        stateManager.activate()
        return
      }
      stateManager.fail()
    })
    .onStart(() => {
      startX.value = translateX.value
      startY.value = translateY.value
    })
    .onUpdate((event) => {
      if (scale.value <= 1) return
      translateX.value = startX.value + event.translationX
      translateY.value = startY.value + event.translationY
    })

  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    const zoomedIn = scale.value > 1
    scale.value = withSpring(zoomedIn ? 1 : 2)
    onZoomingChange != null && runOnJS(onZoomingChange)(!zoomedIn)
    translateX.value = withSpring(0)
    translateY.value = withSpring(0)
  })

  // 기본 배율에서는 바깥 사진 pager가 가로 드래그를 받아야 한다.
  // 확대 상태 이동은 pinch 이후에만 pan이 활성화되도록 실패 조건으로 제한한다.
  // 기본 배율에서는 pager와 동시에 제스처를 인식하고, 확대된 경우에만
  // pan의 이동값을 반영한다. 그래야 pager와 확대 이미지 이동이 공존한다.
  const gesture = Gesture.Simultaneous(doubleTap, pinch, pan)
  const imageStyle = useAnimatedStyle(() => ({
    width,
    height,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.Image source={{ uri }} resizeMode="contain" style={imageStyle} />
      </Animated.View>
    </GestureDetector>
  )
}
