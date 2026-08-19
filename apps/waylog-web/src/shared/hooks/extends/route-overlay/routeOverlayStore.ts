import type { ReactNode } from 'react'

export interface RouteOverlayRenderProps<Data = unknown> {
  isOpen: boolean
  close: () => void
  onClose: () => void
  data: Data
}

export type RouteOverlayRenderer = (props: RouteOverlayRenderProps) => ReactNode

// key는 오버레이 "종류"(templateId)다. 열린 오버레이 인스턴스(엔트리)가 아니라
// renderer 종류당 하나만 등록된다. 열린 인스턴스는 별도 유니크 id로 스택에서 구분한다.
const renderers = new Map<string, RouteOverlayRenderer>()
const listeners = new Set<() => void>()

/**
 * 오버레이 종류(templateId)별 renderer를 등록한다. 호출 컴포넌트가 언마운트되어도
 * 삭제하지 않으므로, 라우트 전환 후 뒤로가기로 복원될 때 renderer가 유지된다.
 *
 * 같은 templateId를 여러 번 등록해도 renderer 참조가 같으면 통지하지 않는다.
 * (매 렌더 재통지로 인한 렌더 폭풍 방지)
 *
 * 소비자는 자신의 Data 타입으로 renderer를 정의하고, store는 data를 unknown으로
 * 보관한다. 이 등록 경계에서만 소비자 타입을 store 타입으로 넓힌다(타입 단언 없이).
 */
export function registerRouteOverlay<Data>(
  templateId: string,
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  if (renderers.get(templateId) === renderer) return
  renderers.set(templateId, renderer as RouteOverlayRenderer)
  listeners.forEach((notify) => notify())
}

export function getRouteOverlay(templateId: string): RouteOverlayRenderer | undefined {
  return renderers.get(templateId)
}

export function subscribeRouteOverlay(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
