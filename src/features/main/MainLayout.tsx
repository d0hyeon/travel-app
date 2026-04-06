import LuggageIcon from '@mui/icons-material/Luggage'
import MapIcon from '@mui/icons-material/Map'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useIsMobile } from '~shared/hooks/useIsMobile'

type Tab = 'trips' | 'map' | 'expenses'

const TABS = [
  { id: 'trips' as Tab, label: '여행', path: '/', Icon: LuggageIcon },
  { id: 'map' as Tab, label: '지도', path: '/map', Icon: MapIcon },
  { id: 'expenses' as Tab, label: '지출', path: '/expenses', Icon: ReceiptLongIcon },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const currentTab: Tab = (() => {
    if (location.pathname === '/map') return 'map'
    if (location.pathname === '/expenses') return 'expenses'
    return 'trips'
  })()

  if (isMobile) {
    return (
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Box flex={1} overflow="auto" paddingBottom={`${BottomNavigation.HEIGHT}px`}>
          <Outlet />
        </Box>
        <BottomNavigation>
          {TABS.map(({ id, label, path, Icon }) => (
            <BottomNavigation.Menu
              key={id}
              icon={<Icon fontSize="small" color={currentTab === id ? 'primary' : 'disabled'} />}
              isActived={currentTab === id}
              onClick={() => navigate(path)}
            >
              {label}
            </BottomNavigation.Menu>
          ))}
        </BottomNavigation>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100dvh', display: 'flex' }}>
      {/* 사이드 네비 */}
      <Stack
        sx={{
          width: 72,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          alignItems: 'center',
          py: 2,
          gap: 0.5,
          zIndex: 100
        }}
      >
        {TABS.map(({ id, label, path, Icon }) => {
          const isActive = currentTab === id
          return (
            <Tooltip key={id} title={label} placement="right">
              <Stack
                component="button"
                alignItems="center"
                justifyContent="center"
                gap={0.5}
                onClick={() => navigate(path)}
                sx={{
                  width: 52,
                  py: 1.25,
                  borderRadius: 2,
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <Icon fontSize="small" sx={{ color: 'inherit' }} />
                <Typography variant="caption" fontSize={10} fontWeight={isActive ? 700 : 400} sx={{ color: 'inherit' }}>
                  {label}
                </Typography>
              </Stack>
            </Tooltip>
          )
        })}
      </Stack>

      {/* 콘텐츠 */}
      <Box flex={1} overflow="auto">
        <Outlet />
      </Box>
    </Box>
  )
}
