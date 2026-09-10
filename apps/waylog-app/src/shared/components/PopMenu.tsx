import { Entypo } from '@expo/vector-icons'
import { useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { palette } from '../config/tokens'
import { ActionSheet } from './action-sheet/ActionSheet'

// 웹 PopMenu 와 같은 사용법을 유지한다.
// 네이티브에는 앵커 기준 팝오버가 없어 ActionSheet 로 띄운다.
interface MenuProps {
  children?: ReactNode
  items: ReactNode
  trigger?: ReactNode
}

// 시트가 닫히는 동안 트리거를 다시 누르면 곧바로 재개된다. 그 사이를 막는다.
const REOPEN_BLOCK_DURATION = 250

export function PopMenu({ children, items, trigger }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const suppressTriggerRef = useRef(false)

  const openMenu = () => {
    if (suppressTriggerRef.current) return
    setIsOpen(true)
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
      {trigger != null ? <Pressable onPress={openMenu}>{trigger}</Pressable> : (
        <Pressable onPress={openMenu} style={styles.iconButton}>
          {children ?? <Entypo name="dots-three-vertical" size={14} color={palette.textSecondary} />}
        </Pressable>
      )}

      <ActionSheet isOpen={isOpen} onClose={closeMenu}>
        {items}
      </ActionSheet>
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
