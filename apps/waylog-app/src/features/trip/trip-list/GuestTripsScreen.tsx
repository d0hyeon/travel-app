import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Button, Stack, Typography } from '~/shared/components/design-system'
import { AppRoute } from '../../../app/AppRoute'
import { palette, radius } from '../../../shared/config/tokens'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'

const ICON_TILE_SIZE = 88
const ICON_SIZE = 44
const BOTTOM_GAP = 24

export function GuestTripsScreen() {
  const navigation = useAppNavigation()
  const insets = useSafeAreaInsets()
  const openLogin = () => navigation.navigate(AppRoute.로그인, { returnTo: { screen: AppRoute.메인 } })

  return (
    <Box style={styles.screen}>
      <Typography variant="h5" style={[styles.pageTitle, { paddingTop: insets.top + 18 }]}>
        내 여행
      </Typography>

      <Stack style={styles.content}>
        <Box style={styles.iconTile}>
          <MaterialIcons name="luggage" size={ICON_SIZE} color={palette.primary} />
        </Box>
        <Typography variant="h6" fontWeight="bold" textAlign="center" style={styles.headline}>
          나만의 여행을 계획해보세요
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {'로그인하면 일정을 저장하고\n어디서든 이어서 볼 수 있어요'}
        </Typography>
      </Stack>

      <Box style={styles.actions}>
        <Button variant="contained" size="xlarge" fullWidth onPress={openLogin} >
          로그인하고 시작하기
        </Button>
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, },
  pageTitle: { fontSize: 26, paddingHorizontal: 18, paddingBottom: 18 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconTile: {
    width: ICON_TILE_SIZE,
    height: ICON_TILE_SIZE,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryContainer,
    marginBottom: 24,
  },
  headline: { marginBottom: 10 },
  actions: { flexDirection: 'row', paddingHorizontal: 20, flex: 0, marginBottom: 24. },
})
