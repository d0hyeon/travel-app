import { describe, it, expect, vi } from 'vitest'
import {
  registerRouteOverlay,
  getRouteOverlay,
  subscribeRouteOverlay,
} from '../routeOverlayStore'

describe('routeOverlayStore', () => {
  it('등록한 renderer를 kind로 조회할 수 있다', () => {
    const renderer = () => null
    registerRouteOverlay('kind-a', renderer)

    expect(getRouteOverlay('kind-a')).toBe(renderer)
  })

  it('같은 kind로 다른 renderer를 등록하면 최신으로 덮어쓴다', () => {
    const first = () => null
    const second = () => null
    registerRouteOverlay('kind-b', first)
    registerRouteOverlay('kind-b', second)

    expect(getRouteOverlay('kind-b')).toBe(second)
  })

  it('등록되지 않은 kind는 undefined를 반환한다', () => {
    expect(getRouteOverlay('never-registered')).toBeUndefined()
  })

  it('새 renderer 등록 시 구독자에게 통지한다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)

    registerRouteOverlay('kind-c', () => null)

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('같은 kind에 동일 renderer 참조를 재등록하면 통지하지 않는다 (렌더 폭풍 방지)', () => {
    const renderer = () => null
    registerRouteOverlay('kind-d', renderer)

    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)

    registerRouteOverlay('kind-d', renderer)

    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('unsubscribe 후에는 통지하지 않는다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)
    unsubscribe()

    registerRouteOverlay('kind-e', () => null)

    expect(listener).not.toHaveBeenCalled()
  })
})
