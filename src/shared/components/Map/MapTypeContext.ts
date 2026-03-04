import { createContext } from 'react';
import type { MapType } from './types';

export const MapTypeContext = createContext<MapType>('kakao');
