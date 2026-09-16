import type { Airport } from './airport.types'

export const AIRPORTS = [
  { code: 'ICN', nameKo: '인천국제공항', nameEn: 'Incheon International Airport', cityKo: '서울', timezone: 'Asia/Seoul' },
  { code: 'GMP', nameKo: '김포국제공항', nameEn: 'Gimpo International Airport', cityKo: '서울', timezone: 'Asia/Seoul' },
  { code: 'PUS', nameKo: '김해국제공항', nameEn: 'Gimhae International Airport', cityKo: '부산', timezone: 'Asia/Seoul', aliases: ['부산'] },
  { code: 'CJU', nameKo: '제주국제공항', nameEn: 'Jeju International Airport', cityKo: '제주', timezone: 'Asia/Seoul' },
  { code: 'TAE', nameKo: '대구국제공항', nameEn: 'Daegu International Airport', cityKo: '대구', timezone: 'Asia/Seoul' },
  { code: 'KIX', nameKo: '간사이국제공항', nameEn: 'Kansai International Airport', cityKo: '오사카', timezone: 'Asia/Tokyo' },
  { code: 'NRT', nameKo: '나리타국제공항', nameEn: 'Narita International Airport', cityKo: '도쿄', timezone: 'Asia/Tokyo' },
  { code: 'HND', nameKo: '하네다공항', nameEn: 'Haneda Airport', cityKo: '도쿄', timezone: 'Asia/Tokyo' },
  { code: 'FUK', nameKo: '후쿠오카공항', nameEn: 'Fukuoka Airport', cityKo: '후쿠오카', timezone: 'Asia/Tokyo' },
  { code: 'CTS', nameKo: '신치토세공항', nameEn: 'New Chitose Airport', cityKo: '삿포로', timezone: 'Asia/Tokyo' },
  { code: 'OKA', nameKo: '나하공항', nameEn: 'Naha Airport', cityKo: '오키나와', timezone: 'Asia/Tokyo' },
  { code: 'TPE', nameKo: '타오위안국제공항', nameEn: 'Taoyuan International Airport', cityKo: '타이베이', timezone: 'Asia/Taipei' },
  { code: 'HKG', nameKo: '홍콩국제공항', nameEn: 'Hong Kong International Airport', cityKo: '홍콩', timezone: 'Asia/Hong_Kong' },
  { code: 'BKK', nameKo: '수완나품국제공항', nameEn: 'Suvarnabhumi Airport', cityKo: '방콕', timezone: 'Asia/Bangkok' },
  { code: 'DAD', nameKo: '다낭국제공항', nameEn: 'Da Nang International Airport', cityKo: '다낭', timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'SIN', nameKo: '창이국제공항', nameEn: 'Singapore Changi Airport', cityKo: '싱가포르', timezone: 'Asia/Singapore' },
  { code: 'PVG', nameKo: '푸둥국제공항', nameEn: 'Shanghai Pudong International Airport', cityKo: '상하이', timezone: 'Asia/Shanghai' },
  { code: 'PEK', nameKo: '베이징서우두국제공항', nameEn: 'Beijing Capital International Airport', cityKo: '베이징', timezone: 'Asia/Shanghai' },
  { code: 'LAX', nameKo: '로스앤젤레스국제공항', nameEn: 'Los Angeles International Airport', cityKo: '로스앤젤레스', timezone: 'America/Los_Angeles' },
  { code: 'JFK', nameKo: '존에프케네디국제공항', nameEn: 'John F. Kennedy International Airport', cityKo: '뉴욕', timezone: 'America/New_York' },
  { code: 'CDG', nameKo: '샤를드골국제공항', nameEn: 'Charles de Gaulle Airport', cityKo: '파리', timezone: 'Europe/Paris' },
  { code: 'LHR', nameKo: '히스로공항', nameEn: 'Heathrow Airport', cityKo: '런던', timezone: 'Europe/London' },
  { code: 'FRA', nameKo: '프랑크푸르트공항', nameEn: 'Frankfurt Airport', cityKo: '프랑크푸르트', timezone: 'Europe/Berlin' },
  { code: 'SYD', nameKo: '시드니국제공항', nameEn: 'Sydney Airport', cityKo: '시드니', timezone: 'Australia/Sydney' },
  { code: 'GUM', nameKo: '괌국제공항', nameEn: 'Antonio B. Won Pat International Airport', cityKo: '괌', timezone: 'Pacific/Guam' },
] as const satisfies readonly Airport[]

export type AirportCode = (typeof AIRPORTS)[number]['code']
