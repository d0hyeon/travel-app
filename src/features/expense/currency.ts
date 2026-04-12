/**
 * 목적지별 화폐 단위 매핑
 */
import { getCountryByLocation } from '~features/location';
import { Country } from '~features/location/country.model';
import { reverseKeyValue } from '~shared/utils/common';
import type { ValueOf } from '~shared/utils/types';


// 화폐 코드 -> 이름 매핑
export const CurrencyCode = {
  원: 'KRW',
  엔: 'JPY',
  달러: 'USD',
  유로: 'EUR',
  파운드: 'GBP',
  위안: 'CNY',
  '대만 달러': 'TWD',
  '홍콩 달러': 'HKD',
  바트: 'THB',
  동: 'VND',
  '싱가포르 달러': 'SGD',
  루피아: 'IDR',
  '필리핀 페소': 'PHP',
  링깃: 'MYR',
  파타카: 'MOP',
  코루나: 'CZK',
  프랑: 'CHF',
  '멕시코 페소': 'MXN',
} as const
export type CurrencyCode = ValueOf<typeof CurrencyCode>;
export const CurrencyCodes = Object.keys(CurrencyCode) as CurrencyCode[];
export const CurrencyCodeLabel = reverseKeyValue(CurrencyCode);

export const CountryCurrencyCode = {
  [Country.한국]: [CurrencyCode.원],
  [Country.일본]: [CurrencyCode.엔],
  [Country.태국]: [CurrencyCode.바트],
  [Country.싱가포르]: [CurrencyCode['싱가포르 달러']],
  [Country.베트남]: [CurrencyCode.동],
  [Country.인도네시아]: [CurrencyCode.루피아],
  [Country.필리핀]: [CurrencyCode['필리핀 페소']],
  [Country.말레이시아]: [CurrencyCode.링깃],
  [Country.중국]: [CurrencyCode.위안],
  [Country.대만]: [CurrencyCode['대만 달러']],
  [Country.프랑스]: [CurrencyCode.유로],
  [Country.영국]: [CurrencyCode.파운드],
  [Country.이탈리아]: [CurrencyCode.유로],
  [Country.스페인]: [CurrencyCode.유로],
  [Country.체코]: [CurrencyCode.코루나],
  [Country.네덜란드]: [CurrencyCode.유로],
  [Country.스위스]: [CurrencyCode.프랑, CurrencyCode.유로], // 공식 화폐 + 통용
  [Country.미국]: [CurrencyCode.달러],
  [Country.멕시코]: [CurrencyCode['멕시코 페소']],
} satisfies Record<Country, CurrencyCode[]>;

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * 통화별 환율 엔트리 (1 외화 = X원)
 */
export interface ExchangeRateEntry {
  currencyCode: CurrencyCode;
  rate: number;
}

export const KRW: CurrencyInfo = { code: 'KRW', symbol: '원', name: '원', locale: 'ko-KR' };

/**
 * 목적지에 해당하는 화폐 정보 반환
 * 매핑되지 않은 목적지는 USD 반환
 */
export function getCurrencyByDestination(destination: string): CurrencyInfo[] {
  const country = getCountryByLocation(destination);
  
  if (country) {
    return CountryCurrencyCode[country].map(code => CURRENCY_INFO_MAP[code]);
  }

  return [{ code: 'USD', symbol: '$', name: '달러', locale: 'en-US' }];
}

/**
 * 복수 목적지에 해당하는 화포 목록 반환 (KRW 포함, 중복 제거)
 */
export function getCurrenciesByDestinations(destinations: string[]): CurrencyInfo[] {
  const seen = new Set<string>();
  const currencies: CurrencyInfo[] = [{ code: 'KRW', symbol: '원', name: '원', locale: 'ko-KR' }];
  seen.add('KRW');

  for (const destination of destinations) {
    for (const currency of getCurrencyByDestination(destination)) {
      if (!seen.has(currency.code)) {
        seen.add(currency.code);
        currencies.push(currency);
      }
    }
  }

  return currencies;
}

