import { describe, expect, it } from 'vitest'
import { resolveButtonColors } from '../Button.theme'

describe('resolveButtonColors', () => {
  const theme = {
    danger: '#e5484d',
    onPrimary: '#fff',
    onSurface: '#fff',
    primary: '#2f6feb',
  }

  it('uses the active theme primary color for contained buttons', () => {
    expect(resolveButtonColors('contained', 'primary', theme)).toEqual({
      backgroundColor: '#2f6feb',
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: '#fff',
    })
  })

  it('keeps outlined destructive actions transparent and danger-colored', () => {
    expect(resolveButtonColors('outlined', 'error', theme)).toEqual({
      backgroundColor: 'transparent',
      borderColor: '#e5484d',
      borderWidth: 1,
      textColor: '#e5484d',
    })
  })

  it('uses the current surface foreground for inherit text buttons', () => {
    expect(resolveButtonColors('text', 'inherit', theme).textColor).toBe('#fff')
  })
})
