import { memo, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import { Marker } from 'react-native-maps'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/modules/map'
import { Image, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'

// 웹 MarkerProps 를 그대로 받는다.
// hover·우클릭이 없는 자리는 길게 누르기로 대응한다.
//
// icon 은 앱에만 있다. 웹은 SVG 를 data URI 로 만들어 thumbnailUrl 에 넣지만
// RN 의 Image 는 SVG data URI 를 못 읽어 그릴 것을 직접 받는다.
interface NativeMarkerProps extends MarkerProps {
  icon?: ReactNode
}

function NativeMapMarkerView({
  id,
  lat,
  lng,
  label,
  variant = 'pin',
  color,
  opacity = 1,
  outlined,
  thumbnailUrl,
  tooltip,
  icon,
  onClick,
  onContextMenu,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)
  // 콜백은 비교 대상이 아니므로 항상 최신 것을 호출하도록 고정한다.
  const handleClick = usePreservedCallback(() => onClick?.({ lat, lng, label, variant }))
  const handleContextMenu = usePreservedCallback(() => onContextMenu?.({ lat, lng, label, variant }))

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
      // 웹은 hover 로 보여주지만 네이티브에는 hover 가 없다.
      // 같은 정보를 말풍선으로 띄운다.
      title={toTooltipText(tooltip)}
      onPress={handleClick}
      onCalloutPress={handleContextMenu}
    >
      {/* 웹 marker.renderers 의 모양을 그대로 옮긴다. */}
      <View style={{ alignItems: 'center' }}>
        {label != null && (
          <View
            style={{
              backgroundColor: resolved,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              marginBottom: 2,
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>
              {label}
            </Typography>
          </View>
        )}

        {icon ?? (
          <MarkerShape
            variant={variant}
            color={resolved}
            opacity={opacity}
            outlined={outlined}
            thumbnailUrl={thumbnailUrl}
          />
        )}
      </View>
    </Marker>
  )
}

interface ShapeProps {
  variant: 'pin' | 'circle'
  color: string
  opacity: number
  outlined?: boolean
  thumbnailUrl?: string
}

function MarkerShape({ variant, color, opacity, outlined, thumbnailUrl }: ShapeProps) {
  // 사진이 있으면 원형 썸네일 + 아래 꼬리 (웹과 동일)
  if (thumbnailUrl != null) {
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: color,
            overflow: 'hidden',
            backgroundColor: '#eee',
          }}
        >
          <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: '100%' }} />
        </View>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
            marginTop: -1,
          }}
        />
      </View>
    )
  }

  if (variant === 'circle') {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16">
        {outlined === true ? (
          <Circle cx={8} cy={8} r={6} fill="white" fillOpacity={0.9} stroke={color} strokeWidth={2.5} />
        ) : (
          <>
            <Circle cx={8} cy={8} r={6} fill={color} fillOpacity={opacity} stroke="white" strokeWidth={4.5} />
            <Circle cx={8} cy={8} r={6} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={1} />
          </>
        )}
      </Svg>
    )
  }

  return (
    <Svg width={24} height={34} viewBox="0 0 20 30">
      <Path
        d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z"
        fill={color}
        fillOpacity={opacity}
      />
      <Circle cx={10} cy={10} r={4} fill="white" />
    </Svg>
  )
}

// 지도를 움직일 때마다 부모가 리렌더되어도 마커는 다시 그리지 않는다.
// 콜백은 usePreservedCallback 이 최신 것을 부르므로 비교에서 제외해도 안전하다.
export const NativeMapMarker = memo(NativeMapMarkerView, (prev, next) =>
  prev.id === next.id &&
  prev.lat === next.lat &&
  prev.lng === next.lng &&
  prev.label === next.label &&
  prev.variant === next.variant &&
  prev.color === next.color &&
  prev.opacity === next.opacity &&
  prev.outlined === next.outlined &&
  prev.thumbnailUrl === next.thumbnailUrl,
)

function toTooltipText(tooltip: MarkerProps['tooltip']): string | undefined {
  if (tooltip == null) return undefined
  return Array.isArray(tooltip) ? tooltip.join('\n') : tooltip
}
