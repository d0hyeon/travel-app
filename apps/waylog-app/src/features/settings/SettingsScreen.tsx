import { AuthGuard } from '@waylog/domains/clients'
import { RequireAuthRedirect } from '../auth/auth-redirect'
import { SettingsWebViewScreen } from './SettingsWebViewScreen'
import { AppBar } from '~shared/components/design-system/AppBar'
import { Stack, Typography } from '~shared/components/design-system'
import { ListItem } from '~shared/components/ListItem'
import { styled, View } from 'tamagui'
import { Pressable, StyleSheet } from 'react-native'
import { palette } from '~shared/config/tokens'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReactNode } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'

export function SettingsScreen() {
  const navigation = useAppNavigation();


  return (
    <AuthGuard fallback={<RequireAuthRedirect />}>
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
        </Stack>
      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background }
})

const StyledItem = styled(Pressable, {
  display: 'flex',
  flexDirection: 'row',
  justify: 'space-between',
  items: 'center',
  paddingBlock: 16,
  paddingInline: 12,
})
