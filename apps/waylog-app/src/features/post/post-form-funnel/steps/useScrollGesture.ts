import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface UseScrollGestureOptions {
  onScrollStart?: () => void;
  onScrollOver?: () => void;
  scrollThreshold?: number;
  overscrollThreshold?: number;
}

export function useScrollGesture({
  onScrollStart,
  onScrollOver,
  scrollThreshold = 20,
  overscrollThreshold = 20,
}: UseScrollGestureOptions) {
  const dragStartY = useSharedValue(0);
  const startedAtTop = useSharedValue(false);
  const handled = useSharedValue(false);

  return useAnimatedScrollHandler({
    onBeginDrag: (event) => {
      const y = event.contentOffset.y;

      dragStartY.value = y;
      startedAtTop.value = y <= 1;
      handled.value = false;
    },

    onScroll: (event) => {
      if (handled.value) return;

      const y = event.contentOffset.y;
      const delta = y - dragStartY.value;

      // 위로 밀었다 → 일반 스크롤 시작
      if (delta > scrollThreshold) {
        handled.value = true;

        if (onScrollStart) {
          scheduleOnRN(onScrollStart);
        }

        return;
      }

      // top에서 시작해서 아래로 당겼다 → overscroll
      if (startedAtTop.value && y < -overscrollThreshold) {
        handled.value = true;

        if (onScrollOver) {
          scheduleOnRN(onScrollOver);
        }
      }
    },
  });
}
