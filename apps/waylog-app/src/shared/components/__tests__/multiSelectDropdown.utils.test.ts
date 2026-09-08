import { describe, expect, it } from 'vitest'
import { getDisplayLabel } from '../multiSelectDropdown.utils'

const OPTIONS = [
  { value: 'a', label: '성산일출봉' },
  { value: 'b', label: '협재해변' },
  { value: 'c', label: '한라산' },
]

describe('getDisplayLabel', () => {
  it('shows the placeholder while nothing is selected', () => {
    expect(getDisplayLabel([], OPTIONS, '장소')).toBe('장소')
  })

  it('shows the single selected label as is', () => {
    expect(getDisplayLabel(['a'], OPTIONS, '장소')).toBe('성산일출봉')
  })

  it('joins exactly two selected labels', () => {
    expect(getDisplayLabel(['a', 'b'], OPTIONS, '장소')).toBe('성산일출봉, 협재해변')
  })

  it('summarises three or more as the first label plus a remainder count', () => {
    expect(getDisplayLabel(['a', 'b', 'c'], OPTIONS, '장소')).toBe('성산일출봉 외 2')
  })

  it('falls back to the placeholder when the selected value has no option', () => {
    expect(getDisplayLabel(['missing'], OPTIONS, '장소')).toBe('장소')
  })
})
