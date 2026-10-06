import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import BlockIcon from '@mui/icons-material/Block'
import PersonIcon from '@mui/icons-material/Person'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { List, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { deleteAccount, signOut } from '@waylog/domains/clients'
import { AppRoute } from '@waylog/routes'
import { getWebViewBridge } from '~shared/bridge/bridgeClient'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { ContentContainer } from '~shared/components/layout/ContentContainer'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation as MobileNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

const { isInWebView, client: bridgeClient } = getWebViewBridge()

export default function SettingsPage() {
  const isMobile = useIsMobile()
  const TopNavigation = isMobile ? MobileNavigation : DesktopNavigation
  const navigate = useNavigate()
  const confirm = useConfirmDialog()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut();
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm('회원 탈퇴', {
      confirmLabel: '탈퇴',
      description: '탈퇴하면 내 여행, 게시물, 사진, 채팅 등 모든 기록이 삭제되고 복구할 수 없어요.\n다른 멤버가 있는 여행은 그 멤버에게 소유권이 넘어가요.',
    })
    if (!isConfirmed) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      navigate('/login', { replace: true })
    } catch {
      toast.error('탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <Stack>
      <TopNavigation
        position="sticky"
        leftElement={isInWebView ? <TopNavigation.BackButton onClick={() => bridgeClient.closeWebView()} /> : undefined}
        sx={isMobile ? { borderBottomWidth: 0 } : undefined}
      >
        설정
      </TopNavigation>
      <ContentContainer paddingY={isMobile ? 0 : 2}>
        <List disablePadding>
          <ListItemButton onClick={() => navigate('/settings/profile')}>
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="내 정보 변경" />
            <ChevronRightIcon color="disabled" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate(AppRoute.저장된_장소)}>
            <ListItemIcon><BookmarkBorderIcon /></ListItemIcon>
            <ListItemText primary="저장된 장소" />
            <ChevronRightIcon color="disabled" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate(AppRoute.차단_목록)}>
            <ListItemIcon><BlockIcon /></ListItemIcon>
            <ListItemText primary="차단한 사용자" />
            <ChevronRightIcon color="disabled" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate(AppRoute.문의)}>
            <ListItemIcon><MailOutlineIcon /></ListItemIcon>
            <ListItemText primary="문의하기" />
            <ChevronRightIcon color="disabled" />
          </ListItemButton>
          <ListItemButton disabled={isSigningOut} onClick={handleSignOut}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="로그아웃" slotProps={{ primary: { color: 'error' } }} />
          </ListItemButton>
          <ListItemButton disabled={isDeletingAccount} onClick={handleDeleteAccount}>
            <ListItemIcon><PersonRemoveIcon color="error" /></ListItemIcon>
            <ListItemText primary="회원 탈퇴" slotProps={{ primary: { color: 'error' } }} />
          </ListItemButton>
        </List>
      </ContentContainer>
    </Stack>
  )
}
