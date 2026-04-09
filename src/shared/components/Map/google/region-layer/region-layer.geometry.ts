import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from './region-layer.types'
import type { LocationRegionDefinition } from '../../region-layer.types'
import type { Coordinate } from '~shared/model/coordinate.model'

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

export function containsPoint(geometry: GeoJsonGeometry | null, point: Point) {
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

function getPolygonCenter(polygon: number[][][]) {
  let latSum = 0
  let lngSum = 0
  let count = 0

  polygon.forEach((ring) => {
    ring.forEach(([lng, lat]) => {
      lngSum += lng
      latSum += lat
      count += 1
    })
  })

  if (count === 0) return null

  return {
    lat: latSum / count,
    lng: lngSum / count,
  }
}

function getGeometryCoordinates(geometry: GeoJsonGeometry | null): Coordinate[][] {
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map((ring) =>
      ring.map(([lng, lat]) => ({ lat, lng })),
    )
  }

  const polygons = geometry.coordinates as number[][][][]
  const [primaryPolygon] = polygons
  if (!primaryPolygon) return []

  return primaryPolygon.map((ring) =>
    ring.map(([lng, lat]) => ({ lat, lng })),
  )
}

function getGeometryCoordinateGroups(geometry: GeoJsonGeometry | null): Coordinate[][][] {
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    return [getGeometryCoordinates(geometry)]
  }

  return (geometry.coordinates as number[][][][]).map((polygon) =>
    polygon.map((ring) =>
      ring.map(([lng, lat]) => ({ lat, lng })),
    ),
  )
}

function getGeometryCoordinatesByPoint(
  geometry: GeoJsonGeometry | null,
  point: Point,
): Coordinate[][] {
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    return getGeometryCoordinates(geometry)
  }

  const polygons = geometry.coordinates as number[][][][]
  const matchedPolygon = polygons.find((polygon) => isPointInPolygon(point, polygon))

  const resolvedPolygon = matchedPolygon ?? polygons.reduce<number[][][] | null>((closest, polygon) => {
    const center = getPolygonCenter(polygon)
    if (!center) return closest

    if (!closest) return polygon

    const currentCenter = getPolygonCenter(closest)
    if (!currentCenter) return polygon

    return getDistanceScore(point, center) < getDistanceScore(point, currentCenter) ? polygon : closest
  }, null)

  if (!resolvedPolygon) return []

  return resolvedPolygon.map((ring) =>
    ring.map(([lng, lat]) => ({ lat, lng })),
  )
}

export function getDistanceScore(a: Point, b: Point) {
  const latDiff = a.lat - b.lat
  const lngDiff = a.lng - b.lng

  return (latDiff * latDiff) + (lngDiff * lngDiff)
}

export function buildRegionFeatureCollection(
  geoJson: GeoJsonFeatureCollection,
  regions: LocationRegionDefinition[]
): GeoJsonFeatureCollection
export function buildRegionFeatureCollection(
  geoJson: GeoJsonFeatureCollection,
  region: LocationRegionDefinition
): GeoJsonFeatureCollection 
export function buildRegionFeatureCollection(
  geoJson: GeoJsonFeatureCollection,
  _regions: LocationRegionDefinition[] | LocationRegionDefinition
): GeoJsonFeatureCollection {
  const stylesByShapeId = new Map<string, LocationRegionDefinition>()
  const centersByShapeId = new Map<string, Point>()

  geoJson.features.forEach((feature) => {
    const shapeId = String(feature.properties.shapeID ?? feature.properties.shapeName ?? '')
    const center = getGeometryCenter(feature.geometry)
    if (!shapeId || !center) return
    centersByShapeId.set(shapeId, center)
  })

  const regions = Array.isArray(_regions) ? _regions : [_regions];
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

    const shapeId = String(resolvedFeature.properties.shapeID ?? resolvedFeature.properties.shapeName ?? region.location)
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
          region: region.location,
          color: region.color,
          opacity: region.opacity,
          strokeColor: region.strokeColor,
        },
      }]
    }),
  }
}

export function getCountryCoordinates(
  geoJson: GeoJsonFeatureCollection,
  country: string,
  iso3: string,
): Coordinate[][] | null {
  const feature = geoJson.features.find((item) => {
    const name = String(item.properties.name ?? '')
    const id = String((item as { id?: string }).id ?? '')
    return name === country || id === iso3
  })

  if (!feature) return null

  return getGeometryCoordinates(feature.geometry)
}

export function getCountryCoordinateGroups(
  geoJson: GeoJsonFeatureCollection,
  country: string,
  iso3: string,
): Coordinate[][][] {
  const feature = geoJson.features.find((item) => {
    const name = String(item.properties.name ?? '')
    const id = String((item as { id?: string }).id ?? '')
    return name === country || id === iso3
  })

  if (!feature) return []

  return getGeometryCoordinateGroups(feature.geometry)
}

export function getRegionCoordinates(
  geoJson: GeoJsonFeatureCollection,
  region: LocationRegionDefinition,
): Coordinate[][] | null {
  const centersByShapeId = new Map<string, Point>()

  geoJson.features.forEach((feature) => {
    const shapeId = String(feature.properties.shapeID ?? feature.properties.shapeName ?? '')
    const center = getGeometryCenter(feature.geometry)
    if (!shapeId || !center) return
    centersByShapeId.set(shapeId, center)
  })

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

  if (!resolvedFeature) return null

  return getGeometryCoordinatesByPoint(resolvedFeature.geometry, region)
}
