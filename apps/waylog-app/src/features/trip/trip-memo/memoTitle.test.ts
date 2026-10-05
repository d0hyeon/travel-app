import { describe, expect, it } from 'vitest'
import { getMemoDisplayTitle } from './memoTitle'

describe('getMemoDisplayTitle', () => {
  it('uses a non-empty memo title as the row title', () => {
    expect(getMemoDisplayTitle('숙소 체크인 정보', '체크인 시간 15:00')).toBe('숙소 체크인 정보')
  })

  it('uses memo content when the title is empty', () => {
    expect(getMemoDisplayTitle('', '도쿄 역 근처 라멘 맛집 찾아보기')).toBe('도쿄 역 근처 라멘 맛집 찾아보기')
  })

  it('keeps the full content when no preview limit is requested', () => {
    const content = '긴 메모 내용은 고정 메모 행에서 잘리지 않아야 해요. 추가 내용도 그대로 보여야 합니다.'
    expect(getMemoDisplayTitle('', content)).toBe(content)
  })

  it('keeps a memo row labeled when both title and content are blank', () => {
    expect(getMemoDisplayTitle('   ', '   ')).toBe('메모')
  })
})
