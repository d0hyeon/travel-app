import { createContext, useContext } from 'react'
import { assert } from '@waylog/utility'
import type { TabNavigationContextValue } from './TabNavigation.types'

export const TabNavigationContext = createContext<TabNavigationContextValue | null>(null)

export function useTabNavigationContext() {
  const context = useContext(TabNavigationContext)
  assert(context != null, 'TabNavigation.Item은 TabNavigation 내부에서만 사용할 수 있습니다.')
  return context
}
