import { PlaceCategoryType } from './place.types'

export type ProviderCategory =
  | { provider: 'kakao'; categoryName?: string }
  | { provider: 'google'; primaryType?: string; types?: readonly string[] }

interface KakaoCategoryRule {
  category: PlaceCategoryType
  paths: readonly string[]
}

interface GoogleTypeRule {
  category: PlaceCategoryType
  types: readonly string[]
}

interface GoogleTypeSuffixRule {
  category: PlaceCategoryType
  suffix: string
}

const KAKAO_PATH_SEPARATOR = ' > '

const KAKAO_CATEGORY_RULES: readonly KakaoCategoryRule[] = [
  {
    category: PlaceCategoryType.술,
    paths: ['음식점 > 술집', '가정,생활 > 유흥시설'],
  },
  {
    category: PlaceCategoryType.카페,
    paths: [
      '음식점 > 카페',
      '음식점 > 간식 > 도넛',
      '음식점 > 간식 > 아이스크림',
      '음식점 > 간식 > 제과,베이커리',
    ],
  },
  {
    category: PlaceCategoryType.음식점,
    paths: ['음식점'],
  },
  {
    category: PlaceCategoryType.숙소,
    paths: ['여행 > 숙박'],
  },
  {
    category: PlaceCategoryType.바다,
    paths: [
      '여행 > 관광,명소 > 해수욕장,해변',
      '여행 > 관광,명소 > 섬',
      '교통,수송 > 교통시설 > 항구,포구',
      '교통,수송 > 교통시설 > 등대',
    ],
  },
  {
    category: PlaceCategoryType.산,
    paths: [
      '여행 > 관광,명소 > 산',
      '여행 > 관광,명소 > 산봉우리',
      '여행 > 관광,명소 > 오름',
      '여행 > 관광,명소 > 등산로',
    ],
  },
  {
    category: PlaceCategoryType.숲,
    paths: [
      '여행 > 관광,명소 > 국립공원',
      '여행 > 관광,명소 > 자연휴양림',
      '여행 > 관광,명소 > 수목원,식물원',
      '여행 > 관광,명소 > 국가정원',
      '여행 > 관광,명소 > 계곡',
      '여행 > 관광,명소 > 폭포',
      '여행 > 관광,명소 > 샘터,약수터',
      '여행 > 관광,명소 > 생태보존,서식지',
      '여행 > 관광,명소 > 도보여행',
    ],
  },
  {
    category: PlaceCategoryType.공원,
    paths: ['여행 > 공원'],
  },
  {
    category: PlaceCategoryType.쇼핑,
    paths: [
      '가정,생활 > 백화점',
      '가정,생활 > 대형마트',
      '가정,생활 > 슈퍼마켓',
      '가정,생활 > 편의점',
      '가정,생활 > 복합쇼핑몰',
      '가정,생활 > 상설할인매장',
      '가정,생활 > 생활용품점',
      '가정,생활 > 드럭스토어',
      '가정,생활 > 시장',
      '가정,생활 > 면세점',
      '가정,생활 > 식품판매',
      '가정,생활 > 꽃집,꽃배달',
      '가정,생활 > 가구판매',
      '가정,생활 > 문구,사무용품',
      '가정,생활 > 유아',
      '가정,생활 > 중고용품',
      '가정,생활 > 전자제품 > 전자제품판매',
      '가정,생활 > 패션 > 의류판매',
      '가정,생활 > 패션 > 패션잡화점',
      '문화,예술 > 도서 > 서점',
      '스포츠,레저 > 스포츠용품',
      '여행 > 기념품판매',
    ],
  },
  {
    category: PlaceCategoryType.액티비티,
    paths: [
      '스포츠,레저',
      '여행 > 관광,명소 > 테마파크',
      '여행 > 관광,명소 > 유원지',
      '여행 > 관광,명소 > 온천',
      '여행 > 관광,명소 > 관광농원',
      '여행 > 체험여행',
      '가정,생활 > 여가시설',
      '가정,생활 > 목욕탕,사우나',
      '가정,생활 > 주말농장',
      '가정,생활 > 패션 > 의류대여서비스',
      '문화,예술 > 영화,영상 > 영화관',
      '교통,수송 > 운송 > 해운,해상',
    ],
  },
  {
    category: PlaceCategoryType.대중교통,
    paths: [
      '교통,수송 > 지하철,전철',
      '교통,수송 > 기차,철도',
      '교통,수송 > 교통시설 > 공항',
      '교통,수송 > 교통시설 > 고속,시외버스정류장',
      '교통,수송 > 교통시설 > 고속,시외버스터미널',
      '교통,수송 > 교통시설 > 여객선터미널',
      '교통,수송 > 교통시설 > 선착장,항만시설',
    ],
  },
  {
    category: PlaceCategoryType.관광지,
    paths: [
      '여행 > 관광,명소',
      '문화,예술 > 문화시설',
      '문화,예술 > 종교',
      '문화,예술 > 전시회,박람회',
      '문화,예술 > 미술,공예 > 화랑',
    ],
  },
]

