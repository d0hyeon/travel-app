import { use, useEffect, useEffectEvent } from 'react'
import { GoogleMapContext } from './GoogleMap'

const GEOJSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

let geoJsonCache: object | null = null

async function fetchCountryGeoJson() {
  if (geoJsonCache) return geoJsonCache
  const res = await fetch(GEOJSON_URL)
  geoJsonCache = await res.json()
  return geoJsonCache!
}

/** ISO_A3 코드 → 방문 횟수 */
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
      const iso = feature.getProperty('ISO_A3') as string
      // 일부 데이터셋에서 미인정 지역은 ISO_A3 = '-99'
      // Taiwan(TWN)은 ISO_A3_EH 속성에 있는 경우도 있어 fallback 처리
      const isoFallback = (feature.getProperty('ISO_A3_EH') as string | undefined) ?? iso
      const count = data[iso] ?? data[isoFallback] ?? 0

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
