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
})
