import { use, useEffect, useEffectEvent } from 'react'
import { GoogleMapContext } from './GoogleMap'

// Natural Earth 110m 국가 경계 (ISO_A3 속성 포함, ~1MB)
const GEOJSON_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

// world-atlas는 TopoJSON이라 직접 쓸 수 없으므로 GeoJSON 소스를 사용
const GEOJSON_FALLBACK_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

let geoJsonCache: object | null = null

async function fetchCountryGeoJson(): Promise<object> {
  if (geoJsonCache) return geoJsonCache
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    geoJsonCache = await res.json()
    return geoJsonCache!
  } catch (e) {
    console.warn('[VisitLayer] GeoJSON 로드 실패:', e)
    throw e
  }
}

/** 국가명(GeoJSON name 속성) → 방문 횟수 */
export interface GoogleVisitLayerProps {
  data: Record<string, number>
}

function getColor(count: number): string {
  if (count >= 5) return '#1a7a57'
  if (count >= 3) return '#2a9d6f'
  if (count >= 2) return '#52b78a'
  return '#82d2ae'
}

function getOpacity(count: number): number {
  if (count >= 5) return 0.65
  if (count >= 3) return 0.5
  if (count >= 2) return 0.4
  return 0.3
}

export function GoogleVisitLayer({ data }: GoogleVisitLayerProps) {
  const context = use(GoogleMapContext)

  const applyStyle = useEffectEvent(() => {
    if (!context?.map) return
    const zoom = context.map.getZoom() ?? 4
    // 줌이 높을수록(가까울수록) 폴리곤 페이드아웃
    const zoomFactor = zoom > 8 ? 0.2 : zoom > 6 ? 0.5 : zoom > 4 ? 0.75 : 1.0

    context.map.data.setStyle((feature) => {
      const name = feature.getProperty('name') as string
      const count = data[name] ?? 0

      if (count === 0) return { visible: false }

      const baseOpacity = getOpacity(count)
      return {
        fillColor: getColor(count),
        fillOpacity: baseOpacity * zoomFactor,
        strokeColor: getColor(count),
        strokeWeight: 1,
        strokeOpacity: 0.5 * zoomFactor,
        zIndex: 1,
      }
    })
  })

  useEffect(() => {
    if (!context?.map) return
    const map = context.map

    let cancelled = false
    let addedFeatures: google.maps.Data.Feature[] = []

    fetchCountryGeoJson().then((geoJson) => {
      if (cancelled) return
      addedFeatures = map.data.addGeoJson(geoJson)
      applyStyle()
    })

    const zoomListener = map.addListener('zoom_changed', applyStyle)

    return () => {
      cancelled = true
      addedFeatures.forEach((f) => map.data.remove(f))
      google.maps.event.removeListener(zoomListener)
    }
  }, [context?.map])

  // data 변경 시 스타일 재적용
  useEffect(() => {
    applyStyle()
  }, [data])

  return null
}
