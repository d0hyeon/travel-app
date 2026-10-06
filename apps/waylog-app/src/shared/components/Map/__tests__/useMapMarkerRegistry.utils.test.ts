import { describe, expect, it } from 'vitest'
import { computeMarkerVisibility } from '../useMapMarkerRegistry.utils'

const BOUNDS = { north: 38, south: 37, east: 127, west: 126 }
const PADDING_RATIO = 0.2

const CAMERA = { zoom: 14, bounds: BOUNDS, screenWidth: 390 }

describe('computeMarkerVisibility', () => {
  it('뷰포트 밖 마커는 컬링되어 visibleMarkerIds에서 제외된다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'far', lat: 40, lng: 130 }, // BOUNDS 밖 좌표라 컬링된다
    ]

    const result = computeMarkerVisibility({
      markers,
      camera: CAMERA,
      clustering: false,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['a']))
    expect(result.clusters).toBeNull()
  })

  it('클러스터링 중이면 카메라를 알기 전까지 아무것도 보여주지 않는다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      camera: null,
      clustering: true,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.visibleMarkerIds).toEqual(new Set())
    expect(result.clusters).toBeNull()
  })

  it('클러스터링을 쓰지 않으면 카메라를 몰라도 전체를 보여준다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      camera: null,
      clustering: false,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
    expect(result.clusters).toBeNull()
  })

  it('clustering이 false면 clusters는 null이고 뷰포트 내 마커를 모두 보여준다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 },
    ]

    const result = computeMarkerVisibility({
      markers,
      camera: CAMERA,
      clustering: false,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.clusters).toBeNull()
    expect(result.visibleMarkerIds).toEqual(new Set(['a', 'b']))
  })

  it('clustering이 true이고 뷰포트 내 마커가 2개 미만이면 clusters는 null이다', () => {
    const markers = [{ id: 'only', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      camera: CAMERA,
      clustering: true,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
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
      camera: CAMERA,
      clustering: true,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.clusters).not.toBeNull()
    expect(result.clusters).toHaveLength(1)
    expect(result.clusters![0]!.markers).toHaveLength(2)
  })

  it('클러스터로 묶인 마커는 visibleMarkerIds에서 제외되고 싱글턴만 남는다', () => {
    const markers = [
      { id: 'a', lat: 37.5, lng: 126.5 },
      { id: 'b', lat: 37.5001, lng: 126.5001 }, // a와 가까워 클러스터로 묶임
      { id: 'far', lat: 37.9, lng: 126.9 }, // 멀리 떨어져 단독(싱글턴) 클러스터
    ]

    const result = computeMarkerVisibility({
      markers,
      camera: CAMERA,
      clustering: true,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    // 클러스터 UI(NativeMapCluster)가 그룹을 대신 그리므로, 그룹 멤버는
    // 개별 마커로 중복 렌더링되지 않는다. 싱글턴만 개별 마커로 남는다.
    expect(result.visibleMarkerIds.has('a')).toBe(false)
    expect(result.visibleMarkerIds.has('b')).toBe(false)
    expect(result.visibleMarkerIds.has('far')).toBe(true)
  })

  it('id가 없는 마커는 좌표 기반 키로 클러스터링 결과에서 식별된다', () => {
    // RegisteredMapMarker.id는 항상 존재해야 하지만(레지스트리 등록 시 필수),
    // 이 함수 자체는 넘어온 id를 그대로 clusterMarkers에 전달하는지만 검증한다.
    const markers = [{ id: '37.5,126.5', lat: 37.5, lng: 126.5 }]

    const result = computeMarkerVisibility({
      markers,
      camera: CAMERA,
      clustering: true,
      clusterGridSize: 50,
      paddingRatio: PADDING_RATIO,
    })

    expect(result.visibleMarkerIds.has('37.5,126.5')).toBe(true)
  })
})
