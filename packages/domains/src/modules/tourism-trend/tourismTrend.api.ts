import { governmentApi } from '../../gateways/client'
import { getSeasonDateRange, type SeasonValue } from './season'
import {
  RegionLevel,
  type RegionLevelValue,
  type TourismVisitorItem,
} from './tourismTrend.types'

export const tourismTrendKey = 'tourism-trend'

const tourismTrendEndpoint: Record<RegionLevelValue, string> = {
  [RegionLevel.Metro]:
    '/B551011/DataLabService/metcoRegnVisitrDDList',
  [RegionLevel.Local]:
    '/B551011/DataLabService/locgoRegnVisitrDDList',
}

// 지역 필터 파라미터를 지원하지 않아 전 지역이 한 번에 내려온다.
// locgo 한 계절이 약 73,000건이므로 페이지네이션 대신 한 번에 받는다.
const tourismTrendPageSize = 100_000

// marine-activity는 "00"이지만 이 서비스는 "0000"이다.
const tourismTrendSuccessCode = '0000'

type TourismTrendRawItem = Record<string, unknown>

interface TourismTrendResponseBody {
  items?: {
    item?: TourismTrendRawItem | TourismTrendRawItem[]
  }
}

interface TourismTrendApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body: TourismTrendResponseBody
  }
}

interface GetSeasonVisitorItemsParams {
  level: RegionLevelValue
  season: SeasonValue
  year: number
}

export async function getSeasonVisitorItems({
  level,
  season,
  year,
}: GetSeasonVisitorItemsParams): Promise<TourismVisitorItem[]> {
  const { startYmd, endYmd } = getSeasonDateRange(season, year)

  const { response } = await governmentApi.get<TourismTrendApiResponse>(
    tourismTrendEndpoint[level],
    {
      params: {
        MobileOS: 'ETC',
        MobileApp: 'TravelApp',
        _type: 'json',
        startYmd,
        endYmd,
        numOfRows: tourismTrendPageSize,
        pageNo: 1,
      },
    },
  )

  if (response.header.resultCode !== tourismTrendSuccessCode) {
    throw new Error(response.header.resultMsg)
  }

  return toTourismVisitorItems(response.body)
}

export function toTourismVisitorItems(
  responseBody: TourismTrendResponseBody,
): TourismVisitorItem[] {
  return toRawItems(responseBody).flatMap((rawItem) => {
    const regionCode = readString(rawItem, ['signguCode', 'areaCode'])
    const visitorDivision = readString(rawItem, ['touDivCd'])
    // Number('')는 0이라 유한하다. 빈 문자열을 먼저 걸러야 한다.
    const rawVisitorCount = readString(rawItem, ['touNum'])

    if (regionCode == null || visitorDivision == null) return []
    if (rawVisitorCount == null) return []

    const visitorCount = Number(rawVisitorCount)
    if (!Number.isFinite(visitorCount)) return []

    return [{ regionCode, visitorDivision, visitorCount }]
  })
}

function toRawItems(
  responseBody: TourismTrendResponseBody,
): TourismTrendRawItem[] {
  const item = responseBody.items?.item
  if (item == null) return []
  return Array.isArray(item) ? item : [item]
}

function readString(rawItem: TourismTrendRawItem, fieldNames: string[]) {
  const matched = fieldNames
    .map((fieldName) => rawItem[fieldName])
    .find((value) => typeof value === 'string' && value.length > 0)

  return typeof matched === 'string' ? matched : null
}
