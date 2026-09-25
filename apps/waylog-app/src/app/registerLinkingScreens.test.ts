import { describe, expect, it } from 'vitest'
import { registerLinkingScreens } from './registerLinkingScreens'

describe('registerLinkingScreens', () => {
  it('치환된 이름을 키로, 원본 경로를 값으로 매핑한다', () => {
    expect(registerLinkingScreens(['/trip/invite/:shareLink'])).toEqual({
      '/trip/invite/_shareLink': '/trip/invite/:shareLink',
    })
  })

  it('여러 경로를 한 번에 등록한다', () => {
    expect(registerLinkingScreens(['/', '/trip/invite/:shareLink'])).toEqual({
      '/': '/',
      '/trip/invite/_shareLink': '/trip/invite/:shareLink',
    })
  })
})
