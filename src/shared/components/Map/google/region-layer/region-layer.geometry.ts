import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from './region-layer.types'
import type { DestinationRegionDefinition } from '../../region-layer.types'

interface Point {
  lat: number
  lng: number
}

function isPointInRing(point: Point, ring: number[][]) {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0]
    const yi = ring[i]?.[1]
    const xj = ring[j]?.[0]
    const yj = ring[j]?.[1]

    if ([xi, yi, xj, yj].some((value) => typeof value !== 'number')) continue

    const intersects = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi)

    if (intersects) inside = !inside
  }

  return inside
}

function isPointInPolygon(point: Point, polygon: number[][][]) {
  if (!polygon.length) return false
  if (!isPointInRing(point, polygon[0] ?? [])) return false

  for (let i = 1; i < polygon.length; i += 1) {
    if (isPointInRing(point, polygon[i] ?? [])) return false
  }

  return true
}

function containsPoint(geometry: GeoJsonGeometry | null, point: Point) {
  if (!geometry) return false

  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates as number[][][])
  }

  return (geometry.coordinates as number[][][][]).some((polygon) => isPointInPolygon(point, polygon))
}

function getGeometryCenter(geometry: GeoJsonGeometry | null) {
  if (!geometry) return null

  let latSum = 0
  let lngSum = 0
  let count = 0

  const addCoordinate = (lng: number, lat: number) => {
    lngSum += lng
    latSum += lat
    count += 1
  }

  if (geometry.type === 'Polygon') {
    ;(geometry.coordinates as number[][][]).forEach((ring) => {
      ring.forEach(([lng, lat]) => addCoordinate(lng, lat))
    })
  } else {
    ;(geometry.coordinates as number[][][][]).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lng, lat]) => addCoordinate(lng, lat))
      })
    })
  }

  if (count === 0) return null

  return {
    lat: latSum / count,
    lng: lngSum / count,
  }
}

function getDistanceScore(a: Point, b: Point) {
  const latDiff = a.lat - b.lat
  const lngDiff = a.lng - b.lng
  return (latDiff * latDiff) + (lngDiff * lngDiff)
}

export function buildRegionFeatureCollection(
  geoJson: GeoJsonFeatureCollection,
  regions: DestinationRegionDefinition[]
): GeoJsonFeatureCollection {
  const stylesByShapeId = new Map<string, DestinationRegionDefinition>()
  const centersByShapeId = new Map<string, Point>()

  geoJson.features.forEach((feature) => {
    const shapeId = String(feature.properties.shapeID ?? feature.properties.shapeName ?? '')
    const center = getGeometryCenter(feature.geometry)
    if (!shapeId || !center) return
    centersByShapeId.set(shapeId, center)
  })

  regions.forEach((region) => {
    const matchedFeature = geoJson.features.find((feature) => containsPoint(feature.geometry, region))
    const resolvedFeature = matchedFeature ?? geoJson.features.reduce<GeoJsonFeature | null>((closest, feature) => {
      const shapeId = String(feature.properties.shapeID ?? feature.properties.shapeName ?? '')
      const center = centersByShapeId.get(shapeId)
      if (!shapeId || !center) return closest

      if (!closest) return feature

      const currentShapeId = String(closest.properties.shapeID ?? closest.properties.shapeName ?? '')
      const currentCenter = centersByShapeId.get(currentShapeId)
      if (!currentCenter) return feature

      return getDistanceScore(region, center) < getDistanceScore(region, currentCenter) ? feature : closest
    }, null)

    if (!resolvedFeature) return

    const shapeId = String(resolvedFeature.properties.shapeID ?? resolvedFeature.properties.shapeName ?? region.region)
    stylesByShapeId.set(shapeId, region)
  })

  return {
    type: 'FeatureCollection',
    features: geoJson.features.flatMap((feature) => {
      const shapeId = String(feature.properties.shapeID ?? feature.properties.shapeName ?? '')
      const region = stylesByShapeId.get(shapeId)

      if (!region) return []

      return [{
        ...feature,
        properties: {
          ...feature.properties,
          layerType: 'region',
          region: region.region,
          color: region.color,
          opacity: region.opacity,
          strokeColor: region.strokeColor,
        },
      }]
    }),
  }
}
