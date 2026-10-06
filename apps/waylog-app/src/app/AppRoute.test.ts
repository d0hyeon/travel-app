import { describe, expect, it } from 'vitest'
import { toScreenName } from './AppRoute'

describe('toScreenName', () => {
  it('콜론을 언더스코어로 치환한다', () => {
    expect(toScreenName('/trip/:tripId')).toBe('/trip/_tripId')
  })

  it('콜론이 여러 개면 전부 치환한다', () => {
    expect(toScreenName('/trip/:tripId/memo/:memoId')).toBe('/trip/_tripId/memo/_memoId')
  })

  it('콜론이 없으면 그대로 반환한다(멱등성)', () => {
    expect(toScreenName('/trip/_tripId')).toBe('/trip/_tripId')
  })
})
