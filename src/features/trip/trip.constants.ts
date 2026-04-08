import { getCoordinateByLocation, Locations, type Location } from "~features/location";

export const LocationGroups = ['국내', '일본', '동남아', '중화권', '유럽', '미주'] as const
export const LocationGroup = {
  서울: '국내',
  부산: '국내',
  제주: '국내',
  강릉: '국내',
  경주: '국내',
  여수: '국내',
  전주: '국내',
  속초: '국내',
  삼척: '국내',
  인천: '국내',
  대구: '국내',
  대전: '국내',
  광주: '국내',
  단양: '국내',
  평창: '국내',
  포천: '국내',
  진안: '국내',
  도쿄: '일본',
  오사카: '일본',
  교토: '일본',
  후쿠오카: '일본',
  삿포로: '일본',
  오키나와: '일본',
  방콕: '동남아',
  푸켓: '동남아',
  싱가포르: '동남아',
  다낭: '동남아',
  호치민: '동남아',
  하노이: '동남아',
  발리: '동남아',
  세부: '동남아',
  코타키나발루: '동남아',
  홍콩: '중화권',
  마카오: '중화권',
  타이베이: '중화권',
  상하이: '중화권',
  파리: '유럽',
  런던: '유럽',
  로마: '유럽',
  바르셀로나: '유럽',
  프라하: '유럽',
  암스테르담: '유럽',
  취리히: '유럽',
  뉴욕: '미주',
  로스앤젤레스: '미주',
  호놀룰루: '미주',
  샌프란시스코: '미주',
  라스베이거스: '미주',
  칸쿤: '미주',
} as const satisfies Record<Location, typeof LocationGroups[number]>;

export const LocationOptions = Locations.map((location) => {
  const coordinate = getCoordinateByLocation(location)

  return {
    name: location,
    lat: coordinate.lat,
    lng: coordinate.lng,
    group: LocationGroup[location],
  }
})
export type LocationOption = typeof LocationOptions[number]