import { describe, expect, it } from 'vitest'
import { PlaceCategoryType } from '../place.types'
import { toPlaceCategory } from '../placeCategory.utils'

const kakao = (categoryName?: string) => toPlaceCategory({ provider: 'kakao', categoryName })
const google = (primaryType?: string, types?: string[]) =>
  toPlaceCategory({ provider: 'google', primaryType, types })

describe('toPlaceCategory — kakao 실측 사례', () => {
  it.each([
    ['여행 > 관광,명소 > 해수욕장,해변', PlaceCategoryType.바다],
    ['여행 > 관광,명소 > 산', PlaceCategoryType.산],
    ['여행 > 관광,명소 > 산봉우리', PlaceCategoryType.산],
    ['여행 > 관광,명소 > 오름', PlaceCategoryType.산],
    ['여행 > 관광,명소 > 등산로', PlaceCategoryType.산],
    ['여행 > 공원 > 도시근린공원', PlaceCategoryType.공원],
    ['음식점 > 술집 > 호프,요리주점', PlaceCategoryType.술],
    ['음식점 > 술집 > 와인바', PlaceCategoryType.술],
    ['음식점 > 카페 > 커피전문점 > 스타벅스', PlaceCategoryType.카페],
    ['음식점 > 카페', PlaceCategoryType.카페],
    ['여행 > 숙박 > 호텔 > 롯데호텔', PlaceCategoryType.숙소],
    ['여행 > 숙박 > 야영,캠핑장', PlaceCategoryType.숙소],
    ['여행 > 관광,명소 > 테마파크', PlaceCategoryType.액티비티],
    ['스포츠,레저 > 수영,수상 > 수상스포츠', PlaceCategoryType.액티비티],
    ['스포츠,레저 > 스포츠시설', PlaceCategoryType.액티비티],
    ['가정,생활 > 백화점 > 신세계백화점', PlaceCategoryType.쇼핑],
    ['가정,생활 > 드럭스토어 > 올리브영', PlaceCategoryType.쇼핑],
    ['가정,생활 > 슈퍼마켓 > 대형슈퍼 > 하나로마트', PlaceCategoryType.쇼핑],
    ['교통,수송 > 지하철,전철 > 수도권3호선', PlaceCategoryType.대중교통],
    ['교통,수송 > 기차,철도 > 기차역 > KTX정차역', PlaceCategoryType.대중교통],
    ['교통,수송 > 교통시설 > 공항', PlaceCategoryType.대중교통],
    ['여행 > 관광,명소 > 문화유적 > 고궁,궁', PlaceCategoryType.관광지],
    ['여행 > 관광,명소 > 전망대', PlaceCategoryType.관광지],
    ['여행 > 관광,명소', PlaceCategoryType.관광지],
    ['음식점 > 간식 > 도넛', PlaceCategoryType.카페],
    ['음식점 > 카페 > 테마카페 > 디저트카페', PlaceCategoryType.카페],
    ['음식점 > 한식 > 국밥', PlaceCategoryType.음식점],
    ['음식점 > 패스트푸드 > 맥도날드', PlaceCategoryType.음식점],
    ['음식점 > 술집 > 일본식주점', PlaceCategoryType.술],
    ['가정,생활 > 유흥시설 > 나이트,클럽', PlaceCategoryType.술],
    ['여행 > 숙박 > 콘도,리조트 > 소노호텔앤리조트', PlaceCategoryType.숙소],
    ['여행 > 숙박 > 펜션', PlaceCategoryType.숙소],
    ['여행 > 관광,명소 > 섬 > 섬(내륙)', PlaceCategoryType.바다],
    ['교통,수송 > 교통시설 > 항구,포구 > 부두', PlaceCategoryType.바다],
    ['여행 > 관광,명소 > 국립공원', PlaceCategoryType.숲],
    ['여행 > 관광,명소 > 자연휴양림', PlaceCategoryType.숲],
    ['여행 > 관광,명소 > 수목원,식물원', PlaceCategoryType.숲],
    ['여행 > 관광,명소 > 계곡', PlaceCategoryType.숲],
    ['여행 > 관광,명소 > 도보여행 > 둘레길 > 서울둘레길', PlaceCategoryType.숲],
    ['여행 > 공원', PlaceCategoryType.공원],
    ['가정,생활 > 편의점 > CU', PlaceCategoryType.쇼핑],
    ['가정,생활 > 대형마트 > 이마트', PlaceCategoryType.쇼핑],
    ['가정,생활 > 복합쇼핑몰', PlaceCategoryType.쇼핑],
    ['가정,생활 > 시장', PlaceCategoryType.쇼핑],
    ['가정,생활 > 패션 > 의류판매 > 유니클로', PlaceCategoryType.쇼핑],
    ['스포츠,레저 > 스포츠용품 > 낚시용품', PlaceCategoryType.쇼핑],
    ['스포츠,레저 > 골프 > 골프장', PlaceCategoryType.액티비티],
    ['스포츠,레저 > 스키,스노우보드 > 스키장', PlaceCategoryType.액티비티],
    ['여행 > 관광,명소 > 테마파크 > 워터테마파크', PlaceCategoryType.액티비티],
    ['여행 > 관광,명소 > 온천', PlaceCategoryType.액티비티],
    ['가정,생활 > 여가시설 > 노래방', PlaceCategoryType.액티비티],
    ['가정,생활 > 목욕탕,사우나 > 찜질방', PlaceCategoryType.액티비티],
    ['가정,생활 > 패션 > 의류대여서비스 > 한복대여', PlaceCategoryType.액티비티],
    ['문화,예술 > 영화,영상 > 영화관 > CGV', PlaceCategoryType.액티비티],
    ['교통,수송 > 운송 > 해운,해상', PlaceCategoryType.액티비티],
    ['교통,수송 > 지하철,전철 > GTX-A', PlaceCategoryType.대중교통],
    ['교통,수송 > 교통시설 > 고속,시외버스터미널', PlaceCategoryType.대중교통],
    ['교통,수송 > 교통시설 > 여객선터미널', PlaceCategoryType.대중교통],
    ['문화,예술 > 문화시설 > 박물관', PlaceCategoryType.관광지],
    ['문화,예술 > 문화시설 > 아쿠아리움', PlaceCategoryType.관광지],
    ['문화,예술 > 종교 > 불교 > 절,사찰', PlaceCategoryType.관광지],
    ['여행 > 관광,명소 > 호수', PlaceCategoryType.관광지],
    ['여행 > 관광,명소 > 동물원', PlaceCategoryType.관광지],
    ['여행 > 관광,명소 > 케이블카', PlaceCategoryType.관광지],
    ['음식점 > 간식 > 토스트', PlaceCategoryType.음식점],
    ['음식점 > 간식 > 제과,베이커리', PlaceCategoryType.카페],
    ['교통,수송 > 운송 > 택배', PlaceCategoryType.기타],
  ])('%s → %s', (categoryName, expected) => {
    expect(kakao(categoryName)).toBe(expected)
  })

  it('주차장·주유소·이벤트·병원·은행은 기타로 분류한다', () => {
    expect(kakao('의료,건강 > 병원 > 종합병원')).toBe(PlaceCategoryType.기타)
    expect(kakao('금융,보험 > 금융서비스 > 은행 > 하나은행')).toBe(PlaceCategoryType.기타)
    expect(kakao('가정,생활 > 패션 > 의류수선')).toBe(PlaceCategoryType.기타)
    expect(kakao('교통,수송 > 교통시설 > 주차장 > 공영주차장')).toBe(PlaceCategoryType.기타)
    expect(kakao('교통,수송 > 자동차 > 주유,가스 > LPG충전소')).toBe(PlaceCategoryType.기타)
    expect(kakao('이슈 > 이벤트 > 페스티벌')).toBe(PlaceCategoryType.기타)
  })

  it('카테고리가 없으면 undefined를 반환한다', () => {
    expect(kakao(undefined)).toBeUndefined()
    expect(kakao('')).toBeUndefined()
  })

  it('주거시설은 기타로 분류한다', () => {
    expect(kakao('부동산 > 주거시설 > 아파트')).toBe(PlaceCategoryType.기타)
  })
})

