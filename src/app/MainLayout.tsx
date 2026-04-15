import LogoutIcon from '@mui/icons-material/Logout'
import LuggageIcon from '@mui/icons-material/Luggage'
import MapIcon from '@mui/icons-material/Map'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { signOut } from '~features/auth/auth.api'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { ScrollContainerProvider } from '~shared/hooks/interaction/useScrollRestore'
import { isDev } from './env'


const TABS = [
  { label: '여행', path: AppRoute.메인, Icon: LuggageIcon },
  { label: '지도', path: AppRoute.지도, Icon: MapIcon },
  { label: '통계', path: AppRoute.통계, Icon: ReceiptLongIcon },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null)

  if (isMobile) {
    return (
      <ScrollContainerProvider value={scrollRef}>
        <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Box ref={scrollRef} flex={1} overflow="auto" paddingBottom={`calc(${BottomNavigation.HEIGHT}px + env(safe-area-inset-bottom))`}>
            <Outlet />
          </Box>
          <BottomNavigation>
            {TABS.map(({ label, path, Icon }) => (
              <BottomNavigation.Menu
                key={path}
                icon={<Icon fontSize="small" color={location.pathname === path ? 'primary' : 'disabled'} />}
                isActived={location.pathname === path}
                onClick={() => navigate(path)}
              >
                {label}
              </BottomNavigation.Menu>
            ))}
            {isDev && (
              <BottomNavigation.Menu
                icon={<LogoutIcon fontSize="small" color="disabled" />}
                isActived={false}
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                로그아웃
              </BottomNavigation.Menu>
            )}
          </BottomNavigation>
        </Box>
      </ScrollContainerProvider>
    )
  }

  return (
    <ScrollContainerProvider value={scrollRef}>
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
            zIndex: 100,
            justifyContent: 'space-between',
          }}
        >
          <Stack alignItems="center" gap={0.5}>
            {TABS.map(({ label, path, Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Tooltip key={path} title={label} placement="right">
                  <Link to={path}>
                    <Stack
                      component="button"
                      alignItems="center"
                      justifyContent="center"
                      gap={0.5}
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
                  </Link>
                </Tooltip>
              )
            })}
          </Stack>
          {isDev && (
            <Tooltip title="로그아웃" placement="right">
              <IconButton onClick={signOut} size="small" sx={{ color: 'text.secondary' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* 콘텐츠 */}
        <Box ref={scrollRef} flex={1} overflow="auto">
          <Outlet />
        </Box>
      </Box>
    </ScrollContainerProvider>
  )
}
