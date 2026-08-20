import { Children, isValidElement, type ReactNode } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { palette } from '../../config/tokens'
import { Typography } from './Typography'
import type { Sx } from './sx'

export interface TabProps {
  value: string
  label: string
}

// 실제 렌더는 Tabs 가 한다. MUI 처럼 선언만 받는다.
export function Tab(_props: TabProps) {
  return null
}

export interface TabsProps {
  value: string
  onChange: (event: unknown, value: string) => void
  children?: ReactNode
  sx?: Sx
}

export function Tabs({ value, onChange, children }: TabsProps) {
  const tabs = Children.toArray(children)
    .filter(isValidElement<TabProps>)
    .map((child) => child.props)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: palette.divider }}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value

        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(null, tab.value)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: selected ? palette.primary : 'transparent',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: selected ? palette.primary : palette.textSecondary }}
            >
              {tab.label}
            </Typography>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
