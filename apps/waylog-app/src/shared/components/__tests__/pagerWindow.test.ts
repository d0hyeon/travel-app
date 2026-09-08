import { describe, expect, it } from 'vitest'
import { isPageWithinRenderWindow } from '../pagerWindow'

describe('isPageWithinRenderWindow', () => {
  it('renders the active page and its immediate neighbours', () => {
    expect(isPageWithinRenderWindow(1, 2)).toBe(true)
    expect(isPageWithinRenderWindow(2, 2)).toBe(true)
    expect(isPageWithinRenderWindow(3, 2)).toBe(true)
  })

  it('leaves distant pages unrendered so their dates are never requested', () => {
    expect(isPageWithinRenderWindow(0, 2)).toBe(false)
    expect(isPageWithinRenderWindow(4, 2)).toBe(false)
  })
})
