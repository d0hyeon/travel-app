// 항목 하나가 티켓 행 하나다. 이미지마다 소유자를 따로 고른다.
export interface TransportTicketDraft {
  uri: string
  memberId?: string
}
