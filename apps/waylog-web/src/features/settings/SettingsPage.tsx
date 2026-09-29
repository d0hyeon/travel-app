import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import { List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signOut } from '@waylog/domains/clients'
import { getWebViewBridge } from '~shared/bridge/bridgeClient'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { client } = getWebViewBridge()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut();
      if (client) {
        await client.notifyAuthSignedOut().catch(() => undefined)
        await client.closeWebView().catch(() => undefined)
        return
      }
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Stack>
      <Typography variant="h6" px={2} py={2}>설정</Typography>
      <List disablePadding>
        <ListItemButton onClick={() => navigate('/settings/profile')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="내 정보 변경" />
          <ChevronRightIcon color="disabled" />
        </ListItemButton>
        <ListItemButton disabled={isSigningOut} onClick={handleSignOut}>
          <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
          <ListItemText primary="로그아웃" slotProps={{ primary: { color: 'error' } }} />
        </ListItemButton>
      </List>
    </Stack>
  )
}
