import { use, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { type Country, type Location } from '~features/location'
import type { Coordinate } from '~shared/model/coordinate.model'
import { useAsyncEffect } from '~shared/hooks/useAsyncEffect'
import { useCleanup } from '~shared/hooks/useCleanup'
import { GoogleMapContext } from '../GoogleMap'
import { getPolygonFeatureStyle } from './polygon-layer.style'
import type { GeoJsonFeatureCollection } from '../region-layer/region-layer.types'
import {
  getCountryPolygonCoordinateGroups,
  getLocationCoordinates,
} from '../../polygon-layer.utils'

export interface GooglePolygonLayerProps {
  children?: ReactNode
}

type BasePolygonProps = {
  color?: string
  opacity?: number
  strokeColor?: string
}

type PolygonProps = BasePolygonProps & {
  coordinates: Coordinate[][]
  layerType?: 'polygon' | 'country' | 'region'
}

type RegionProps =
  | (BasePolygonProps & { country: Country; location?: never; lat?: never; lng?: never })
  | (BasePolygonProps & { location: Location; country?: never })

export function Polygon(props: PolygonProps) {
  const { clearFeatures, replaceFeatures } = usePolygonFeatures()

  useEffect(() => {
    replaceFeatures(createPolygonFeatureCollection(props.coordinates, props, props.layerType))
  }, [props, replaceFeatures])

  useCleanup(() => {
    clearFeatures()
  }, [clearFeatures])

  return null
}

export function Region(props: RegionProps) {
  const [coordinateGroups, setCoordinateGroups] = useState<Coordinate[][][] | null>(null)

  useAsyncEffect(async (mounted) => {
    setCoordinateGroups(null)

    if (props.country != null) {
      const coordinates = await getCountryPolygonCoordinateGroups(props.country)
      if (!mounted) return

      setCoordinateGroups(coordinates)
      return
    }

    const coordinates = await getLocationCoordinates(props.location)
    if (!mounted) return

    setCoordinateGroups(coordinates ? [coordinates] : [])
  }, [props])

  if (!coordinateGroups?.length) return null

  return coordinateGroups.map((coordinates, index) => (
    <Polygon
      key={`${props.country ?? props.location}-${index}`}
      coordinates={coordinates}
      layerType={props.country != null ? 'country' : 'region'}
      color={props.color}
      opacity={props.opacity}
      strokeColor={props.strokeColor}
    />
  ))
}

function usePolygonFeatures() {
  const context = use(GoogleMapContext)
  const featureRefs = useRef<google.maps.Data.Feature[]>([])

  const clearFeatures = useEffectEvent(() => {
    const map = context?.map
    if (!map) return

    featureRefs.current.forEach((feature) => map.data.remove(feature))
    featureRefs.current = []
  })

  const replaceFeatures = useEffectEvent((collection: GeoJsonFeatureCollection) => {
    const map = context?.map
    if (!map) return

    clearFeatures()
    featureRefs.current = map.data.addGeoJson(collection)
  })

  return {
    clearFeatures,
    replaceFeatures,
  }
}

export function GooglePolygonLayer({ children }: GooglePolygonLayerProps) {
  useApplyPolygonLayerStyle()

  return <>{children}</>
}

function useApplyPolygonLayerStyle() {
  const context = use(GoogleMapContext)

  const applyPolygonLayerStyle = useEffectEvent(() => {
    const map = context?.map
    if (!map) return

    map.data.setStyle((feature) => getPolygonFeatureStyle(feature, map.getZoom() ?? 4))
  })

  useLayoutEffect(() => {
    const map = context?.map
    if (!map) return

    // NOTE:
    // Data layer 기본 스타일이 먼저 그려지면 첫 프레임에 회색 경계가 잠깐 보일 수 있다.
    // 이 현상이 다시 보이면 개별 overrideStyle보다 이 전역 style 경로가 유지되고 있는지 먼저 확인한다.
    applyPolygonLayerStyle()

    const listener = map.addListener('zoom_changed', applyPolygonLayerStyle)

    return () => google.maps.event.removeListener(listener)
  }, [context?.map, applyPolygonLayerStyle])
}

function createPolygonFeatureCollection(
  coordinates: Coordinate[][],
  style: BasePolygonProps,
  layerType: PolygonProps['layerType'] = 'polygon',
): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        layerType,
        color: style.color,
        opacity: style.opacity,
        strokeColor: style.strokeColor,
      },
      geometry: {
        type: 'Polygon',
        coordinates: coordinates
          .filter((ring) => ring.length >= 3)
          .map((ring) => closePolygon(ring).map(({ lat, lng }) => [lng, lat])),
      },
    }],
  }
}

function closePolygon(coordinates: Coordinate[]) {
  if (coordinates.length === 0) return coordinates

  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (!first || !last) return coordinates

  if (first.lat === last.lat && first.lng === last.lng) {
    return coordinates
  }

  return [...coordinates, first]
}
