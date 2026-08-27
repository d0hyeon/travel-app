import { useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
} from 'react-native-reanimated';

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type MeasurableElement = {
  measureInWindow(
    callback: (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void,
  ): void;
};

/**
 * 위치를 측정할 대상.
 *
 * 이미 측정된 Rect이거나, 측정 가능한 노드다.
 */
type SharedElementSource = Rect | MeasurableElement;

const DEFAULT_DURATION = 400;
const DEFAULT_EASING = Easing.inOut(Easing.cubic);

function isRect(source: SharedElementSource): source is Rect {
  return (
    'x' in source &&
    'y' in source &&
    'w' in source &&
    'h' in source
  );
}

function measureElement(
  element: MeasurableElement,
): Promise<Rect> {
  return new Promise(resolve => {
    element.measureInWindow(
      (x, y, w, h) => {
        resolve({
          x,
          y,
          w,
          h,
        });
      },
    );
  });
}

async function resolveRect(
  source: SharedElementSource | null,
): Promise<Rect | null> {
  if (source == null) return null;

  if (isRect(source)) {
    return source;
  }

  return measureElement(source);
}

function nextFrame() {
  return new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

type PlayOptions = {
  from: SharedElementSource | null;
  /**
   * 최종 layout에 실제로 존재하는 노드.
   *
   * ref callback으로 붙는 노드는 render 시점에 아직 null이므로
   * hook 인자가 아니라 play 호출 시점에 받는다.
   */
  to: SharedElementSource | null;
  duration?: number;
  easing?: EasingFunction | EasingFunctionFactory;

  /**
   * Invert가 적용된 뒤,
   * 실제 Play가 시작되는 순간.
   *
   * scale / opacity 같은 부가 애니메이션을
   * 여기서 함께 시작할 수 있다.
   */
  onPlay?: () => void;
};

type ReverseOptions = {
  duration?: number;
  easing?: EasingFunction | EasingFunctionFactory;

  /**
   * 역재생이 시작되는 순간.
   *
   * play의 onPlay와 대응한다.
   */
  onPlay?: () => void;
};

export function useSharedElementTransition() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  /**
   * 직전 play의 Invert 값.
   *
   * reverse가 돌아갈 지점이므로
   * 호출부가 from/to를 다시 조립하지 않아도 된다.
   */
  const invertedX = useSharedValue(0);
  const invertedY = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
    ],
  }));

  const play = useCallback(async ({
    from,
    to,
    duration = DEFAULT_DURATION,
    easing = DEFAULT_EASING,
    onPlay,
  }: PlayOptions) => {
    const [fromRect, toRect] = await Promise.all([
      resolveRect(from),
      resolveRect(to),
    ]);

    if (!fromRect || !toRect) {
      return;
    }

    /**
     * Invert
     *
     * Target은 실제로 to에 있지만
     * 화면에서는 from 위치처럼 보이게 한다.
     */
    translateX.set(fromRect.x - toRect.x);
    translateY.set(fromRect.y - toRect.y);

    /**
     * reverse가 돌아갈 지점으로 남긴다.
     */
    invertedX.set(fromRect.x - toRect.x);
    invertedY.set(fromRect.y - toRect.y);

    /**
     * Invert가 실제 frame에 반영되어야
     * 0으로 변경할 때 animation이 발생한다.
     */
    await nextFrame();

    // Play
    translateX.set(
      withTiming(0, {
        duration,
        easing,
      }),
    );

    translateY.set(
      withTiming(0, {
        duration,
        easing,
      }),
    );

    onPlay?.();
  }, [translateX, translateY, invertedX, invertedY]);

  /**
   * 직전 play를 역재생한다.
   *
   * 현재 위치에서 Invert 지점으로 되돌아가므로
   * play가 끝나기 전에 호출해도 이어서 움직인다.
   */
  const reverse = useCallback(({
    duration = DEFAULT_DURATION,
    easing = DEFAULT_EASING,
    onPlay,
  }: ReverseOptions = {}) => {
    translateX.set(
      withTiming(invertedX.get(), {
        duration,
        easing,
      }),
    );

    translateY.set(
      withTiming(invertedY.get(), {
        duration,
        easing,
      }),
    );

    onPlay?.();
  }, [translateX, translateY, invertedX, invertedY]);

  return {
    style,
    translateX,
    translateY,
    play,
    reverse,
  };
}