const GOOGLE_TYPE_RULES: readonly GoogleTypeRule[] = [
  {
    category: PlaceCategoryType.술,
    types: [
      'bar',
      'bar_and_grill',
      'beer_garden',
      'brewery',
      'brewpub',
      'cocktail_bar',
      'gastropub',
      'hookah_bar',
      'irish_pub',
      'japanese_izakaya_restaurant',
      'lounge_bar',
      'night_club',
      'pub',
      'sports_bar',
      'wine_bar',
      'winery',
    ],
  },
  {
    category: PlaceCategoryType.카페,
    types: [
      'cafe',
      'cat_cafe',
      'dog_cafe',
      'coffee_roastery',
      'coffee_shop',
      'coffee_stand',
      'tea_house',
      'bakery',
      'bagel_shop',
      'cake_shop',
      'pastry_shop',
      'dessert_shop',
      'dessert_restaurant',
      'donut_shop',
      'ice_cream_shop',
      'juice_shop',
      'acai_shop',
      'chocolate_shop',
      'candy_store',
      'confectionery',
    ],
  },
  {
    category: PlaceCategoryType.음식점,
    types: [
      'restaurant',
      'food_court',
      'cafeteria',
      'bistro',
      'deli',
      'diner',
      'snack_bar',
      'sandwich_shop',
      'noodle_shop',
      'kebab_shop',
      'salad_shop',
      'meal_delivery',
      'meal_takeaway',
      'pizza_delivery',
      'hot_dog_stand',
      'steak_house',
    ],
  },
  {
    category: PlaceCategoryType.숙소,
    types: [
      'lodging',
      'hotel',
      'hostel',
      'motel',
      'inn',
      'bed_and_breakfast',
      'budget_japanese_inn',
      'japanese_inn',
      'camping_cabin',
      'campground',
      'cottage',
      'extended_stay_hotel',
      'farmstay',
      'guest_house',
      'mobile_home_park',
      'private_guest_room',
      'resort_hotel',
      'rv_park',
    ],
  },
  {
    category: PlaceCategoryType.바다,
    types: ['beach', 'island', 'marina'],
  },
  {
    category: PlaceCategoryType.산,
    types: ['mountain_peak', 'hiking_area'],
  },
  {
    category: PlaceCategoryType.숲,
    types: [
      'woods',
      'nature_preserve',
      'wildlife_refuge',
      'national_park',
      'botanical_garden',
      'garden',
    ],
  },
  {
    category: PlaceCategoryType.공원,
    types: [
      'park',
      'city_park',
      'state_park',
      'dog_park',
      'playground',
      'picnic_ground',
      'plaza',
      'barbecue_area',
    ],
  },
  {
    category: PlaceCategoryType.쇼핑,
    types: [
      'shopping_mall',
      'department_store',
      'market',
      'flea_market',
      'farmers_market',
      'supermarket',
      'hypermarket',
      'discount_supermarket',
      'gift_shop',
      'butcher_shop',
      'wholesaler',
      'drugstore',
    ],
  },
  {
    category: PlaceCategoryType.액티비티,
    types: [
      'adventure_sports_center',
      'amusement_center',
      'amusement_park',
      'water_park',
      'ferris_wheel',
      'roller_coaster',
      'ski_resort',
      'golf_course',
      'indoor_golf_course',
      'miniature_golf_course',
      'bowling_alley',
      'go_karting_venue',
      'paintball_center',
      'off_roading_area',
      'cycling_park',
      'skateboard_park',
      'karaoke',
      'video_arcade',
      'movie_theater',
      'casino',
      'comedy_club',
      'live_music_venue',
      'dance_hall',
      'indoor_playground',
      'internet_cafe',
      'childrens_camp',
      'fishing_charter',
      'fishing_pond',
      'fishing_pier',
      'swimming_pool',
      'sports_complex',
      'sports_club',
      'sports_activity_location',
      'sports_coaching',
      'sports_school',
      'stadium',
      'arena',
      'athletic_field',
      'tennis_court',
      'ice_skating_rink',
      'fitness_center',
      'gym',
      'yoga_studio',
      'race_course',
      'spa',
      'sauna',
      'public_bath',
      'massage',
      'massage_spa',
      'wellness_center',
    ],
  },
  {
    category: PlaceCategoryType.대중교통,
    types: [
      'airport',
      'international_airport',
      'heliport',
      'bus_station',
      'bus_stop',
      'subway_station',
      'train_station',
      'light_rail_station',
      'transit_station',
      'transit_stop',
      'tram_stop',
      'ferry_terminal',
      'ferry_service',
      'bike_sharing_station',
      'taxi_stand',
      'taxi_service',
      'train_ticket_office',
      'transit_depot',
      'transportation_service',
    ],
  },
  {
    category: PlaceCategoryType.관광지,
    types: [
      'tourist_attraction',
      'art_gallery',
      'art_museum',
      'history_museum',
      'museum',
      'castle',
      'cultural_landmark',
      'fountain',
      'historical_landmark',
      'historical_place',
      'monument',
      'sculpture',
      'performing_arts_theater',
      'auditorium',
      'concert_hall',
      'opera_house',
      'philharmonic_hall',
      'cultural_center',
      'amphitheatre',
      'planetarium',
      'observation_deck',
      'scenic_spot',
      'lake',
      'river',
      'aquarium',
      'zoo',
      'wildlife_park',
      'visitor_center',
      'tourist_information_center',
      'vineyard',
      'buddhist_temple',
      'hindu_temple',
      'mosque',
      'shinto_shrine',
      'synagogue',
      'church',
    ],
  },
]

