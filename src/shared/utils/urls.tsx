
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

export const queryParams = {
  serialize: (value: Record<string, unknown>) => {
    const stringfy = Object.entries(value).reduce((acc, [key, value]) => {
      if (value == null) return acc;
      if (typeof value === 'string' && URL.canParse(value)) {
        return `${acc}&${key}=${encodeURI(value)}`;
      }
      if (Array.isArray(value)) {
        return value.reduce((acc, item) => `${acc}&${key}=${item}`, acc);
      }

      return `${acc}&${key}=${String(value)}`;
    }, '');

    if (stringfy === '') return stringfy;
    return `${stringfy.slice(1)}`;
  },
  parse: (value: string) => {
    return value.split('&').reduce<Record<string, string | string[]>>((acc, qs) => {
      const [key, value] = qs.split('=');

      if (acc[key] != null) {
        if (!Array.isArray(acc[key])) {
          acc[key] = new Array(acc[key]);
        }
        acc[key].push(value);
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {})
  }
}

export function withQueryParams(path: string, params: Record<string, unknown> = {}) {
  const queryString = queryParams.serialize(params);

  if (path.includes('?')) {
    return `${path}&${queryString}`;
  }
  return `${path}?${queryString}`;
}