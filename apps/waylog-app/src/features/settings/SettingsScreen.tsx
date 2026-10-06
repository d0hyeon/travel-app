import { useQueryClient } from '@tanstack/react-query'
import { AuthGuard, deleteAccount, signOut } from '@waylog/domains/clients'
import { SignedOutRedirect } from '~features/auth/auth-redirect'
import { SettingsWebViewScreen } from './SettingsWebViewScreen'
import { AppBar } from '~shared/components/design-system/AppBar'
import { Divider, Stack, Typography } from '~shared/components/design-system'
import { ListItem } from '~shared/components/ListItem'
import { styled } from 'tamagui'
import { Alert, Pressable, StyleSheet } from 'react-native'
import { palette } from '~shared/config/tokens'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReactNode, useState } from 'react'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { toast } from '~shared/components/toast/toast'

export function SettingsScreen() {
  const navigation = useAppNavigation();
  const queryClient = useQueryClient()
  const confirm = useConfirmDialog()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  async function handleSignOut() {
    const isConfirmed = await confirm('로그아웃 하시겠어요?')
    if (!isConfirmed) return

    setIsSigningOut(true)
    try {
      await signOut()
      navigation.reset({ index: 0, routes: [{ name: AppRoute.메인 }] })
      queryClient.clear()
    } finally {
      setIsSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    const isConfirmed = await confirm('회원 탈퇴', {
      confirmText: '탈퇴',
      description: '탈퇴하면 내 여행, 게시물, 사진, 채팅 등 모든 기록이 삭제되고 복구할 수 없어요.\n다른 멤버가 있는 여행은 그 멤버에게 소유권이 넘어가요.',
    })
    if (!isConfirmed) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      navigation.reset({ index: 0, routes: [{ name: AppRoute.메인 }] })
      queryClient.clear()
    } catch {
      toast.error('일시적인 오류가 발생했어요', { description: '잠시 후 다시 시도해주세요' })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <AuthGuard fallback={<SignedOutRedirect />}>
      <SafeAreaView style={styles.root}>
        <AppBar title="설정" />

        <Stack px={2} mt={1}>
          <StyledItem onPress={() => navigation.navigate(AppRoute.계정_설정)}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="person" size={20} />
              <Typography variant="body1">내 정보 변경</Typography>
            </Stack>
            <MaterialIcons name="keyboard-arrow-right" size={20} />
          </StyledItem>
          <StyledItem onPress={() => navigation.navigate(AppRoute.저장된_장소)}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="bookmark-border" size={20} />
              <Typography variant="body1">저장된 장소</Typography>
            </Stack>
            <MaterialIcons name="keyboard-arrow-right" size={20} />
          </StyledItem>
          <StyledItem onPress={() => navigation.navigate(AppRoute.차단_목록)}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="block" size={20} />
              <Typography variant="body1">차단한 사용자</Typography>
            </Stack>
            <MaterialIcons name="keyboard-arrow-right" size={20} />
          </StyledItem>
          <StyledItem onPress={() => navigation.navigate(AppRoute.문의)}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="mail-outline" size={20} />
              <Typography variant="body1">문의하기</Typography>
            </Stack>
            <MaterialIcons name="keyboard-arrow-right" size={20} />
          </StyledItem>
          <Divider style={styles.divider} />
          <StyledItem disabled={isSigningOut} onPress={() => void handleSignOut()}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="logout" size={20} color={palette.error} />
              <Typography variant="body1" color="error">로그아웃</Typography>
            </Stack>
          </StyledItem>
          <StyledItem disabled={isDeletingAccount} onPress={() => void handleDeleteAccount()}>
            <Stack direction="row" gap={2}>
              <MaterialIcons name="person-remove" size={20} color={palette.error} />
              <Typography variant="body1" color="error">회원 탈퇴</Typography>
            </Stack>
          </StyledItem>
        </Stack>
      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  divider: { marginVertical: 12 },
})

const StyledItem = styled(Pressable, {
  display: 'flex',
  flexDirection: 'row',
  justify: 'space-between',
  items: 'center',
  paddingBlock: 16,
  paddingInline: 12,
})
