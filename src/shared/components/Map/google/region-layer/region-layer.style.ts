import type { CountryFeatureProperties } from './region-layer.types'

function getCountryOpacityMultiplier(zoom: number): number {
  if (zoom >= 9) return 0.08
  if (zoom >= 8) return 0.14
  if (zoom >= 7) return 0.22
  if (zoom >= 6) return 0.38
  if (zoom >= 5) return 0.58
  return 1
}

function getRegionOpacityMultiplier(zoom: number): number {
  if (zoom < 4.75) return 0
  if (zoom >= 9) return 1
  if (zoom >= 8) return 0.88
  if (zoom >= 7) return 0.76
  if (zoom >= 6) return 0.66
  if (zoom >= 5) return 0.5
  return 0.42
}

function normalizeCountryFeatureName(name: string): string {
  if (name === 'United States') return 'United States of America'
  if (name === 'England') return 'United Kingdom'
  return name
}

export function getRegionFeatureStyle(
  feature: google.maps.Data.Feature,
  zoom: number,
  countriesByName: Map<string, CountryFeatureProperties>
): google.maps.Data.StyleOptions {
  const layerType = String(feature.getProperty('layerType') ?? 'country')

  if (layerType === 'region') {
    const color = String(feature.getProperty('color') ?? '#82d2ae')
    const strokeColor = String(feature.getProperty('strokeColor') ?? color)
    const baseOpacity = Number(feature.getProperty('opacity') ?? 0.1)
    const fillOpacity = baseOpacity * getRegionOpacityMultiplier(zoom)

    if (fillOpacity <= 0.01) return { visible: false }

    return {
      visible: true,
      fillColor: color,
      fillOpacity,
      strokeColor,
      strokeWeight: zoom >= 8 ? 1.4 : 1,
      strokeOpacity: Math.min(0.36, fillOpacity + 0.08),
      zIndex: 3,
    }
  }

  const country = normalizeCountryFeatureName(String(feature.getProperty('name') ?? ''))
  const countryRegion = countriesByName.get(country)
  if (!countryRegion) return { visible: false }

  const fillOpacity = (countryRegion.opacity ?? 0.19) * getCountryOpacityMultiplier(zoom)
  if (fillOpacity <= 0.01) return { visible: false }

  return {
    visible: true,
    fillColor: countryRegion.color,
    fillOpacity,
    strokeColor: countryRegion.strokeColor ?? countryRegion.color,
    strokeWeight: 1,
    strokeOpacity: Math.max(0.08, 0.24 * getCountryOpacityMultiplier(zoom)),
    zIndex: 1,
  }
}
