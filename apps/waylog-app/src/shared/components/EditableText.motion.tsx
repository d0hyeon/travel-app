import { usePreservedCallback } from '@waylog/react';
import { assert } from '@waylog/utility';
import { Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardMetrics,
  Platform,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const ANIMATION_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};

const OVERLAY_SCALE = 1.5;

interface Options {
  onMount?: (rect: Rect) => void;
}

/**
 * ref가 연결되면 해당 View의 window 좌표를 측정한다.
 */

export function useMeasureInWindow<T extends View | TextInput>(
  callback?: (rect: Rect) => void,
) {
  const handleMeasure = usePreservedCallback((rect: Rect) => {
    callback?.(rect);
  });
  const nodeRef = useRef<T | null>(null);

  const register = useCallback((node: T | null) => {
    nodeRef.current = node;
    if (node != null) {
      node.measureInWindow((x, y, w, h) => handleMeasure({ h, w, y, x }));
    }
  }, []);

  const getCurrentRect = () => {
    return new Promise<Rect>((resolve) => {
      assert(nodeRef.current != null, 'ref를 노드에 먼저 등록해주세요.');
      nodeRef.current.measureInWindow((x, y, w, h) => {
        resolve({ x, y, w, h })
      })
    })
  }



  return {
    ref: register,
    getCurrentRect,
  };
}

/**
 * Overlay의 transform을 관리한다.
 *
 * - placeAt: 즉시 위치 이동
 * - animateTo: 애니메이션을 통한 위치/크기 변경
 */
export function useOverlayTransform() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  const placeAt = useCallback(
    (current: Rect, target: Pick<Rect, 'x' | 'y'>) => {
      const deltaX = target.x - current.x;
      const deltaY = target.y - current.y;

      translateX.set(translateX.get() + deltaX);
      translateY.set(translateY.get() + deltaY);
    },
    [],
  );

  const animateTo = useCallback(
    (
      current: Rect,
      target: Pick<Rect, 'x' | 'y'>,
      targetScale = 1,
    ) => {
      const deltaX = target.x - current.x;
      const deltaY = target.y - current.y;

      translateX.set(
        withTiming(
          translateX.get() + deltaX,
          ANIMATION_CONFIG,
        ),
      );

      translateY.set(
        withTiming(
          translateY.get() + deltaY,
          ANIMATION_CONFIG,
        ),
      );

      scale.set(
        withTiming(targetScale, ANIMATION_CONFIG),
      );
    },
    [],
  );

  return {
    style,
    placeAt,
    animateTo,
  };
}

/**
 * container 내부에 대상이 중앙에 위치하기 위한
 * window 좌표를 계산한다.
 */
export function getCenteredPosition({
  containerWidth,
  containerHeight,
  width,
  height,
}: {
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
}) {
  return {
    x: containerWidth / 2 - width / 2,
    y: containerHeight / 2 - height / 2,
  };
}

type FlipAnimationLifecycle = {
  onInvert?: () => void;
  onPlay?: () => void;
};

export function useFlipAnimation(config: WithTimingConfig = { duration: 500 }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const play = useCallback(
    async ({
      first,
      last,
      onInvert,
      onPlay,
    }: {
      first: Rect;
      last: Rect;
      onInvert?: () => void;
      onPlay?: () => void;
    }) => {
      // Invert
      translateX.set(first.x - last.x);
      translateY.set(first.y - last.y);

      onInvert?.();

      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          resolve();
        });
      });

      // Play
      translateX.set(
        withTiming(0, config),
      );

      translateY.set(
        withTiming(0, config),
      );

      onPlay?.();
    },
    [],
  );

  return {
    translateX,
    translateY,
    play,
  };

}