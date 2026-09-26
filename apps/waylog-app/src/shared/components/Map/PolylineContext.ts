import { createContext, useContext } from 'react'
import type { PolylineStyle } from '@waylog/domains/modules/map'

// Polyline 그룹이 자식 Line들에 공통 선 스타일을 전달하는 통로
export const PolylineContext = createContext<PolylineStyle>({})

export function usePolylineStyle() {
  return useContext(PolylineContext)
}
