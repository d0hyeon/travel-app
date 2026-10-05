import { createContext } from 'react';
import type { MapProvider } from './types';

export const MapTypeContext = createContext<MapProvider>('kakao');
