import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { View, type ViewStyle } from 'react-native'

/** 공개 상태 사진에 표시하는 작은 아이콘 뱃지. 좌측 상단 등에 배치해서 사용한다. */
export function PhotoVisibilityBadge({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ borderRadius: 999, overflow: 'hidden' }, style]}>
      <BlurView intensity={40} tint="dark" style={{ padding: 3 }}>
        <MaterialIcons name="public" size={14} color="#fff" />
      </BlurView>
    </View>
  )
}
