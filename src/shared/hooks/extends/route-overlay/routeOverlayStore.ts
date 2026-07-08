import type { ReactNode } from 'react'

export interface RouteOverlayRenderProps<Data = unknown> {
  isOpen: boolean
  close: () => void
  onClose: () => void
  data: Data
}

export type RouteOverlayRenderer = (props: RouteOverlayRenderProps) => ReactNode

const renderers = new Map<string, RouteOverlayRenderer>()
const listeners = new Set<() => void>()

/**
 * open 시점의 renderer를 등록한다. 호출 컴포넌트가 언마운트되어도
 * 삭제하지 않으므로, 라우트 전환 후 뒤로가기로 복원될 때 renderer가 유지된다.
 *
 * 소비자는 자신의 Data 타입으로 renderer를 정의하고, store는 data를 unknown으로
 * 보관한다. 이 등록 경계에서만 소비자 타입을 store 타입으로 넓힌다(타입 단언 없이).
 */
export function registerRouteOverlay<Data>(
  id: string,
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  renderers.set(id, renderer as RouteOverlayRenderer)
  listeners.forEach((notify) => notify())
}

export function getRouteOverlay(id: string): RouteOverlayRenderer | undefined {
  return renderers.get(id)
}

export function subscribeRouteOverlay(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