/**
 * 금액을 지정된 화폐 단위로 포맷팅
 */
export function formatAmount(amount: number, currency: CurrencyInfo): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  return `${formatted}${currency.name}`;
}

/**
 * 원화 금액을 다른 화폐로 변환하여 포맷팅
 * 환율은 대략적인 값 (실시간 환율 연동 필요시 별도 구현)
 */
export const EXCHANGE_RATES: Record<string, number> = {
  KRW: 1,
  JPY: 0.11,      // 1원 ≈ 0.11엔 (1엔 ≈ 9원)
  USD: 0.00075,   // 1원 ≈ 0.00075달러 (1달러 ≈ 1330원)
  EUR: 0.00069,   // 1원 ≈ 0.00069유로 (1유로 ≈ 1450원)
  GBP: 0.00059,   // 1원 ≈ 0.00059파운드 (1파운드 ≈ 1700원)
  CNY: 0.0054,    // 1원 ≈ 0.0054위안 (1위안 ≈ 185원)
  TWD: 0.024,     // 1원 ≈ 0.024대만달러 (1대만달러 ≈ 42원)
  HKD: 0.0058,    // 1원 ≈ 0.0058홍콩달러 (1홍콩달러 ≈ 170원)
  THB: 0.026,     // 1원 ≈ 0.026바트 (1바트 ≈ 38원)
  VND: 18.8,      // 1원 ≈ 18.8동 (1000동 ≈ 53원)
  SGD: 0.001,     // 1원 ≈ 0.001싱달 (1싱달 ≈ 1000원)
  IDR: 11.8,      // 1원 ≈ 11.8루피아 (1000루피아 ≈ 85원)
  PHP: 0.042,     // 1원 ≈ 0.042페소 (1페소 ≈ 24원)
  MYR: 0.0033,    // 1원 ≈ 0.0033링깃 (1링깃 ≈ 300원)
  MOP: 0.006,     // 1원 ≈ 0.006파타카
  CZK: 0.017,     // 1원 ≈ 0.017코루나
  CHF: 0.00066,   // 1원 ≈ 0.00066프랑
  MXN: 0.013,     // 1원 ≈ 0.013페소
};

/**
 * 원화 금액을 해당 화폐로 변환
 */
export function convertFromKRW(amountInKRW: number, currency: CurrencyInfo): number {
  const rate = EXCHANGE_RATES[currency.code] ?? 1;
  return Math.round(amountInKRW * rate * 100) / 100;
}

/**
 * 해당 화폐 금액을 원화로 변환
 * @param amount 외화 금액
 * @param currencyCode 화폐 코드
 * @param exchangeRates 통화별 환율 배열 (1 외화 = X원)
 */
export function convertToKRW(amount: number, currencyCode: string, exchangeRates?: ExchangeRateEntry[] | null): number {
  if (currencyCode === 'KRW') return amount;

  // 해당 통화의 커스텀 환율 조회
  const customRate = exchangeRates?.find(r => r.currencyCode === currencyCode)?.rate;
  if (customRate != null && customRate > 0) {
    return Math.round(amount * customRate);
  }

  // 기본 환율 사용
  const rate = EXCHANGE_RATES[currencyCode];
  if (!rate || rate === 0) return amount;
  return Math.round(amount / rate);
}

/**
 * 원화 금액을 변환하여 포맷팅
 */
export function formatConvertedAmount(amountInKRW: number, currency: CurrencyInfo): string {
  if (currency.code === 'KRW') {
    return new Intl.NumberFormat('ko-KR').format(amountInKRW) + '원';
  }

  const converted = convertFromKRW(amountInKRW, currency);

  // 정수로 표시할지 소수점으로 표시할지 결정
  const isWholeNumber = converted % 1 === 0;
  const formatted = new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(converted);

  return `${formatted}${currency.name}`;
}


