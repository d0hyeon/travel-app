import { describe, expect, it } from 'vitest'
import { resolveMenuPlacement } from '../anchoredMenu.utils'

const GAP = 4
const SCREEN = { x: 0, y: 0, width: 400, height: 800 }
const MENU = { width: 160, height: 120 }

function anchorAt(x: number, y: number) {
  return { x, y, width: 40, height: 40 }
}

describe('resolveMenuPlacement', () => {
  describe('가로', () => {
    it('트리거 오른쪽에 자리가 있으면 메뉴가 트리거 오른쪽에 붙는다', () => {
      const placement = resolveMenuPlacement({ anchor: anchorAt(50, 100), menu: MENU, bounds: SCREEN, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'right', x: 94, maxWidth: 160 })
    })

    it('오른쪽이 모자라고 왼쪽이 충분하면 메뉴가 트리거 왼쪽에 붙는다', () => {
      const placement = resolveMenuPlacement({ anchor: anchorAt(340, 100), menu: MENU, bounds: SCREEN, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'left', x: 176, maxWidth: 160 })
    })

    it('양쪽 모두 모자라면 트리거와 겹치더라도 영역 안에 메뉴 전체가 보이게 배치한다', () => {
      const bounds = { x: 0, y: 0, width: 200, height: 800 }
      const anchor = { x: 80, y: 100, width: 20, height: 40 }

      const placement = resolveMenuPlacement({ anchor, menu: { width: 150, height: 120 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'overlap', x: 50, maxWidth: 150 })
    })

    it('메뉴가 영역보다 넓으면 영역 너비로 제한한다', () => {
      const bounds = { x: 0, y: 0, width: 200, height: 800 }
      const anchor = { x: 80, y: 100, width: 20, height: 40 }

      const placement = resolveMenuPlacement({ anchor, menu: { width: 300, height: 120 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'overlap', x: 0, maxWidth: 200 })
    })

    it('옆에 붙을 자리가 없으면 영역 안으로 정렬하고 트리거 아래에 둔다', () => {
      const bounds = { x: 8, y: 59, width: 386, height: 735 }
      const fullWidthAnchor = { x: 4, y: 329, width: 394, height: 44 }

      const placement = resolveMenuPlacement({ anchor: fullWidthAnchor, menu: { width: 120, height: 90 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'overlap', x: 8, maxWidth: 120, vertical: 'bottom', y: 377 })
    })

    it('옆에 붙을 자리가 없고 아래도 모자라면 트리거 위에 둔다', () => {
      const bounds = { x: 8, y: 59, width: 386, height: 735 }
      const fullWidthAnchor = { x: 4, y: 700, width: 394, height: 44 }

      const placement = resolveMenuPlacement({ anchor: fullWidthAnchor, menu: { width: 120, height: 90 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'overlap', vertical: 'top', y: 606 })
    })

    it('메뉴 너비가 오른쪽 여유와 정확히 같으면 오른쪽을 유지한다', () => {
      const exactFitMenu = { width: 306, height: 120 }

      const placement = resolveMenuPlacement({ anchor: anchorAt(50, 100), menu: exactFitMenu, bounds: SCREEN, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'right', x: 94, maxWidth: 306 })
    })
  })

  describe('세로', () => {
    it('트리거 아래에 자리가 있으면 메뉴 윗변이 트리거 윗변에 맞춰진다', () => {
      const placement = resolveMenuPlacement({ anchor: anchorAt(50, 100), menu: MENU, bounds: SCREEN, gap: GAP })

      expect(placement).toMatchObject({ vertical: 'bottom', y: 100, maxHeight: 120 })
    })

    it('아래가 모자라고 위가 충분하면 메뉴 아랫변이 트리거 아랫변에 맞춰진다', () => {
      const placement = resolveMenuPlacement({ anchor: anchorAt(50, 720), menu: MENU, bounds: SCREEN, gap: GAP })

      expect(placement).toMatchObject({ vertical: 'top', y: 640, maxHeight: 120 })
    })

    it('양쪽 모두 모자라면 트리거와 겹치더라도 영역 안에 메뉴 전체가 보이게 배치한다', () => {
      const bounds = { x: 0, y: 0, width: 400, height: 200 }
      const anchor = { x: 50, y: 100, width: 40, height: 20 }

      const placement = resolveMenuPlacement({ anchor, menu: { width: 160, height: 150 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ vertical: 'overlap', y: 50, maxHeight: 150 })
    })

    it('메뉴가 영역보다 높으면 영역 높이로 제한한다', () => {
      const bounds = { x: 0, y: 0, width: 400, height: 200 }
      const anchor = { x: 50, y: 100, width: 40, height: 20 }

      const placement = resolveMenuPlacement({ anchor, menu: { width: 160, height: 300 }, bounds, gap: GAP })

      expect(placement).toMatchObject({ vertical: 'overlap', y: 0, maxHeight: 200 })
    })
  })

  describe('사용 가능 영역', () => {
    it('영역 위쪽 경계를 넘는 방향은 여유에서 제외한다', () => {
      const bounds = { x: 0, y: 40, width: 400, height: 200 }
      const tallMenu = { width: 160, height: 150 }
      const anchor = { x: 50, y: 165, width: 40, height: 20 }

      const placement = resolveMenuPlacement({ anchor, menu: tallMenu, bounds, gap: GAP })

      expect(placement).toMatchObject({ vertical: 'overlap', y: 90, maxHeight: 150 })
    })

    it('영역이 화면 가장자리에서 안쪽으로 들어와 있어도 그 안에서만 배치한다', () => {
      const bounds = { x: 20, y: 40, width: 360, height: 720 }
      const anchorNearRightEdge = { x: 330, y: 700, width: 40, height: 40 }

      const placement = resolveMenuPlacement({ anchor: anchorNearRightEdge, menu: MENU, bounds, gap: GAP })

      expect(placement).toMatchObject({ horizontal: 'left', x: 166, vertical: 'top', y: 620 })
    })
  })

  describe('두 축', () => {
    it('가로와 세로는 서로 영향을 주지 않고 각각 판정된다', () => {
      const rightBottom = resolveMenuPlacement({ anchor: anchorAt(50, 100), menu: MENU, bounds: SCREEN, gap: GAP })
      const leftBottom = resolveMenuPlacement({ anchor: anchorAt(340, 100), menu: MENU, bounds: SCREEN, gap: GAP })
      const rightTop = resolveMenuPlacement({ anchor: anchorAt(50, 720), menu: MENU, bounds: SCREEN, gap: GAP })
      const leftTop = resolveMenuPlacement({ anchor: anchorAt(340, 720), menu: MENU, bounds: SCREEN, gap: GAP })

      expect([rightBottom, leftBottom, rightTop, leftTop].map(({ horizontal, vertical }) => `${horizontal}-${vertical}`))
        .toEqual(['right-bottom', 'left-bottom', 'right-top', 'left-top'])
    })
  })
})
