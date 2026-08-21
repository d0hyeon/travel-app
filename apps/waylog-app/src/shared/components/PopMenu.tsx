import { createContext, useContext, useState, type ReactNode } from 'react'
import { Modal, Pressable } from 'react-native'
import { palette, radius } from '../config/tokens'
import { Box, Stack, Typography } from './mui'
import { IconButton } from './mui/IconButton'

// 웹 PopMenu 와 같은 사용법을 유지한다.
// 네이티브에는 앵커 기준 팝오버가 없어 하단 시트로 띄운다.
interface MenuProps {
  children?: ReactNode
  items: ReactNode
}

export function PopMenu({ children, items }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <IconButton size="small" onClick={() => setIsOpen(true)}>
        {children ?? <Typography sx={{ fontSize: 18, color: palette.textSecondary }}>⋮</Typography>}
      </IconButton>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable
          onPress={() => setIsOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        >
          <Box
            sx={{
              backgroundColor: palette.background,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingVertical: 8,
            }}
          >
            <MenuCloseContext.Provider value={() => setIsOpen(false)}>
              {items}
            </MenuCloseContext.Provider>
          </Box>
        </Pressable>
      </Modal>
    </>
  )
}

const MenuCloseContext = createContext<() => void>(() => {})

interface MenuItemProps {
  onClick?: () => void
  icon?: ReactNode
  children?: ReactNode
  color?: 'text' | 'error'
}

PopMenu.Item = function MenuItem({ onClick, icon, children, color = 'text' }: MenuItemProps) {
  const close = useContext(MenuCloseContext)

  return (
    <Pressable
      onPress={() => {
        close()
        onClick?.()
      }}
      style={{ paddingHorizontal: 20, paddingVertical: 14 }}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {icon}
        <Typography
          variant="body1"
          sx={{ color: color === 'error' ? '#d32f2f' : palette.text }}
        >
          {children}
        </Typography>
      </Stack>
    </Pressable>
  )
}
