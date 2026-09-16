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
