import ProfileIcon from '@mui/icons-material/AccountCircle'
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed'
import LogoutIcon from '@mui/icons-material/Logout'
import LuggageIcon from '@mui/icons-material/Luggage'
import MapIcon from '@mui/icons-material/Map'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { signOut, useAuth } from '@waylog/domains/clients'
import { AppRoute } from '@waylog/routes'
import { useState } from 'react'
import { generatePath, Link, Outlet, PrefetchPageLinks, useLocation, useNavigate } from 'react-router'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useActivationSignal } from '~shared/hooks/interaction/useActivationSignal'
import { ScrollContainerProvider } from '~shared/hooks/interaction/useScrollRestore'


const TABS = [
  { label: '여행', path: AppRoute.메인, Icon: LuggageIcon },
  { label: '피드', path: AppRoute.피드, Icon: DynamicFeedIcon },
  { label: '탐색', path: AppRoute.탐색, Icon: MapIcon },
  { label: '통계', path: AppRoute.통계, Icon: ReceiptLongIcon },
]

export default function HomeLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile();
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)

  const { data: auth } = useAuth({ required: false });
  const mypagePath = auth != null ? generatePath(AppRoute.유저_프로필, { userId: auth.id }) : null
  const confirm = useConfirmDialog();

  if (isMobile) {
    return (
      <ScrollContainerProvider value={scrollElement}>
        <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Box ref={setScrollElement} className="scrollable" flex={1} overflow="auto" paddingBottom={`calc(${BottomNavigation.HEIGHT}px + env(safe-area-inset-bottom))`}>
            <Outlet />
          </Box>
          <BottomNavigation>
            {TABS.map(({ label, path, Icon }) => (
              <BottomNavigation.Menu
                key={path}
                icon={<Icon fontSize="small" color={location.pathname === path ? 'primary' : 'disabled'} />}
                isActived={location.pathname === path}
                onClick={() => navigate(path, { viewTransition: true })}
              >
                {label}
              </BottomNavigation.Menu>
            ))}
            {mypagePath != null && (
              <BottomNavigation.Menu
                icon={<ProfileIcon fontSize="small" color={location.pathname === mypagePath ? 'primary' : 'disabled'} />}
                isActived={location.pathname === mypagePath}
                onClick={() => navigate(mypagePath, { viewTransition: true })}
              >
                내 정보
              </BottomNavigation.Menu>
            )}
          </BottomNavigation>
        </Box>
        <Preload />
      </ScrollContainerProvider>
    )
  }

  return (
    <ScrollContainerProvider value={scrollElement}>
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
                  <Link to={path} viewTransition>
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
            {mypagePath != null && (
              <Tooltip title="내 프로필" placement="right">
                <Link to={mypagePath} viewTransition>
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
                      bgcolor: location.pathname === mypagePath ? 'primary.main' : 'transparent',
                      color: location.pathname === mypagePath ? 'primary.contrastText' : 'text.secondary',
                      transition: 'background-color 0.15s',
                      '&:hover': {
                        bgcolor: location.pathname === mypagePath ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ProfileIcon fontSize="small" sx={{ color: 'inherit' }} />
                    <Typography variant="caption" fontSize={10} fontWeight={location.pathname === mypagePath ? 700 : 400} sx={{ color: 'inherit' }}>
                      내 프로필
                    </Typography>
                  </Stack>
                </Link>
              </Tooltip>
            )}
          </Stack>
          <Tooltip title="로그아웃" placement="right">
            <IconButton
              onClick={async () => {
                if (await confirm('로그아웃 하시겠어요?')) {
                  signOut();
                }
              }}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* 콘텐츠 */}
        <Box ref={setScrollElement} flex={1} overflow="auto">
          <Outlet />
        </Box>
      </Box>
      <Preload />
    </ScrollContainerProvider>
  )
}

function Preload() {
  const [isActived, setIsActived] = useState(false);

  useActivationSignal(() => {
    setIsActived(true);
  }, { sensitivity: 'high', once: true })


  if (!isActived) return null;

  return (
    <>
      {TABS.map(x => <PrefetchPageLinks key={x.path} page={x.path} />)}
    </>
  )
}
