import { use, useEffect, useEffectEvent, useMemo, useRef } from 'react'
import { getCountryByLocation, type Country } from '~features/location'
import { GoogleMapContext } from '../GoogleMap'
import type { RegionDefinition } from '../../region-layer.types'
import { fetchCountryRegionBoundaries, fetchWorldBoundaries } from './region-layer.data'
import { buildRegionFeatureCollection } from './region-layer.geometry'
import { getRegionFeatureStyle } from './region-layer.style'
import type { CountryFeatureProperties } from './region-layer.types'

export interface GoogleRegionLayerProps {
  regions: RegionDefinition[]
}

export function GoogleRegionLayer({ regions }: GoogleRegionLayerProps) {
  const context = use(GoogleMapContext)
  const countryFeaturesRef = useRef<google.maps.Data.Feature[]>([])
  const regionFeaturesRef = useRef<google.maps.Data.Feature[]>([])

  const countries = useMemo(
    () => regions.filter((region) => region.type === 'country'),
    [regions]
  )

  const locationRegions = useMemo(
    () => regions.filter((region) => region.type === 'region'),
    [regions]
  )

  const countriesByName = useMemo(() => {
    return new Map(
      countries.map((country) => [
        country.country,
        {
          layerType: 'country',
          country: country.country,
          color: country.color,
          opacity: country.opacity,
          strokeColor: country.strokeColor,
        } satisfies CountryFeatureProperties,
      ])
    )
  }, [countries])

  const applyStyle = useEffectEvent(() => {
    if (!context?.map) return

    const zoom = context.map.getZoom() ?? 4
    context.map.data.setStyle((feature) => getRegionFeatureStyle(feature, zoom, countriesByName))
  })

  useEffect(() => {
    if (!context?.map) return

    const map = context.map
    let cancelled = false

    fetchWorldBoundaries()
      .then((geoJson) => {
        if (cancelled) return

        countryFeaturesRef.current.forEach((feature) => map.data.remove(feature))
        countryFeaturesRef.current = map.data.addGeoJson(geoJson)
        applyStyle()
      })
      .catch((error) => {
        console.warn('[RegionLayer] 국가 경계 GeoJSON 로드 실패:', error)
      })

    const zoomListener = map.addListener('zoom_changed', applyStyle)

    return () => {
      cancelled = true
      countryFeaturesRef.current.forEach((feature) => map.data.remove(feature))
      countryFeaturesRef.current = []
      regionFeaturesRef.current.forEach((feature) => map.data.remove(feature))
      regionFeaturesRef.current = []
      google.maps.event.removeListener(zoomListener)
    }
  }, [context?.map])

  useEffect(() => {
    if (!context?.map) return

    const map = context.map
    const regionsByCountry = new globalThis.Map<Country, typeof locationRegions>()

    locationRegions.forEach((region) => {
      const country = getCountryByLocation(region.location)
      if (!country) return

      const bucket = regionsByCountry.get(country) ?? []
      bucket.push(region)
      regionsByCountry.set(country, bucket)
    })

    let cancelled = false

    Promise.all(
      [...regionsByCountry.entries()].map(([country, scopedRegions]) =>
        fetchCountryRegionBoundaries(country)
          .then((geoJson) => buildRegionFeatureCollection(geoJson, scopedRegions))
          .catch((error) => {
            console.warn(`[RegionLayer] ${country} 지역 경계 GeoJSON 로드 실패:`, error)
            return { type: 'FeatureCollection', features: [] } as const
          })
      )
    ).then((collections) => {
      if (cancelled) return

      regionFeaturesRef.current.forEach((feature) => map.data.remove(feature))
      regionFeaturesRef.current = []

      collections.forEach((collection) => {
        regionFeaturesRef.current.push(...map.data.addGeoJson(collection))
      })

      applyStyle()
    })

    return () => {
      cancelled = true
    }
  }, [context?.map, locationRegions])

  useEffect(() => {
    applyStyle()
  }, [countriesByName, locationRegions])

  return null
}
