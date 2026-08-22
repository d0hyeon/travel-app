import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { PrecipitationType, SkyCondition } from '@waylog/domains/modules/weather'
import { arrayIncludes, assert } from '@waylog/utility'
import { palette } from '../../shared/config/tokens'

interface WeatherIconProps {
  skyCondition: SkyCondition | null
  precipitationType: PrecipitationType
  size?: number
  color?: string
}

// 웹 WeatherIcon 과 같은 판단·같은 색을 쓴다. 아이콘 세트만 바뀐다.
export function WeatherIcon({
  skyCondition,
  precipitationType,
  size = 24,
  color,
}: WeatherIconProps) {
  if (precipitationType === PrecipitationType.없음) {
    assert(skyCondition != null, '날씨 정보가 존재하지 않습니다.')

    if (skyCondition === SkyCondition.맑음) {
      return <MaterialIcons name="wb-sunny" size={size} color={color ?? '#efc46d'} />
    }
    if (skyCondition === SkyCondition.흐림) {
      return <MaterialIcons name="cloud" size={size} color={color ?? palette.text} />
    }
    return <MaterialCommunityIcons name="weather-partly-cloudy" size={size} color={color ?? palette.text} />
  }

  if (arrayIncludes(SNOW_TYPES, precipitationType)) {
    return <MaterialCommunityIcons name="weather-snowy" size={size} color={color ?? '#fff'} />
  }

  return <MaterialCommunityIcons name="water" size={size} color={color ?? '#4A7AFF'} />
}

const SNOW_TYPES = [
  PrecipitationType.눈,
  PrecipitationType.눈날림,
  PrecipitationType.비눈,
  PrecipitationType.빗방울눈날림,
] satisfies PrecipitationType[]
