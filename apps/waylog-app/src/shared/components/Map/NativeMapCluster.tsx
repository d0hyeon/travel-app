import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map'
import { View } from 'react-native'
import { Typography } from '../mui'

interface Props {
  latitude: number
  longitude: number
  count: number
}

// 웹 cluster.utils 의 모양을 그대로 옮긴다 — 38px 흰 원에 개수.
export function NativeMapCluster({ latitude, longitude, count }: Props) {
  return (
    <NaverMapMarkerOverlay latitude={latitude} longitude={longitude} anchor={{ x: 0.5, y: 0.5 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: '#bdbdbd',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: '#555', fontSize: 13, fontWeight: '700' }}>{count}</Typography>
      </View>
    </NaverMapMarkerOverlay>
  )
}
