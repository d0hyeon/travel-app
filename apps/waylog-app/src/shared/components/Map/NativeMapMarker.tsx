import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/map'
import { Image, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'

// tooltip·onContextMenu 는 받지 않는다. 네이티브에 hover 와 우클릭이 없어
// 소비자가 결정할 수 없는 값이다.
type NativeMarkerProps = Omit<MarkerProps, 'tooltip' | 'onContextMenu'>

export function NativeMapMarker({
  lat,
  lng,
  label,
  variant = 'pin',
  color,
  opacity = 1,
  outlined,
  thumbnailUrl,
  onClick,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)

  return (
    <NaverMapMarkerOverlay
      latitude={lat}
      longitude={lng}
      anchor={{ x: 0.5, y: 1 }}
      onTap={() => onClick?.({ lat, lng, label, variant })}
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

        <MarkerShape
          variant={variant}
          color={resolved}
          opacity={opacity}
          outlined={outlined}
          thumbnailUrl={thumbnailUrl}
        />
      </View>
    </NaverMapMarkerOverlay>
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
