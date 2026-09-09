import { memo, useEffect, useState, type ReactNode } from 'react'
import { usePreservedCallback } from '@waylog/react'
import Mapbox from '@rnmapbox/maps'
import { resolveMarkerColor, type MarkerCallbackData, type MarkerProps } from '@waylog/domains/modules/map'
import { StyleSheet, Image, Pressable, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Typography } from '~/shared/components/design-system'
import { useMapContext } from './MapContext'
import { useRegisterMapMarker } from './useMapMarkerRegistry'
import { NativeMapTooltip } from './NativeMapTooltip'

interface NativeMarkerProps extends Omit<MarkerProps, 'onClick'> {
  icon?: ReactNode
  onPress?: (marker: MarkerCallbackData) => void
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
  onPress,
  onContextMenu,
}: NativeMarkerProps) {
  const resolved = resolveMarkerColor(color, variant)
  const handleClick = usePreservedCallback(() => onPress?.({ lat, lng, label, variant }))
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
        <View style={styles.labelTouchArea}>
          {tooltipText != null && (
            <NativeMapTooltip
              visible={isTooltipVisible}
              text={tooltipText}
              onRequestClose={() => setIsTooltipVisible(false)}
            />
          )}

          {label != null && (
            <View
              style={[styles.labelBubble, { backgroundColor: resolved }]}
            >
              <Typography
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.labelText}
              >
                {label}
              </Typography>
            </View>
          )}

          <View style={styles.markerTouchArea}>
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
      <View style={styles.marker}>
        <View
          style={[styles.thumbnailFrame, { borderColor: color }]}
        >
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        </View>
        <View
          style={[styles.pointer, { borderTopColor: color }]}
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

const styles = StyleSheet.create({
  labelTouchArea: {
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labelBubble: {
    maxWidth: MAX_LABEL_WIDTH,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  markerTouchArea: {
    minWidth: TOUCH_TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  marker: {
    alignItems: 'center',
  },
  thumbnailFrame: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
})
