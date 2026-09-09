import { StyleSheet, Pressable, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'

interface Props {
  visible: boolean
  text: string
  onRequestClose: () => void
}

// MarkerView는 네이티브 Callout이 없어 탭 시 툴팁을 직접 그린다.
export function NativeMapTooltip({ visible, text, onRequestClose }: Props) {
  if (!visible) return null

  return (
    <Pressable
      onPress={onRequestClose}
      style={[styles.container, styles.position]}
    >
      <View>
        <Typography numberOfLines={4} style={styles.label}>
          {text}
        </Typography>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    marginBottom: 8,
    width: 120,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  label: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },

  position: {
    transform: [{ translateX: -60 }],
  },
})
