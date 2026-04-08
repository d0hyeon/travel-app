/**
 * 여행 목적지 이름 → ISO 3166-1 alpha-3 국가 코드 매핑
 * Natural Earth ne_110m_admin_0_countries 의 ISO_A3 속성과 매핑됨
 */
export const DESTINATION_TO_ISO3: Record<string, string> = {
  // 국내
  서울: 'KOR', 부산: 'KOR', 제주: 'KOR', 강릉: 'KOR', 경주: 'KOR',
  여수: 'KOR', 전주: 'KOR', 속초: 'KOR', 삼척: 'KOR', 인천: 'KOR',
  대구: 'KOR', 대전: 'KOR', 광주: 'KOR', 단양: 'KOR', 평창: 'KOR',
  포천: 'KOR', 진안: 'KOR',
  // 일본
  도쿄: 'JPN', 오사카: 'JPN', 교토: 'JPN', 후쿠오카: 'JPN',
  삿포로: 'JPN', 오키나와: 'JPN',
  // 동남아
  방콕: 'THA', 푸켓: 'THA',
  싱가포르: 'SGP',
  '베트남 다낭': 'VNM', '베트남 호치민': 'VNM', '베트남 하노이': 'VNM',
  발리: 'IDN',
  세부: 'PHL',
  코타키나발루: 'MYS',
  // 동북아
  홍콩: 'HKG',
  마카오: 'MAC',
  타이베이: 'TWN',
  상하이: 'CHN',
  // 유럽
  파리: 'FRA',
  런던: 'GBR',
  로마: 'ITA',
  바르셀로나: 'ESP',
  프라하: 'CZE',
  암스테르담: 'NLD',
  '스위스 취리히': 'CHE',
  // 아메리카
  뉴욕: 'USA', 로스앤젤레스: 'USA', '하와이 호놀룰루': 'USA',
  샌프란시스코: 'USA', 라스베이거스: 'USA',
  칸쿤: 'MEX',
}
