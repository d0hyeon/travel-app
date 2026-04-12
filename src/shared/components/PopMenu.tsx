import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem as MuiMenuItem,
  MenuList,
  Paper,
  Popper,
  type MenuItemProps as MuiMenuItemProps,
  useTheme,
  Box
} from "@mui/material";
import { cloneElement, createContext, isValidElement, useContext, useMemo, useState, type ReactElement, type ReactNode } from "react";

interface MenuContextValue {
  close: () => void
}

const MenuContext = createContext<MenuContextValue>({ close: () => { } })

interface MenuProps {
  /** 트리거 요소 (생략 시 MoreVertIcon 버튼) */
  children?: ReactNode
  /** 메뉴 아이템들 */
  items?: ReactNode[] | ReactNode;
  list?: ReactNode;
}

export function PopMenu({ children, list, items }: MenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClose = () => setAnchorEl(null)
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setAnchorEl(e.currentTarget)
  }

  const trigger = children
    ? isValidElement(children)
      ? cloneElement(children as ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>, { onClick: handleOpen })
      : children
    : (
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
    )

  const maxHeight = useMemo(() => {
    if (!anchorEl) return 300
    const rect = anchorEl.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 16
    return Math.max(spaceBelow, 150)
  }, [anchorEl])

  return (
    <>
      <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex' }}>
        {trigger}
      </span>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="bottom-end"
        sx={theme => ({ zIndex: theme.zIndex.tooltip })}
        transition
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={8} sx={{ maxHeight, overflow: 'auto' }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuContext.Provider value={{ close: handleClose }}>
                  {list ?? (
                    <MenuList>
                      {items}
                    </MenuList>
                  )}

                </MenuContext.Provider>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  )
}

PopMenu.List = MenuList;

interface MenuItemProps extends Omit<MuiMenuItemProps, 'onClick' | 'color'> {
  onClick?: () => void
  icon?: ReactNode;
  color?: 'error' | 'primary' | 'text'
}

PopMenu.Item = function MenuItem({ onClick, icon, children, color = 'text', ...props }: MenuItemProps) {
  const { close } = useContext(MenuContext)
  const theme = useTheme();
  const _color = color === 'text'
    ? theme.palette.text.primary
    : theme.palette[color].main

  return (
    <MuiMenuItem
      onClick={() => {
        onClick?.()
        close()
      }}
      sx={{ color: _color, display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      {...props}
    >
      {icon && (
        <Box marginLeft={-1} marginRight={0.5} display="inline-flex">
          {icon}
        </Box>
      )}
      <Box>
        {children}
      </Box>
    </MuiMenuItem>
  )
}
