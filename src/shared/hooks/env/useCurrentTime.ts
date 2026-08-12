import { useState } from "react";

/**
 * 마운트 시점의 현재 시각을 반환한다.
 *
 * 모듈 스코프에서 `Date.now()`를 읽으면 SSR 환경에서 서버 부팅 시각에 고정되므로,
 * 초기화 함수 안에서만 읽는다. 렌더 중에는 값이 변하지 않아
 * 같은 트리 안의 여러 소비자가 동일한 기준 시각을 공유한다.
 */
export function useCurrentTime() {
  const [now] = useState(() => Date.now());
  return now;
}
