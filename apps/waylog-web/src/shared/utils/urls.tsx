
import type { ReactNode } from 'react'

const URL_REGEX = /https?:\/\/[^\s]+/g

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? []
}

export function renderTextWithLinks(text: string): ReactNode {
  const parts = text.split(URL_REGEX)
  const urls = text.match(URL_REGEX) ?? []

  if (urls.length === 0) return text

  const result: ReactNode[] = []
  parts.forEach((part, i) => {
    if (part) result.push(part)
    if (urls[i]) {
      result.push(
        <a
          key={i}
          href={urls[i]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ wordBreak: 'break-all' }}
        >
          {urls[i]}
        </a>
      )
    }
  })
  return result
}

export { queryParams, withQueryParams } from '@waylog/domains/utils'
