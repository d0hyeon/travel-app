import type { Ref } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { MapProps, MapRef } from '@waylog/domains/modules/map'

export interface PanToOptions {
  zoom?: number
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
}

export interface NativeMapRef extends Omit<MapRef, 'panTo'> {
  panTo: (lat: number, lng: number, zoomOrOptions?: number | PanToOptions) => void
}

export type NativeMapProps = Omit<MapProps, 'ref'> & {
  ref?: Ref<NativeMapRef>
  style?: StyleProp<ViewStyle>
}
