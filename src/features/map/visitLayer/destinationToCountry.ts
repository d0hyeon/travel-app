/**
 * 여행 목적지 이름 → GeoJSON name 속성값 매핑
 * D3 world.geojson (Natural Earth) 의 name 속성과 매핑됨
 *
 * 주의: 홍콩·마카오는 단순화된 세계지도에서 China로 통합되는 경우가 많음
 */
export const DESTINATION_TO_COUNTRY: Record<string, string> = {
  // 국내
  서울: 'South Korea', 부산: 'South Korea', 제주: 'South Korea',
  강릉: 'South Korea', 경주: 'South Korea', 여수: 'South Korea',
  전주: 'South Korea', 속초: 'South Korea', 삼척: 'South Korea',
  인천: 'South Korea', 대구: 'South Korea', 대전: 'South Korea',
  광주: 'South Korea', 단양: 'South Korea', 평창: 'South Korea',
  포천: 'South Korea', 진안: 'South Korea',
  // 일본
  도쿄: 'Japan', 오사카: 'Japan', 교토: 'Japan', 후쿠오카: 'Japan',
  삿포로: 'Japan', 오키나와: 'Japan',
  // 동남아
  방콕: 'Thailand', 푸켓: 'Thailand',
  싱가포르: 'Singapore',
  '베트남 다낭': 'Vietnam', '베트남 호치민': 'Vietnam', '베트남 하노이': 'Vietnam',
  발리: 'Indonesia',
  세부: 'Philippines',
  코타키나발루: 'Malaysia',
  // 동북아 (홍콩·마카오는 단순화 지도에서 China로 표시됨)
  홍콩: 'China',
  마카오: 'China',
  타이베이: 'Taiwan',
  상하이: 'China',
  // 유럽
  파리: 'France',
  런던: 'United Kingdom',
  로마: 'Italy',
  바르셀로나: 'Spain',
  프라하: 'Czech Republic',
  암스테르담: 'Netherlands',
  '스위스 취리히': 'Switzerland',
  // 아메리카
  뉴욕: 'United States of America', 로스앤젤레스: 'United States of America',
  '하와이 호놀룰루': 'United States of America', 샌프란시스코: 'United States of America',
  라스베이거스: 'United States of America',
  칸쿤: 'Mexico',
}