const GOOGLE_TYPE_SUFFIX_RULES: readonly GoogleTypeSuffixRule[] = [
  { category: PlaceCategoryType.음식점, suffix: '_restaurant' },
  { category: PlaceCategoryType.쇼핑, suffix: '_store' },
]

const GOOGLE_AREA_TYPE_PREFIXES = ['administrative_area_level', 'sublocality'] as const

const GOOGLE_GENERIC_TYPES: readonly string[] = [
  'establishment',
  'store',
  'point_of_interest',
  'food',
  'health',
  'finance',
  'natural_feature',
  'landmark',
  'place_of_worship',
  'political',
  'geocode',
  'premise',
  'subpremise',
  'street_address',
  'route',
  'intersection',
  'neighborhood',
  'locality',
  'country',
  'town_square',
  'colloquial_area',
  'general_contractor',
  'plus_code',
  'postal_code',
  'postal_town',
  'archipelago',
  'continent',
]

export function toPlaceCategory(source: ProviderCategory): PlaceCategoryType | undefined {
  if (source.provider === 'kakao') return toKakaoPlaceCategory(source.categoryName)
  return toGooglePlaceCategory(source.primaryType, source.types)
}

function toKakaoPlaceCategory(categoryName?: string): PlaceCategoryType | undefined {
  if (!categoryName) return undefined

  const matchedRule = KAKAO_CATEGORY_RULES.find(({ paths }) =>
    paths.some((path) => isWithinKakaoPath(categoryName, path)),
  )
  return matchedRule?.category ?? PlaceCategoryType.기타
}

function isWithinKakaoPath(categoryName: string, path: string) {
  return categoryName === path || categoryName.startsWith(path + KAKAO_PATH_SEPARATOR)
}

function toGooglePlaceCategory(
  primaryType?: string,
  types: readonly string[] = [],
): PlaceCategoryType | undefined {
  if (primaryType !== undefined && !isGenericGoogleType(primaryType)) {
    return findGoogleTypeCategory(primaryType) ?? PlaceCategoryType.기타
  }

  const mappedCategory = types
    .map((type) => findGoogleTypeCategory(type))
    .find((category) => category !== undefined)
  if (mappedCategory !== undefined) return mappedCategory

  const hasProviderCategory = primaryType !== undefined || types.length > 0
  return hasProviderCategory ? PlaceCategoryType.기타 : undefined
}

function isGenericGoogleType(type: string) {
  return (
    GOOGLE_GENERIC_TYPES.includes(type) ||
    GOOGLE_AREA_TYPE_PREFIXES.some((prefix) => type.startsWith(prefix))
  )
}

function findGoogleTypeCategory(type: string): PlaceCategoryType | undefined {
  const exactRule = GOOGLE_TYPE_RULES.find(({ types }) => types.includes(type))
  if (exactRule) return exactRule.category

  return GOOGLE_TYPE_SUFFIX_RULES.find(({ suffix }) => type.endsWith(suffix))?.category
}
