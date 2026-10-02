export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface MenuPlacement {
  horizontal: 'right' | 'left' | 'overlap'
  vertical: 'bottom' | 'top' | 'overlap'
  x: number
  y: number
  maxWidth: number
  maxHeight: number
}

interface MenuPlacementArgs {
  anchor: Rect
  menu: Size
  bounds: Rect
  gap: number
}

interface AxisArgs {
  anchorStart: number
  forwardStart: number
  backwardEnd: number
  size: number
  boundStart: number
  boundEnd: number
}

type AxisSide = 'forward' | 'backward' | 'overlap'

interface AxisPlacement {
  side: AxisSide
  start: number
  extent: number
}

function resolveAxis({ anchorStart, forwardStart, backwardEnd, size, boundStart, boundEnd }: AxisArgs): AxisPlacement {
  if (size <= boundEnd - forwardStart) return { side: 'forward', start: forwardStart, extent: size }
  if (size <= backwardEnd - boundStart) return { side: 'backward', start: backwardEnd - size, extent: size }

  const extent = Math.min(size, boundEnd - boundStart)
  const start = Math.min(Math.max(anchorStart, boundStart), boundEnd - extent)
  return { side: 'overlap', start, extent }
}

const HORIZONTAL_SIDE = { forward: 'right', backward: 'left', overlap: 'overlap' } as const
const VERTICAL_SIDE = { forward: 'bottom', backward: 'top', overlap: 'overlap' } as const

export function resolveMenuPlacement({ anchor, menu, bounds, gap }: MenuPlacementArgs): MenuPlacement {
  const horizontal = resolveAxis({
    anchorStart: anchor.x,
    forwardStart: anchor.x + anchor.width + gap,
    backwardEnd: anchor.x - gap,
    size: menu.width,
    boundStart: bounds.x,
    boundEnd: bounds.x + bounds.width,
  })
  const isBesideTrigger = horizontal.side !== 'overlap'
  const vertical = resolveAxis({
    anchorStart: anchor.y,
    forwardStart: isBesideTrigger ? anchor.y : anchor.y + anchor.height + gap,
    backwardEnd: isBesideTrigger ? anchor.y + anchor.height : anchor.y - gap,
    size: menu.height,
    boundStart: bounds.y,
    boundEnd: bounds.y + bounds.height,
  })

  return {
    horizontal: HORIZONTAL_SIDE[horizontal.side],
    vertical: VERTICAL_SIDE[vertical.side],
    x: horizontal.start,
    y: vertical.start,
    maxWidth: horizontal.extent,
    maxHeight: vertical.extent,
  }
}
