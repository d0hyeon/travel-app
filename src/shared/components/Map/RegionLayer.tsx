import { Children, Fragment, isValidElement, use, type ReactElement, type ReactNode } from 'react'
import { MapTypeContext } from './MapTypeContext'
import { GoogleRegionLayer } from './google/region-layer/GoogleRegionLayer'
import type { MapRegionProps, RegionDefinition, RegionElement, RegionLayerProps } from './region-layer.types'

export function RegionLayer({ children }: RegionLayerProps) {
  const type = use(MapTypeContext)
  const regions = collectRegionDefinitions(children)

  if (type !== 'google') return null

  return <GoogleRegionLayer regions={regions} />
}

export function Region(_props: MapRegionProps) {
  return null
}

function collectRegionDefinitions(children: ReactNode): RegionDefinition[] {
  const regions: RegionDefinition[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return

    if (child.type === Fragment) {
      regions.push(...collectRegionDefinitions((child as ReactElement<{ children?: ReactNode }>).props.children))
      return
    }

    if (child.type !== Region) return

    const props = (child as RegionElement).props

    if (props.country != null) {
      regions.push({
        type: 'country',
        country: props.country,
        color: props.color,
        opacity: props.opacity,
        strokeColor: props.strokeColor,
      })
      return
    }

    regions.push({
      type: 'region',
      location: props.location,
      lat: props.lat,
      lng: props.lng,
      color: props.color,
      opacity: props.opacity,
      strokeColor: props.strokeColor,
    })
  })

  return regions
}
