import type { MarineActivityMarkerItem } from '@waylog/domains/marine-activity'
import { MarineActivityType } from '@waylog/domains/marine-activity'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg'

// 웹 createMarineActivityMarkerIcon 과 같은 그림이다.
// 웹은 SVG 문자열을 data URI 로 만들어 img 에 넣지만
// RN 의 Image 는 SVG data URI 를 못 읽는다. react-native-svg 로 같은 도형을 그린다.
const SIZE = 44

interface Props {
  markerItem: MarineActivityMarkerItem
}

export function MarineActivityMarkerIcon({ markerItem }: Props) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 72 72">
      <Defs>
        <LinearGradient id="marineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0ea5e9" />
          <Stop offset="100%" stopColor="#155e75" />
        </LinearGradient>
      </Defs>
      <Circle cx="36" cy="36" r="30" fill="url(#marineGradient)" />
      <Circle cx="36" cy="36" r="27" fill="none" stroke="white" strokeWidth="3" />
      <Path
        d="M20 41c3.8-4.5 7.7-6.8 11.7-6.8 3.3 0 5.6 1.5 7.8 3 2 1.3 4 2.6 6.8 2.6 2.6 0 5.3-1.1 8.2-3.3v7.6c-2.8 1.7-5.7 2.5-8.5 2.5-4.7 0-7.8-1.9-10.1-3.4-1.8-1.1-3-1.9-4.7-1.9-2.6 0-5.9 1.7-10.2 5.1z"
        fill="white"
        opacity={0.95}
      />
      <Path
        d="M24 28c1.8-3.4 4.8-5.1 9-5.1 2.9 0 5.2.8 6.9 2.4 1.8 1.5 3.5 2.4 5.2 2.4 1.5 0 3-.5 4.7-1.7l2 5.2c-2 1.4-4.2 2.1-6.6 2.1-3.2 0-5.9-1-8.1-3-1.7-1.4-3-2-4.4-2-2.1 0-3.8 1.1-5.4 3.3z"
        fill="white"
        opacity={0.7}
      />
      <Circle cx="53" cy="20" r="11" fill="#082f49" />
      <SvgText
        x="53"
        y="24"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="white"
      >
        {toBadgeText(markerItem)}
      </SvgText>
    </Svg>
  )
}

function toBadgeText(markerItem: MarineActivityMarkerItem): string {
  const supportsBeach = markerItem.indices.some((index) => index.type === MarineActivityType.Beach)
  const supportsSkinScuba = markerItem.indices.some(
    (index) => index.type === MarineActivityType.SkinScuba,
  )

  if (supportsBeach && supportsSkinScuba) return 'B/S'
  return supportsBeach ? 'B' : 'S'
}
