import { Pressable, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'

interface Props {
  title: string
  onMore: () => void
}

export function SectionHeader({ title, onMore }: Props) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="subtitle1">{title}</Typography>
      <Pressable onPress={onMore}>
        <Typography variant="caption" color="text.secondary">더보기 ›</Typography>
      </Pressable>
    </View>
  )
}
