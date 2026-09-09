import { StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'

export function ExplorerEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Typography variant="body2" color="text.secondary">자료를 찾을 수 없어요</Typography>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 32 },
})