/**
 * 화폐 코드에 따른 이름 반환
 */
export function getCurrencyName(code: CurrencyCode): string {
  return CurrencyCodeLabel[code] ?? code;
}

/**
 * 금액을 화폐 코드에 따라 포맷팅 (저장된 값 그대로 표시)
 */
export function formatByCurrencyCode(amount: number, currencyCode: CurrencyCode): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  return `${formatted}${getCurrencyName(currencyCode)}`;
}

/**
 * 통화별 환율 조회
 */
export function getExchangeRate(currencyCode: string, rates?: ExchangeRateEntry[] | null): number | null {
  return rates?.find(r => r.currencyCode === currencyCode)?.rate ?? null;
}

/**
 * 환율 설정/업데이트
 */
export function setExchangeRate(
  rates: ExchangeRateEntry[] | null,
  currencyCode: CurrencyCode,
  rate: number
): ExchangeRateEntry[] {
  const newRates = rates ? [...rates] : [];
  const index = newRates.findIndex(r => r.currencyCode === currencyCode);

  if (index >= 0) {
    newRates[index] = { currencyCode, rate };
  } else {
    newRates.push({ currencyCode, rate });
  }

  return newRates;
}

/**
 * 지출에서 사용된 통화 목록 (KRW 제외)
 */
export function getUsedCurrencies(expenses: { currency: CurrencyCode }[]): CurrencyCode[] {
  const currencies = new Set<CurrencyCode>(expenses.map(e => e.currency));
  return Array.from(currencies).filter(c => c !== 'KRW');
}

// 통화 코드 -> CurrencyInfo 매핑
const CURRENCY_INFO_MAP: Record<string, CurrencyInfo> = {
  KRW: { code: 'KRW', symbol: '원', name: '원', locale: 'ko-KR' },
  JPY: { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  USD: { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: '유로', locale: 'en-EU' },
  GBP: { code: 'GBP', symbol: '£', name: '파운드', locale: 'en-GB' },
  CNY: { code: 'CNY', symbol: '¥', name: '위안', locale: 'zh-CN' },
  TWD: { code: 'TWD', symbol: 'NT$', name: '대만 달러', locale: 'zh-TW' },
  HKD: { code: 'HKD', symbol: 'HK$', name: '홍콩 달러', locale: 'zh-HK' },
  THB: { code: 'THB', symbol: '฿', name: '바트', locale: 'th-TH' },
  VND: { code: 'VND', symbol: '₫', name: '동', locale: 'vi-VN' },
  SGD: { code: 'SGD', symbol: 'S$', name: '싱가포르 달러', locale: 'en-SG' },
  IDR: { code: 'IDR', symbol: 'Rp', name: '루피아', locale: 'id-ID' },
  PHP: { code: 'PHP', symbol: '₱', name: '페소', locale: 'fil-PH' },
  MYR: { code: 'MYR', symbol: 'RM', name: '링깃', locale: 'ms-MY' },
  MOP: { code: 'MOP', symbol: 'MOP$', name: '파타카', locale: 'zh-MO' },
  CZK: { code: 'CZK', symbol: 'Kč', name: '코루나', locale: 'cs-CZ' },
  CHF: { code: 'CHF', symbol: 'CHF', name: '프랑', locale: 'de-CH' },
  MXN: { code: 'MXN', symbol: 'MX$', name: '페소', locale: 'es-MX' },
};

/**
 * 통화 코드로 CurrencyInfo 조회
 */
export function getCurrencyInfoByCode(code: string): CurrencyInfo | null {
  return CURRENCY_INFO_MAP[code] ?? null;
}

/**
 * 기본 환율 조회 (1 외화 = X원)
 */
export function getDefaultExchangeRate(currencyCode: string): number {
  const rate = EXCHANGE_RATES[currencyCode];
  if (!rate || rate === 0) return 1;
  return Math.round(1 / rate);
}
