import { Pressable, View } from 'react-native'
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
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: [{ translateX: -60 }],
        marginBottom: 8,
        width: 120,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.85)',
      }}
    >
      <View>
        <Typography numberOfLines={4} style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
          {text}
        </Typography>
      </View>
    </Pressable>
  )
}
