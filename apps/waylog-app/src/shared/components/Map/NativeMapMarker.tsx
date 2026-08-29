import { memo, useEffect, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import { Marker } from 'react-native-maps'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/modules/map'
import { Image, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'
import { useMapContext } from './MapContext'

// 웹 MarkerProps 를 그대로 받는다.
// hover·우클릭이 없는 자리는 길게 누르기로 대응한다.
//
// icon 은 앱에만 있다. 웹은 SVG 를 data URI 로 만들어 thumbnailUrl 에 넣지만
// RN 의 Image 는 SVG data URI 를 못 읽어 그릴 것을 직접 받는다.
interface NativeMarkerProps extends MarkerProps {
  icon?: ReactNode
}

// 라벨은 콘텐츠 크기에 맞추되, 지도를 과하게 가리지 않도록 상한을 둔다.
const MAX_LABEL_WIDTH = 120

// 시각 크기는 줄이되, 터치 영역은 그보다 넓게 둔다. react-native-maps 는
// hitSlop 이 없어 Marker 의 실제 렌더 크기가 곧 터치 영역이므로, 아이콘을
// 투명 패딩으로 감싸 터치 영역만 키운다.
const TOUCH_TARGET_SIZE = 44
const PIN_SIZE = { width: 17, height: 25 }
const CIRCLE_SIZE = 18
const THUMBNAIL_SIZE = 38

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

  // 부모가 자식 트리를 스캔하는 대신, 마운트 시점에 스스로 좌표를 등록한다.
  // Suspense·조건부 렌더로 감싸인 마커도 부모의 정적 순회 없이 자동으로 반영된다.
  const { config, extendBound } = useMapContext()
  useEffect(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tracksViewChanges 를 겉모습이 바뀔 때마다 토글하면, 줌으로 마커 여러 개의
  // variant 가 한꺼번에 바뀔 때 네이티브 스냅샷 재캡처가 몰려 크래시로 이어진다.
  // 대신 겉모습을 이 Marker 엘리먼트의 key 에 실어 React 가 새 인스턴스로
  // 마운트하게 한다 — 형제가 하나뿐이어도 key 가 바뀌면 재조정은 언마운트+마운트로
  // 처리하므로, 소비자 쪽 key 없이 이 컴포넌트 내부에서만 해결된다.
  // 마운트 시점엔 항상 스냅샷이 한 번 찍히므로 tracksViewChanges 는 계속 false 로 둔다.
  const appearanceKey = `${label ?? ''}:${variant}:${resolved}:${opacity}:${outlined ?? false}:${thumbnailUrl ?? ''}`

  return (
    <Marker
      key={appearanceKey}
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
      <View style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}>
        {label != null && (
          <View
            style={{
              maxWidth: MAX_LABEL_WIDTH,
              backgroundColor: resolved,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              marginBottom: 2,
            }}
          >
            <Typography
              numberOfLines={1}
              ellipsizeMode="tail"
              sx={{ color: '#fff', fontSize: 11, fontWeight: '900' }}
            >
              {label}
            </Typography>
          </View>
        )}

        {/* 시각 크기(MarkerShape)보다 터치 영역을 넓게 둔다. 하단 정렬로 감싸
            앵커(좌표가 가리키는 지점)는 아이콘의 실제 바닥과 그대로 맞는다. */}
        <View style={{ minWidth: TOUCH_TARGET_SIZE, minHeight: TOUCH_TARGET_SIZE, alignItems: 'center', justifyContent: 'flex-end' }}>
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
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            borderRadius: THUMBNAIL_SIZE / 2,
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
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox="0 0 16 16">
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
    <Svg width={PIN_SIZE.width} height={PIN_SIZE.height} viewBox="0 0 20 30">
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
