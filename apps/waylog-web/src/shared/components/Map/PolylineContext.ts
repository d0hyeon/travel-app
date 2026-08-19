import { createContext } from 'react';
import type { PolylineStyle } from './types';

// Polyline 그룹이 자식 Line들에 공통 선 스타일을 전달하는 통로
export const PolylineContext = createContext<PolylineStyle>({});
