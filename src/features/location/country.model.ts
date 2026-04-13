import type { ValueOf } from "~shared/utils/types";

export const Country = {
  한국: 'South Korea',
  일본: 'Japan',
  태국: 'Thailand',
  싱가포르: 'Singapore',
  베트남: 'Vietnam',
  인도네시아: 'Indonesia',
  필리핀: 'Philippines',
  말레이시아: 'Malaysia',
  중국: 'China',
  대만: 'Taiwan',
  프랑스: 'France',
  영국: 'United Kingdom',
  이탈리아: 'Italy',
  스페인: 'Spain',
  체코: 'Czech Republic',
  네덜란드: 'Netherlands',
  스위스: 'Switzerland',
  미국: 'United States of America',
  멕시코: 'Mexico',
  캐나다: 'Canada',
} as const
export type Country = ValueOf<typeof Country>;

export const CountryCode = {
  [Country.한국]: 'KOR',
  [Country.일본]: 'JPN',
  [Country.태국]: 'THA',
  [Country.싱가포르]: 'SGP',
  [Country.베트남]: 'VNM',
  [Country.인도네시아]: 'IDN',
  [Country.필리핀]: 'PHL',
  [Country.말레이시아]: 'MYS',
  [Country.중국]: 'CHN',
  [Country.대만]: 'TWN',
  [Country.프랑스]: 'FRA',
  [Country.영국]: 'GBR',
  [Country.이탈리아]: 'ITA',
  [Country.스페인]: 'ESP',
  [Country.체코]: 'CZE',
  [Country.네덜란드]: 'NLD',
  [Country.스위스]: 'CHE',
  [Country.미국]: 'USA',
  [Country.멕시코]: 'MEX',
  [Country.캐나다]: 'CAN',
} as const satisfies Record<Country, string>;
export type CountryCode = ValueOf<typeof CountryCode>;