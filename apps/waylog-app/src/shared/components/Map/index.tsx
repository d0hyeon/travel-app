import { NativeMap } from './NativeMap'
import { NativeMapMarker } from './NativeMapMarker'
import { NativeMapPath } from './NativeMapPath'

// 웹 Map 과 동일한 사용법을 유지한다. type prop 은 받지 않는다 —
// 앱에는 구현이 하나뿐이라 소비자가 결정할 이유가 없다.
export const Map = Object.assign(NativeMap, {
  Marker: NativeMapMarker,
  Path: NativeMapPath,
})

export type { MapBounds, MapProps, MapRef, MarkerProps, PathProps } from '@waylog/domains/modules/map'
