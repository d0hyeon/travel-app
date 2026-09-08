import { memo, useEffect, useState, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import Mapbox from '@rnmapbox/maps'
import { resolveMarkerColor, type MarkerProps } from '@waylog/domains/modules/map'
import { Image, Pressable, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '../mui'
import { useMapContext } from './MapContext'
import { useRegisterMapMarker } from './useMapMarkerRegistry'
import { NativeMapTooltip } from './NativeMapTooltip'

interface NativeMarkerProps extends MarkerProps {
  icon?: ReactNode
}

const MAX_LABEL_WIDTH = 120

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
  const handleClick = usePreservedCallback(() => onClick?.({ lat, lng, label, variant }))
  const handleContextMenu = usePreservedCallback(() => onContextMenu?.({ lat, lng, label, variant }))

  const registryId = id ?? `${lat},${lng}`

  const { config, extendBound, visibleMarkerIds } = useMapContext()
  useRegisterMapMarker({ id: registryId, lat, lng })

  useEffect(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipText = toTooltipText(tooltip)

  const isVisible = visibleMarkerIds == null || visibleMarkerIds.has(registryId)
  if (!isVisible) return null

  return (
    <Mapbox.MarkerView coordinate={[lng, lat]} anchor={{ x: 0.5, y: 1 }} allowOverlap>
      <Pressable
        onPress={() => {
          if (tooltipText != null) {
            setIsTooltipVisible((visible) => !visible)
            return
          }
          handleClick()
        }}
        onLongPress={handleContextMenu}
      >
        <View style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}>
          {tooltipText != null && (
            <NativeMapTooltip
              visible={isTooltipVisible}
              text={tooltipText}
              onRequestClose={() => setIsTooltipVisible(false)}
            />
          )}

          {label != null && (
            <View
              style={{
                maxWidth: MAX_LABEL_WIDTH,
                backgroundColor: resolved,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
                marginBottom: 8,
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

          <View style={{ minWidth: TOUCH_TARGET_SIZE, alignItems: 'center', justifyContent: 'flex-end' }}>
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
      </Pressable>
    </Mapbox.MarkerView>
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

export const NativeMapMarker = memo(NativeMapMarkerView, (prev, next) =>
  prev.id === next.id &&
  prev.lat === next.lat &&
  prev.lng === next.lng &&
  prev.label === next.label &&
  prev.variant === next.variant &&
  prev.color === next.color &&
  prev.opacity === next.opacity &&
  prev.outlined === next.outlined &&
  prev.thumbnailUrl === next.thumbnailUrl &&
  toTooltipText(prev.tooltip) === toTooltipText(next.tooltip),
)

function toTooltipText(tooltip: MarkerProps['tooltip']): string | undefined {
  if (tooltip == null) return undefined
  return Array.isArray(tooltip) ? tooltip.join('\n') : tooltip
}
