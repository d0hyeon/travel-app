import type { ReactNode } from 'react'

export type TabNavigationVariant = 'default' | 'apple'

export interface TabNavigationContextValue {
  activeKey: string
  variant: TabNavigationVariant
  onSelect: (key: string) => void
}

export interface TabNavigationProps {
  variant: TabNavigationVariant
  value?: string
  defaultValue?: string
  onChange?: (key: string) => void
  children: ReactNode
}

export interface TabNavigationItemProps {
  value: string
  label: string
  icon: (props: { color: string; focused: boolean }) => ReactNode
}
