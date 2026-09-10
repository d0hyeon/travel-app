import { createContext, useContext } from 'react'
import type { SharedValue } from 'react-native-reanimated'

export interface MenuFabContextValue {
  menuProgress: SharedValue<number>
  index: number
  itemCount: number
  isOpen: boolean
  closeMenu: () => void
}

export const MenuFabContext = createContext<MenuFabContextValue | null>(null)

export function useMenuFabContext(): MenuFabContextValue {
  const context = useContext(MenuFabContext)

  if (context == null) {
    throw new Error('MenuFab.Item 은 MenuFab 안에서만 쓸 수 있다')
  }

  return context
}
