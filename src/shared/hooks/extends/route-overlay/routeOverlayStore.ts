import type { ReactNode } from 'react'

export interface RouteOverlayRenderProps {
  isOpen: boolean
  close: () => void
  onClose: () => void
  data: unknown
}

export type RouteOverlayRenderer = (props: RouteOverlayRenderProps) => ReactNode

const renderers = new Map<string, RouteOverlayRenderer>()
const listeners = new Set<() => void>()

/**
 * open 시점의 renderer를 등록한다. 호출 컴포넌트가 언마운트되어도
 * 삭제하지 않으므로, 라우트 전환 후 뒤로가기로 복원될 때 renderer가 유지된다.
 */
export function registerRouteOverlay(id: string, renderer: RouteOverlayRenderer) {
  renderers.set(id, renderer)
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
