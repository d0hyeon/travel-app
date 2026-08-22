import type { ReactNode } from 'react'
import { Linking } from 'react-native'
import { Text } from 'react-native'
import { palette } from '../config/tokens'

// 웹 shared/utils/urls 와 같은 시그니처를 유지한다.
// extractUrls 는 순수 함수라 웹과 같고, 링크 렌더만 RN 으로 바꾼다.
const URL_REGEX = /https?:\/\/[^\s]+/g

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? []
}

export function renderTextWithLinks(text: string): ReactNode {
  const urls = text.match(URL_REGEX) ?? []
  if (urls.length === 0) return text

  const parts = text.split(URL_REGEX)

  const result: ReactNode[] = []
  parts.forEach((part, index) => {
    if (part) result.push(part)
    if (urls[index]) {
      result.push(
        <Text
          key={index}
          style={{ color: palette.primary, textDecorationLine: 'underline' }}
          onPress={() => void Linking.openURL(urls[index])}
        >
          {urls[index]}
        </Text>,
      )
    }
  })
  return result
}

export { queryParams, withQueryParams } from '@waylog/utility'
