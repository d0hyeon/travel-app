import { Box, CircularProgress } from '@mui/material'
import { Outlet } from 'react-router'
import { useWebviewSession } from '~shared/bridge/useWebviewSession'

export default function SettingsLayout() {
  const sessionState = useWebviewSession()

  if (sessionState === 'checking') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={28} />
      </Box>
    )
  }

  return <Outlet />
}
