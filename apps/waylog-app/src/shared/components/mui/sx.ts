import type { TextStyle, ViewStyle } from 'react-native'

// MUI 의 sx 값을 RN style 로 옮긴다.
// 웹 코드를 그대로 붙여넣기 위한 장치이므로 변환은 최소로 한다.
export type Sx = Record<string, unknown> | undefined

// RN 에 대응이 없는 속성. 넘기면 경고가 나므로 걸러낸다.
const DROPPED = new Set([
  'cursor',
  'userSelect',
  'whiteSpace',
  'textOverflow',
  'boxShadow',
  'transition',
  'scrollBehavior',
])

// MUI 의 spacing 단위는 1 = 8px 다.
const SPACING_MAP: Record<string, string[]> = {
  p: ['padding'], px: ['paddingHorizontal'], py: ['paddingVertical'],
  pt: ['paddingTop'], pb: ['paddingBottom'], pl: ['paddingLeft'], pr: ['paddingRight'],
  m: ['margin'], mx: ['marginHorizontal'], my: ['marginVertical'],
  mt: ['marginTop'], mb: ['marginBottom'], ml: ['marginLeft'], mr: ['marginRight'],
}

export function sxToStyle(sx: Sx): ViewStyle & TextStyle {
  if (sx == null) return {}

  const style: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(sx)) {
    if (DROPPED.has(key)) continue

    // RN 에는 fixed 가 없다. 화면 기준 고정은 absolute 로 표현한다.
    if (key === 'position' && value === 'fixed') {
      style.position = 'absolute'
      continue
    }

    // RN 의 overflow 는 visible/hidden 만 받는다.
    if (key === 'overflow' && value !== 'hidden' && value !== 'visible') {
      continue
    }

    // RN 은 calc() 를 못 읽는다. 넘기면 값이 무시되고 레이아웃이 무너지므로 버린다.
    if (typeof value === 'string' && value.includes('calc(')) {
      if (__DEV__) {
        console.warn(`[sx] calc() 는 RN 에서 동작하지 않는다: ${key}=${value}`)
      }
      continue
    }

    const spacingTargets = SPACING_MAP[key]
    if (spacingTargets != null && typeof value === 'number') {
      for (const target of spacingTargets) style[target] = value * 8
      continue
    }

    style[key] = value
  }

  return style as ViewStyle & TextStyle
}
