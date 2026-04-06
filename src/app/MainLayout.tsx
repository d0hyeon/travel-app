import LuggageIcon from '@mui/icons-material/Luggage'
import MapIcon from '@mui/icons-material/Map'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { BottomNavigation } from '~shared/components/BottomNavigation'
import { useIsMobile } from '~shared/hooks/useIsMobile'

type Tab = 'trips' | 'map' | 'expenses'

const TABS = [
  { label: '여행', path: AppRoute.메인, Icon: LuggageIcon },
  { label: '지도', path: AppRoute.지도, Icon: MapIcon },
  { label: '통계', path: AppRoute.통계, Icon: ReceiptLongIcon },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()



  if (isMobile) {
    return (
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Box flex={1} overflow="auto" paddingBottom={`${BottomNavigation.HEIGHT}px`}>
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

      {/* 콘텐츠 */}
      <Box flex={1} overflow="auto">
        <Outlet />
      </Box>
    </Box>
  )
}
