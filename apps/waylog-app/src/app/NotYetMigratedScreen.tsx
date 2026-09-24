import { useAppRoute } from '../shared/hooks/useAppNavigation'
import { Typography } from '../shared/components/design-system'
import { View, StyleSheet } from 'react-native'

/** Task 5, 6 진행 중 아직 실제 스크린으로 연결하지 않은 라우트의 임시 자리 표시. */
export function NotYetMigratedScreen() {
  const route = useAppRoute()
  return (
    <View style={styles.screen}>
      <Typography>{route.name} — 아직 연결되지 않음</Typography>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
