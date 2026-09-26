import type { PolylineProps } from '@waylog/domains/modules/map'
import { PolylineContext } from './PolylineContext'

// 여러 구간(Line)을 하나의 논리적 경로로 묶어 공통 선 스타일을 전달한다.
export function NativeMapPolyline({ children, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PolylineProps) {
  return (
    <PolylineContext.Provider value={{ strokeColor, strokeWeight, strokeOpacity, strokeStyle }}>
      {children}
    </PolylineContext.Provider>
  )
}
