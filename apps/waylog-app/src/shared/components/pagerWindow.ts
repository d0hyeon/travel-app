// 현재 페이지 앞뒤 이만큼만 실제로 렌더한다. 나머지는 자리만 잡는다.
// 먼 페이지를 그리지 않으면 그 페이지가 구독하는 쿼리도 요청되지 않는다.
const RENDER_WINDOW = 1

export function isPageWithinRenderWindow(pageIndex: number, activeIndex: number): boolean {
  return Math.abs(pageIndex - activeIndex) <= RENDER_WINDOW
}
