/**
 * 목적지별 화폐 단위 매핑
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const KRW: CurrencyInfo = { code: 'KRW', symbol: '원', name: '원', locale: 'ko-KR' };

// 목적지 -> 화폐 매핑
const DESTINATION_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // 일본
  '도쿄': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  '오사카': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  '교토': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  '후쿠오카': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  '삿포로': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },
  '오키나와': { code: 'JPY', symbol: '¥', name: '엔', locale: 'ja-JP' },

  // 동남아
  '방콕': { code: 'THB', symbol: '฿', name: '바트', locale: 'th-TH' },
  '푸켓': { code: 'THB', symbol: '฿', name: '바트', locale: 'th-TH' },
  '싱가포르': { code: 'SGD', symbol: 'S$', name: '싱가포르 달러', locale: 'en-SG' },
  '베트남 다낭': { code: 'VND', symbol: '₫', name: '동', locale: 'vi-VN' },
  '베트남 호치민': { code: 'VND', symbol: '₫', name: '동', locale: 'vi-VN' },
  '베트남 하노이': { code: 'VND', symbol: '₫', name: '동', locale: 'vi-VN' },
  '발리': { code: 'IDR', symbol: 'Rp', name: '루피아', locale: 'id-ID' },
  '세부': { code: 'PHP', symbol: '₱', name: '페소', locale: 'fil-PH' },
  '코타키나발루': { code: 'MYR', symbol: 'RM', name: '링깃', locale: 'ms-MY' },

  // 중화권
  '홍콩': { code: 'HKD', symbol: 'HK$', name: '홍콩 달러', locale: 'zh-HK' },
  '마카오': { code: 'MOP', symbol: 'MOP$', name: '파타카', locale: 'zh-MO' },
  '타이베이': { code: 'TWD', symbol: 'NT$', name: '대만 달러', locale: 'zh-TW' },
  '상하이': { code: 'CNY', symbol: '¥', name: '위안', locale: 'zh-CN' },

  // 유럽
  '파리': { code: 'EUR', symbol: '€', name: '유로', locale: 'fr-FR' },
  '로마': { code: 'EUR', symbol: '€', name: '유로', locale: 'it-IT' },
  '바르셀로나': { code: 'EUR', symbol: '€', name: '유로', locale: 'es-ES' },
  '암스테르담': { code: 'EUR', symbol: '€', name: '유로', locale: 'nl-NL' },
  '런던': { code: 'GBP', symbol: '£', name: '파운드', locale: 'en-GB' },
  '프라하': { code: 'CZK', symbol: 'Kč', name: '코루나', locale: 'cs-CZ' },
  '스위스 취리히': { code: 'CHF', symbol: 'CHF', name: '프랑', locale: 'de-CH' },

  // 미주
  '뉴욕': { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  '로스앤젤레스': { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  '하와이 호놀룰루': { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  '샌프란시스코': { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  '라스베이거스': { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' },
  '칸쿤': { code: 'MXN', symbol: 'MX$', name: '페소', locale: 'es-MX' },
};

/**
 * 목적지에 해당하는 화폐 정보 반환
 * 매핑되지 않은 목적지는 USD 반환
 */
export function getCurrencyByDestination(destination: string): CurrencyInfo {
  return DESTINATION_CURRENCY_MAP[destination] ?? { code: 'USD', symbol: '$', name: '달러', locale: 'en-US' };
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
 * @param exchangeRate 수동 환율 (1 외화 = X원). 제공되면 이 값을 사용
 */
export function convertToKRW(amount: number, currencyCode: string, exchangeRate?: number | null): number {
  if (currencyCode === 'KRW') return amount;

  // 수동 환율이 있으면 사용
  if (exchangeRate != null && exchangeRate > 0) {
    return Math.round(amount * exchangeRate);
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

// 화폐 코드 -> 이름 매핑
const CURRENCY_NAMES: Record<string, string> = {
  KRW: '원',
  JPY: '엔',
  USD: '달러',
  EUR: '유로',
  GBP: '파운드',
  CNY: '위안',
  TWD: '대만 달러',
  HKD: '홍콩 달러',
  THB: '바트',
  VND: '동',
  SGD: '싱가포르 달러',
  IDR: '루피아',
  PHP: '페소',
  MYR: '링깃',
  MOP: '파타카',
  CZK: '코루나',
  CHF: '프랑',
  MXN: '페소',
};

/**
 * 화폐 코드에 따른 이름 반환
 */
export function getCurrencyName(code: string): string {
  return CURRENCY_NAMES[code] ?? code;
}

/**
 * 금액을 화폐 코드에 따라 포맷팅 (저장된 값 그대로 표시)
 */
export function formatByCurrencyCode(amount: number, currencyCode: string): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  return `${formatted}${getCurrencyName(currencyCode)}`;
}
