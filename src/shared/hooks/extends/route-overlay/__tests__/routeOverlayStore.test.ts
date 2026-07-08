import { describe, it, expect, vi } from 'vitest'
import {
  registerRouteOverlay,
  getRouteOverlay,
  subscribeRouteOverlay,
} from '../routeOverlayStore'

describe('routeOverlayStore', () => {
  it('등록한 renderer를 id로 조회할 수 있다', () => {
    const renderer = () => null
    registerRouteOverlay('overlay-a', renderer)

    expect(getRouteOverlay('overlay-a')).toBe(renderer)
  })

  it('같은 id로 다시 등록하면 최신 renderer로 덮어쓴다', () => {
    const first = () => null
    const second = () => null
    registerRouteOverlay('overlay-b', first)
    registerRouteOverlay('overlay-b', second)

    expect(getRouteOverlay('overlay-b')).toBe(second)
  })

  it('등록되지 않은 id는 undefined를 반환한다', () => {
    expect(getRouteOverlay('never-registered')).toBeUndefined()
  })

  it('register가 발생하면 구독자에게 통지한다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)

    registerRouteOverlay('overlay-c', () => null)

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('unsubscribe 후에는 통지하지 않는다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRouteOverlay(listener)
    unsubscribe()

    registerRouteOverlay('overlay-d', () => null)

    expect(listener).not.toHaveBeenCalled()
  })
})
