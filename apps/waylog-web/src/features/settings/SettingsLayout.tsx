import { Box, CircularProgress } from '@mui/material'
import { Outlet } from 'react-router'
import { useSyncAppSession } from '~shared/bridge/useWebviewSession'

export default function SettingsLayout() {
  const { isLoading } = useSyncAppSession()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={28} />
      </Box>
    )
  }

  return <Outlet />
}
