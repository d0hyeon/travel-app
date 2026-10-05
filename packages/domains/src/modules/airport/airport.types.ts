export interface Airport {
  code: string
  nameKo: string
  nameEn: string
  cityKo: string
  /** IANA. 선택과 동시에 교통편의 타임존이 정해진다. */
  timezone: string
  /** 이름 정규화로 걸리지 않는 통칭. 김해공항 ↔ 부산처럼 어간이 다를 때만 쓴다. */
  aliases?: readonly string[]
}

/**
 * 공항 코드는 이제 DB(airports 테이블)가 소유해 컴파일타임에 전체 목록을
 * 알 수 없다. 예전엔 정적 배열에서 파생한 리터럴 유니온이었지만, 그 안전은
 * "DB에 없는 코드"를 막지 못했다(런타임에만 걸림) -- 실질 안전성은 같다.
 */
export type AirportCode = string
