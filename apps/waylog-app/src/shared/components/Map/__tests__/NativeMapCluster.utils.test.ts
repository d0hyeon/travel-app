import { describe, expect, it } from 'vitest'
import { formatClusterCount, resolveClusterAppearance } from '../NativeMapCluster.utils'
import { palette } from '../../../config/tokens'

describe('resolveClusterAppearance', () => {
  it('10개 이하는 옅은 배경과 진한 글자로 시각적 우선순위를 낮춘다', () => {
    const appearance = resolveClusterAppearance(10)

    expect(appearance.background).not.toBe(palette.primary)
    expect(appearance.textColor).not.toBe('#fff')
  })

  it('11개부터 primary 배경으로 전환된다', () => {
    expect(resolveClusterAppearance(11).background).toBe(palette.primary)
    expect(resolveClusterAppearance(10).background).not.toBe(palette.primary)
  })

  it('중형과 대형은 크기와 링으로 구분하므로 배경색이 같다', () => {
    expect(resolveClusterAppearance(21).background).toBe(resolveClusterAppearance(20).background)
  })

  it('개수가 늘수록 크기가 커진다', () => {
    expect(resolveClusterAppearance(10).size).toBeLessThan(resolveClusterAppearance(11).size)
    expect(resolveClusterAppearance(20).size).toBeLessThan(resolveClusterAppearance(21).size)
  })

  it('21개 이상은 개수와 무관하게 같은 외형을 유지한다', () => {
    const large = resolveClusterAppearance(21)

    expect(resolveClusterAppearance(500)).toEqual(large)
    expect(resolveClusterAppearance(100_000)).toEqual(large)
  })

  it('원이 클수록 그림자가 깊어진다', () => {
    const small = resolveClusterAppearance(10)
    const medium = resolveClusterAppearance(20)
    const large = resolveClusterAppearance(21)

    expect(small.shadowOpacity).toBeLessThan(medium.shadowOpacity)
    expect(medium.shadowOpacity).toBeLessThan(large.shadowOpacity)
    expect(small.elevation).toBeLessThan(medium.elevation)
    expect(medium.elevation).toBeLessThan(large.elevation)
  })

  it('발광은 원의 형태를 흐리지 않을 만큼만 번진다', () => {
    const counts = [10, 20, 21]

    counts.forEach((count) => {
      const { size, glowRadius } = resolveClusterAppearance(count)

      expect(glowRadius).toBeLessThan(size / 4)
    })
  })

  it('발광은 원과 다른 색이라 배경에 묻히지 않는다', () => {
    const counts = [10, 20, 21]

    counts.forEach((count) => {
      const { background, glowColor } = resolveClusterAppearance(count)

      expect(glowColor).not.toBe(background)
    })
  })

  it('링은 가장 큰 단계에만 두어 작은 클러스터가 지도를 덮지 않는다', () => {
    expect(resolveClusterAppearance(10).rings).toBeUndefined()
    expect(resolveClusterAppearance(20).rings).toBeUndefined()
    expect(resolveClusterAppearance(21).rings).toHaveLength(2)
  })

  it('링은 바깥으로 갈수록 좁아지고 색이 달라진다', () => {
    const [inner, outer] = resolveClusterAppearance(21).rings ?? []

    expect(outer.width).toBeLessThan(inner.width)
    expect(outer.color).not.toBe(inner.color)
  })

  it('중형과 대형은 한 단계 옅은 배경색이 번진다', () => {
    const sparse = resolveClusterAppearance(10).background

    expect(resolveClusterAppearance(20).glowColor).toBe(sparse)
    expect(resolveClusterAppearance(21).glowColor).toBe(sparse)
  })
})

describe('formatClusterCount', () => {
  it('1000 미만은 그대로 표기한다', () => {
    expect(formatClusterCount(3)).toBe('3')
    expect(formatClusterCount(999)).toBe('999')
  })

  it('1000 이상 10000 미만은 소수 첫째 자리까지 축약한다', () => {
    expect(formatClusterCount(1000)).toBe('1k')
    expect(formatClusterCount(1284)).toBe('1.2k')
  })

  it('실제 개수보다 많아 보이지 않도록 버림한다', () => {
    expect(formatClusterCount(1999)).toBe('1.9k')
    expect(formatClusterCount(9999)).toBe('9.9k')
  })

  it('10000 이상은 소수점 없이 축약한다', () => {
    expect(formatClusterCount(10_000)).toBe('10k')
    expect(formatClusterCount(18_432)).toBe('18k')
  })

  it('어떤 개수든 표기가 4자를 넘지 않는다', () => {
    const counts = [9, 99, 999, 1284, 18_432, 125_000]

    counts.forEach((count) => {
      expect(formatClusterCount(count).length).toBeLessThanOrEqual(4)
    })
  })
})
