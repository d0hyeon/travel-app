import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/map'

// tooltip·onContextMenu 는 받지 않는다. 네이티브에 hover 와 우클릭이 없어
// 소비자가 결정할 수 없는 값이다.
type NativeMarkerProps = Omit<MarkerProps, 'tooltip' | 'onContextMenu'>

export function NativeMapMarker({
  lat,
  lng,
  label,
  variant = 'pin',
  color,
  onClick,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)

  return (
    <NaverMapMarkerOverlay
      latitude={lat}
      longitude={lng}
      // 네이버는 image 를 주지 않으면 마커가 그려지지 않는다.
      // 기본 심볼에 웹 색상을 입힌다.
      image={{ symbol: 'green' }}
      width={variant === 'circle' ? 16 : 24}
      height={variant === 'circle' ? 16 : 32}
      tintColor={resolved}
      caption={label == null ? undefined : { text: label, color: '#333' }}
      onTap={() => onClick?.({ lat, lng, label, variant })}
    />
  )
}
