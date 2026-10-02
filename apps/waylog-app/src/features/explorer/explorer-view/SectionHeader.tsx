import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'

interface Props {
  title: string
  onMore: () => void
}

export function SectionHeader({ title, onMore }: Props) {
  return (
    <View style={styles.header}>
      <Typography variant="subtitle1">{title}</Typography>
      <Pressable onPress={onMore} style={styles.more}>
        <Typography variant="caption" color="text.secondary">더보기</Typography>
        <MaterialIcons name="keyboard-arrow-right" size={16} color={palette.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { flexDirection: 'row', alignItems: 'center' },
})
