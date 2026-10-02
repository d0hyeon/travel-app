import { describe, expect, it } from 'vitest'
import { appThemes } from '../../../../tamagui.config'
import { palette } from '../../config/tokens'

describe('Tamagui app themes', () => {
  it('keeps the default surface light', () => {
    expect(appThemes.light.background).toBe('#fff')
    expect(appThemes.light.color).toBe('#1a1a1a')
    expect(appThemes.light.primary).toBe(palette.primary)
    expect(appThemes.light.onPrimary).toBe('#fff')
  })

  it('uses a dark surface with white foreground text', () => {
    expect(appThemes.dark.background).toBe('#2b2b2b')
    expect(appThemes.dark.color).toBe('#fff')
    expect(appThemes.dark.primary).toBe(palette.primary)
    expect(appThemes.dark.onSurface).toBe('#fff')
  })

  it('tints the menu glass translucent white on light and grey.800 on dark', () => {
    expect(appThemes.light.glass).toBe('rgba(255,255,255,0.3)')
    expect(appThemes.dark.glass).toBe('rgba(66,66,66,0.85)')
  })

  it('uses a brighter danger color on the dark surface', () => {
    expect(appThemes.light.danger).toBe(palette.error)
    expect(appThemes.dark.danger).not.toBe(palette.error)
  })
})
