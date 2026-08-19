// src/shared/utils/__tests__/urls.test.ts
import { describe, it, expect } from 'vitest'
import { extractUrls, renderTextWithLinks } from '../urls'

describe('extractUrls', () => {
  it('빈 문자열이면 빈 배열 반환', () => {
    expect(extractUrls('')).toEqual([])
  })

  it('URL이 없으면 빈 배열 반환', () => {
    expect(extractUrls('안녕하세요')).toEqual([])
  })

  it('단독 URL 추출', () => {
    expect(extractUrls('https://example.com')).toEqual(['https://example.com'])
  })

  it('텍스트 중간 URL 추출', () => {
    expect(extractUrls('링크: https://example.com 확인해봐')).toEqual(['https://example.com'])
  })

  it('여러 URL 모두 추출', () => {
    expect(extractUrls('https://a.com 그리고 https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ])
  })

  it('http URL도 추출', () => {
    expect(extractUrls('http://example.com')).toEqual(['http://example.com'])
  })
})

describe('renderTextWithLinks', () => {
  it('URL 없으면 문자열 그대로 반환', () => {
    const result = renderTextWithLinks('그냥 텍스트')
    expect(result).toBe('그냥 텍스트')
  })

  it('URL이 있으면 배열 반환', () => {
    const result = renderTextWithLinks('보기: https://example.com 끝')
    expect(Array.isArray(result)).toBe(true)
  })
})
