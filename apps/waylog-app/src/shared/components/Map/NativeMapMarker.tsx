import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/map'
import { Marker } from 'react-native-maps'
import { StyleSheet, Text, View } from 'react-native'

// tooltip·onContextMenu 는 받지 않는다. 네이티브에 hover 와 우클릭이 없어
// 소비자가 결정할 수 없는 값이다.
type NativeMarkerProps = Omit<MarkerProps, 'tooltip' | 'onContextMenu'>

export function NativeMapMarker({
  id,
  lat,
  lng,
  label,
  variant = 'pin',
  color,
  opacity = 1,
  outlined,
  onClick,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude: lat, longitude: lng }}
      opacity={opacity}
      onPress={() => onClick?.({ lat, lng, label, variant })}
    >
      <View
        style={[
          variant === 'circle' ? styles.circle : styles.pin,
          { backgroundColor: outlined ? '#fff' : resolved, borderColor: resolved },
        ]}
      >
        {label != null && (
          <Text style={[styles.label, outlined && { color: resolved }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    </Marker>
  )
}

const styles = StyleSheet.create({
  pin: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  label: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
