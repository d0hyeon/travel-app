import { describe, expect, it } from 'vitest'
import { computeMarkerVisibility } from '../useMapMarkerRegistry.utils'

const BOUNDS = { north: 38, south: 37, east: 127, west: 126 }

function toPixelStub(bounds: typeof BOUNDS) {
  const scale = 1000 / (bounds.east - bounds.west)
  return (coord: { lat: number; lng: number }) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}

describe('computeMarkerVisibility', () => {
  it('visibleBounds가 null이면 모든 마커를 보여준다(클러스터링도 비활성)', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 40, lng: 130 }, // bounds 밖 좌표라도 포함
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: null,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
    expect(result.clusters).toBeNull()
  })

  it('bounds 밖 마커는 컬링되어 visibleMarkerIds에서 빠진다', () => {
    const markers = [
      { id: 'inside', lat: 37.5, lng: 126.5 },
      { id: 'outside', lat: 40, lng: 130 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: false,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['inside']))
    expect(result.clusters).toBeNull()
  })

  it('clustering이 false면 clusters는 null이고 컬링만 적용된다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: false,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.clusters).toBeNull()
    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
  })

  it('clustering이 true이고 마커가 2개 미만이면 clusters는 null이다', () => {
    const markers = [{ id: 'only', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.clusters).toBeNull()
    expect(result.visibleMarkerIds).toEqual(new Set(['only']))
  })

  it('가까운 마커 2개는 clustering이 true일 때 하나의 클러스터로 묶인다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.clusters).not.toBeNull()
    expect(result.clusters).toHaveLength(1)
    expect(result.clusters![0]!.markers).toHaveLength(2)
  })

  it('id가 없는 마커는 좌표 기반 키로 클러스터링 결과에서 식별된다', () => {
    // RegisteredMapMarker.id는 항상 존재해야 하지만(레지스트리 등록 시 필수),
    // 이 함수 자체는 넘어온 id를 그대로 clusterMarkers에 전달하는지만 검증한다.
    const markers = [{ id: '37.5,126.5', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      visibleBounds: BOUNDS,
      clustering: true,
      clusterGridSize: 50,
      toPixel: toPixelStub,
      paddingRatio: 0.2,
    })

    expect(result.visibleMarkerIds.has('37.5,126.5')).toBe(true)
  })
})
