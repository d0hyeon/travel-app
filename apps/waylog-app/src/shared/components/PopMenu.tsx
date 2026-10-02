import { Entypo } from '@expo/vector-icons'
import { useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, type View } from 'react-native'
import { useTheme } from 'tamagui'
import { ActionSheet } from './action-sheet/ActionSheet'
import { AnchoredMenu } from './AnchoredMenu'
import type { Rect } from './anchoredMenu.utils'

interface MenuProps {
  children?: ReactNode
  items: ReactNode
  trigger?: ReactNode
  variant?: 'actionSheet' | 'menu'
}

// 시트가 닫히는 동안 트리거를 다시 누르면 곧바로 재개된다. 그 사이를 막는다.
const REOPEN_BLOCK_DURATION = 250

export function PopMenu({ children, items, trigger, variant = 'actionSheet' }: MenuProps) {
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<Rect | null>(null)
  const triggerRef = useRef<View>(null)
  const suppressTriggerRef = useRef(false)

  const openMenu = () => {
    if (suppressTriggerRef.current) return

    if (variant === 'actionSheet') {
      setIsOpen(true)
      return
    }

    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerRect({ x, y, width, height })
      setIsOpen(true)
    })
  }

  const closeMenu = () => {
    suppressTriggerRef.current = true
    setIsOpen(false)
    setTimeout(() => {
      suppressTriggerRef.current = false
    }, REOPEN_BLOCK_DURATION)
  }

  return (
    <>
      <Pressable ref={triggerRef} onPress={openMenu} style={trigger != null ? undefined : styles.iconButton}>
        {trigger ?? children ?? <Entypo name="dots-three-vertical" size={14} color={theme.onSurfaceMuted.val} />}
      </Pressable>

      {variant === 'actionSheet' ? (
        <ActionSheet isOpen={isOpen} onClose={closeMenu}>
          {items}
        </ActionSheet>
      ) : (
        <AnchoredMenu isOpen={isOpen} onClose={closeMenu} anchor={triggerRect}>
          {items}
        </AnchoredMenu>
      )}
    </>
  )
}

PopMenu.Item = ActionSheet.Item

const styles = StyleSheet.create({
  iconButton: {
    width: 'auto',
    height: 'auto',
    padding: 12,
    margin: -12,
  },
})
