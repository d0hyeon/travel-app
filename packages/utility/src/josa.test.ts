import { describe, expect, it } from 'vitest'
import { josa } from './josa'

describe('josa', () => {
  it('받침이 있는 한글 뒤에는 이·으로를 붙인다', () => {
    expect(josa('출국장 3 동쪽', '이/가')).toBe('출국장 3 동쪽이')
    expect(josa('출국장 3 동쪽', '으로/로')).toBe('출국장 3 동쪽으로')
  })

  it('받침이 없는 한글 뒤에는 가·로를 붙인다', () => {
    expect(josa('나리타', '이/가')).toBe('나리타가')
    expect(josa('나리타', '으로/로')).toBe('나리타로')
  })

  it('ㄹ 받침 뒤에는 으로가 아니라 로를 붙인다', () => {
    expect(josa('서울', '으로/로')).toBe('서울로')
  })

  it('영문으로 끝나면 영문 소리로 고른다', () => {
    expect(josa('출국장 1A', '이/가')).toBe('출국장 1A가')
  })

  it('숫자로 끝나면 숫자를 읽은 소리로 고른다', () => {
    expect(josa('220', '이/가')).toBe('220이')
    expect(josa('220', '으로/로')).toBe('220으로')
    expect(josa('11', '이/가')).toBe('11이')
    expect(josa('107', '으로/로')).toBe('107로')
    expect(josa('104', '이/가')).toBe('104가')
  })

  it('문자 뒤에 붙은 숫자는 숫자만 읽는다', () => {
    expect(josa('A12', '이/가')).toBe('A12가')
    expect(josa('T2', '으로/로')).toBe('T2로')
  })
})

describe('josa.pick', () => {
  it('조사만 돌려준다', () => {
    expect(josa.pick('241', '이/가')).toBe('이')
    expect(josa.pick('241', '으로/로')).toBe('로')
  })
})
