import { createContext, useContext } from 'react'
import type { SharedValue } from 'react-native-reanimated'

export interface MenuFabContextValue {
  menuProgress: SharedValue<number>
  index: number
  itemCount: number
  isOpen: boolean
  closeMenu: () => void
  /**
   * 메뉴 뒤에 깔리는 배경. 지도·사진처럼 색이 있는 배경은 유리가 그 색을
   * 굴절시켜 존재감을 만들지만, 흰 리스트 화면 위에서는 굴절할 색이 없어
   * 같은 틴트가 옅은 회색 판으로 보인다. 그래서 흰 배경일 때 틴트를 더 준다.
   */
  surface: 'colored' | 'plain'
}

export const MenuFabContext = createContext<MenuFabContextValue | null>(null)

export function useMenuFabContext(): MenuFabContextValue {
  const context = useContext(MenuFabContext)

  if (context == null) {
    throw new Error('MenuFab.Item 은 MenuFab 안에서만 쓸 수 있다')
  }

  return context
}
