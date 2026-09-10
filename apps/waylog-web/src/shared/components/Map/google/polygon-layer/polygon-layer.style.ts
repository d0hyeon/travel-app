import { getRegionPolygonPaint } from '@waylog/domains/modules/map'

export function getPolygonFeatureStyle(
  feature: google.maps.Data.Feature,
  zoom: number,
): google.maps.Data.StyleOptions {
  const layerType = String(feature.getProperty('layerType') ?? 'polygon')
  const color = String(feature.getProperty('color') ?? '#82d2ae')
  const strokeColor = String(feature.getProperty('strokeColor') ?? color)
  const baseOpacity = Number(feature.getProperty('opacity') ?? 1)

  if (layerType === 'region' || layerType === 'country') {
    const paint = getRegionPolygonPaint({ kind: layerType, zoom, opacity: baseOpacity })

    if (!paint.isVisible) return { visible: false }

    return {
      visible: true,
      fillColor: color,
      fillOpacity: paint.fillOpacity,
      strokeColor,
      strokeWeight: paint.lineWidth,
      strokeOpacity: paint.lineOpacity,
      zIndex: paint.sortKey,
    }
  }

  if (baseOpacity <= 0.01) return { visible: false }

  return {
    visible: true,
    fillColor: color,
    fillOpacity: baseOpacity,
    strokeColor,
    strokeWeight: 1,
    strokeOpacity: Math.min(0.6, baseOpacity + 0.12),
    zIndex: 2,
  }
}