describe('toPlaceCategory — google primaryType', () => {
  it.each([
    ['beach', PlaceCategoryType.바다],
    ['mountain_peak', PlaceCategoryType.산],
    ['park', PlaceCategoryType.공원],
    ['pub', PlaceCategoryType.술],
    ['wine_bar', PlaceCategoryType.술],
    ['coffee_shop', PlaceCategoryType.카페],
    ['korean_restaurant', PlaceCategoryType.음식점],
    ['campground', PlaceCategoryType.숙소],
    ['rv_park', PlaceCategoryType.숙소],
    ['department_store', PlaceCategoryType.쇼핑],
    ['cosmetics_store', PlaceCategoryType.쇼핑],
    ['subway_station', PlaceCategoryType.대중교통],
    ['international_airport', PlaceCategoryType.대중교통],
    ['bus_stop', PlaceCategoryType.대중교통],
    ['bakery', PlaceCategoryType.카페],
    ['korean_barbecue_restaurant', PlaceCategoryType.음식점],
    ['hotel', PlaceCategoryType.숙소],
    ['supermarket', PlaceCategoryType.쇼핑],
    ['spa', PlaceCategoryType.액티비티],
    ['lake', PlaceCategoryType.관광지],
    ['island', PlaceCategoryType.바다],
    ['hiking_area', PlaceCategoryType.산],
    ['city_park', PlaceCategoryType.공원],
    ['amusement_park', PlaceCategoryType.액티비티],
    ['sports_club', PlaceCategoryType.액티비티],
    ['cultural_landmark', PlaceCategoryType.관광지],
    ['historical_landmark', PlaceCategoryType.관광지],
    ['museum', PlaceCategoryType.관광지],
    ['tourist_attraction', PlaceCategoryType.관광지],
    ['national_park', PlaceCategoryType.숲],
    ['woods', PlaceCategoryType.숲],
  ])('%s → %s', (primaryType, expected) => {
    expect(google(primaryType, [primaryType])).toBe(expected)
  })

  it('이자카야는 *_restaurant 규칙보다 먼저 술로 분류한다', () => {
    expect(
      google('japanese_izakaya_restaurant', ['japanese_izakaya_restaurant', 'japanese_restaurant', 'restaurant']),
    ).toBe(PlaceCategoryType.술)
  })

  it('충전소·주유소는 *_station이어도 대중교통이 아니다', () => {
    expect(google('gas_station', ['gas_station'])).toBe(PlaceCategoryType.기타)
    expect(google('electric_vehicle_charging_station', ['electric_vehicle_charging_station'])).toBe(
      PlaceCategoryType.기타,
    )
  })

  it('primaryType이 기본 타입이면 types 순서대로 첫 매핑을 따른다', () => {
    expect(google(undefined, ['historical_landmark', 'historical_place', 'point_of_interest'])).toBe(
      PlaceCategoryType.관광지,
    )
    expect(google('point_of_interest', ['point_of_interest', 'cafe', 'establishment'])).toBe(PlaceCategoryType.카페)
  })

  it('primaryType이 없고 types에 범용 store만 있으면 쇼핑으로 끌려가지 않는다', () => {
    expect(google(undefined, ['car_repair', 'store', 'point_of_interest'])).toBe(PlaceCategoryType.기타)
  })

  it('primaryType이 범용 store면 types의 구체적인 값을 따른다', () => {
    expect(google('store', ['store', 'book_store'])).toBe(PlaceCategoryType.쇼핑)
    expect(google('store', ['store', 'cafe'])).toBe(PlaceCategoryType.카페)
  })

  it('primaryType과 types가 다르면 primaryType을 따른다', () => {
    expect(google('park', ['beach', 'tourist_attraction'])).toBe(PlaceCategoryType.공원)
  })

  it('primaryType이 매핑되면 types의 다른 값보다 우선한다', () => {
    expect(google('japanese_restaurant', ['bar', 'japanese_restaurant', 'restaurant'])).toBe(PlaceCategoryType.음식점)
  })

  it('원본은 있으나 매핑되는 타입이 없으면 기타로 분류한다', () => {
    expect(google('association_or_organization', ['association_or_organization', 'point_of_interest'])).toBe(
      PlaceCategoryType.기타,
    )
    expect(google('point_of_interest', ['point_of_interest', 'establishment'])).toBe(PlaceCategoryType.기타)
  })

  it('주거시설은 기타로 분류한다', () => {
    expect(google('apartment_complex', ['apartment_complex', 'point_of_interest'])).toBe(PlaceCategoryType.기타)
  })

  it('원본이 전혀 없으면 undefined를 반환한다', () => {
    expect(google(undefined, undefined)).toBeUndefined()
    expect(google(undefined, [])).toBeUndefined()
  })
})
