import { Easing } from 'react-native-reanimated'

// 캡슐이 자리를 옮길 때의 속도. 드래그가 끝날 때와 탭을 눌렀을 때가 같아야
// 어느 쪽으로 옮겼든 같은 움직임으로 읽힌다.
export const CAPSULE_TRANSITION_CONFIG = {
  duration: 320,
  easing: Easing.out(Easing.cubic),
}

// 캡슐이 부풀어 라벨을 덮었다가 되돌아온다. 덮는 건 빠르게, 걷히는 건 여유 있게.
export const BURST_IN_CONFIG = {
  duration: 140,
  easing: Easing.out(Easing.quad),
}

export const BURST_OUT_CONFIG = {
  duration: 260,
  easing: Easing.out(Easing.cubic),
}
