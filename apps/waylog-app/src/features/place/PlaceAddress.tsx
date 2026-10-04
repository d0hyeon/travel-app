import { MaterialIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { Pressable, StyleSheet } from 'react-native'
import { toast } from 'sonner-native'
import { Stack, Typography } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'

interface Props {
  address: string
}

export function PlaceAddress({ address }: Props) {
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Typography variant="body2" color="text.secondary" style={styles.address}>{address}</Typography>
      <Pressable
        accessibilityLabel="주소 복사"
        hitSlop={8}
        onPress={async () => {
          await Clipboard.setStringAsync(address)
          toast.success('주소가 복사되었어요')
        }}
      >
        <MaterialIcons name="content-copy" size={16} color={palette.textDisabled} />
      </Pressable>
    </Stack>
  )
}

const styles = StyleSheet.create({
  address: { flexShrink: 1 },
})
