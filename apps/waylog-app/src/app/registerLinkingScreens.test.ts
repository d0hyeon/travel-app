import { AppRoute as BaseAppRoute } from '@waylog/routes'
import { describe, expect, it } from 'vitest'
import { AppRoute } from './AppRoute'
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

  it('linking.config 키가 RootStack.Screen name과 같은 로컬 AppRoute에서 나온다', () => {
    const screens = registerLinkingScreens([BaseAppRoute.여행_초대])

    expect(Object.keys(screens)).toContain(AppRoute.여행_초대)
  })
})
