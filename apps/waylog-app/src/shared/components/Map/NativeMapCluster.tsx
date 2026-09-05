import Mapbox from '@rnmapbox/maps'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import { Pressable } from 'react-native'

interface Props {
  latitude: number
  longitude: number
  count: number
  /** 누르면 묶인 마커가 모두 보이도록 확대한다 */
  onTap?: () => void
}

// 카카오·구글처럼 개수에 따라 크기와 색이 커진다.
function getStyle(count: number) {
  if (count >= 100) return { size: 64, color: '#e53935', ring: 'rgba(229,57,53,0.3)' }
  if (count >= 10) return { size: 56, color: '#fb8c00', ring: 'rgba(251,140,0,0.3)' }
  return { size: 48, color: '#4C84FF', ring: 'rgba(76,132,255,0.3)' }
}

export function NativeMapCluster({ latitude, longitude, count, onTap }: Props) {
  const { size, color, ring } = getStyle(count)
  const half = size / 2

  return (
    // Mapbox.MarkerView는 id prop을 받지 않는다(Task 3에서 확인됨. 타입·구현체 모두 없음).
    <Mapbox.MarkerView coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }}>
      <Pressable onPress={onTap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={half} cy={half} r={half} fill={ring} />
          <Circle cx={half} cy={half} r={half - 6} fill={color} stroke="#fff" strokeWidth={2} />
          <SvgText
            x={half}
            y={half}
            fill="#fff"
            fontSize={count >= 100 ? 16 : 18}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {String(count)}
          </SvgText>
        </Svg>
      </Pressable>
    </Mapbox.MarkerView>
  )
}
