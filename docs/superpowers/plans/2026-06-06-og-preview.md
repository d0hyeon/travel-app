# OG Preview Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 여행 채팅과 메모에서 URL을 감지해 클릭 가능한 링크로 렌더링하고, 첫 번째 URL의 OG 메타데이터 카드를 표시한다.

**Architecture:** Vercel Edge Function(`api/og-preview.ts`)이 대상 URL의 HTML을 fetch해 OG 메타데이터를 파싱하고 JSON으로 반환한다. 응답에 `Cache-Control: public, s-maxage=86400`을 설정해 Vercel CDN이 1일간 캐싱한다. 클라이언트는 React Query(`staleTime: Infinity`)로 세션 내 재호출을 방지한다.

**Tech Stack:** Vercel Edge Function, TanStack React Query v5, MUI v7, Vitest v3

---

## File Map

| 파일 | 역할 | 신규/수정 |
|------|------|-----------|
| `api/og-preview.ts` | OG 메타데이터 fetch & 파싱 Edge Function | 신규 |
| `src/shared/utils/urls.ts` | URL 추출 + 텍스트→링크 렌더링 유틸 | 신규 |
| `src/shared/utils/__tests__/urls.test.ts` | urls.ts 단위 테스트 | 신규 |
| `src/shared/hooks/useOgPreview.ts` | React Query로 Edge Function 호출 훅 | 신규 |
| `src/shared/components/OgPreviewCard.tsx` | 적응형 OG 카드 컴포넌트 | 신규 |
| `src/features/trip/trip-chat/trip-chat-pannel/TripChatMessage.tsx` | URL 링크 렌더링 + OG 카드 추가 | 수정 |
| `src/features/trip/trip-memo/TripMemoDetailPage.tsx` | URL 링크 렌더링 + OG 카드 추가 | 수정 |

---

## Task 1: URL 파싱 유틸 + 테스트

**Files:**
- Create: `src/shared/utils/urls.ts`
- Create: `src/shared/utils/__tests__/urls.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```ts
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
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

```bash
yarn test src/shared/utils/__tests__/urls.test.ts
```
Expected: FAIL — `Cannot find module '../urls'`

- [ ] **Step 3: urls.ts 구현**

```ts
// src/shared/utils/urls.ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
yarn test src/shared/utils/__tests__/urls.test.ts
```
Expected: PASS (모든 테스트 통과)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/utils/urls.ts src/shared/utils/__tests__/urls.test.ts
git commit -m "feat: URL 추출 및 링크 렌더링 유틸 추가"
```

---

## Task 2: Vercel Edge Function

**Files:**
- Create: `api/og-preview.ts`

- [ ] **Step 1: api 디렉토리 생성 및 파일 작성**

```ts
// api/og-preview.ts
export const config = { runtime: 'edge' }

interface OgData {
  title: string | null
  description: string | null
  image: string | null
  url: string
  siteName: string | null
}

function parseMeta(html: string, property: string): string | null {
  const ogMatch = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  ).exec(html)
  if (ogMatch) return ogMatch[1]

  const nameMatch = new RegExp(
    `<meta[^>]+name=["']${property.replace('og:', '')}["'][^>]+content=["']([^"']+)["']`,
    'i'
  ).exec(html)
  return nameMatch ? nameMatch[1] : null
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'url parameter required' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: 'invalid url' }, { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return Response.json({ error: 'only http/https allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TravelAppBot/1.0' },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return Response.json({ error: 'fetch failed' }, { status: 502 })
    }

    const html = await res.text()

    const data: OgData = {
      title: parseMeta(html, 'og:title') ?? parseMeta(html, 'title'),
      description: parseMeta(html, 'og:description') ?? parseMeta(html, 'description'),
      image: parseMeta(html, 'og:image'),
      url: parseMeta(html, 'og:url') ?? url,
      siteName: parseMeta(html, 'og:site_name'),
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: title 파싱 fallback 확인 — `<title>` 태그도 파싱되도록 parseMeta 보완**

`parseMeta`로 `og:title`이 없을 때 `<title>` 태그에서 파싱하도록 아래 코드로 교체:

```ts
function parseMeta(html: string, property: string): string | null {
  // og: property 속성
  const ogMatch = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  ).exec(html)
  if (ogMatch) return ogMatch[1]

  // content 앞에 property 오는 경우
  const ogMatch2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    'i'
  ).exec(html)
  if (ogMatch2) return ogMatch2[1]

  // name= 속성 (description, etc.)
  const nameKey = property.replace('og:', '')
  const nameMatch = new RegExp(
    `<meta[^>]+name=["']${nameKey}["'][^>]+content=["']([^"']+)["']`,
    'i'
  ).exec(html)
  if (nameMatch) return nameMatch[1]

  // <title> 태그 (title 전용)
  if (property === 'title' || property === 'og:title') {
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html)
    if (titleMatch) return titleMatch[1].trim()
  }

  return null
}
```

- [ ] **Step 3: 커밋**

```bash
git add api/og-preview.ts
git commit -m "feat: OG 메타데이터 파싱 Vercel Edge Function 추가"
```

---

## Task 3: useOgPreview 훅

**Files:**
- Create: `src/shared/hooks/useOgPreview.ts`

- [ ] **Step 1: 훅 작성**

```ts
// src/shared/hooks/useOgPreview.ts
import { useQuery } from '@tanstack/react-query'

export interface OgPreviewData {
  title: string | null
  description: string | null
  image: string | null
  url: string
  siteName: string | null
}

async function fetchOgPreview(url: string): Promise<OgPreviewData> {
  const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('og fetch failed')
  return res.json()
}

export function useOgPreview(url: string | null) {
  return useQuery({
    queryKey: ['og-preview', url],
    queryFn: () => fetchOgPreview(url!),
    enabled: !!url,
    staleTime: Infinity,
    retry: false,
    throwOnError: false,
  })
}
```

- [ ] **Step 2: 타입 체크**

```bash
yarn ts-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/shared/hooks/useOgPreview.ts
git commit -m "feat: useOgPreview React Query 훅 추가"
```

---

## Task 4: OgPreviewCard 컴포넌트

**Files:**
- Create: `src/shared/components/OgPreviewCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/shared/components/OgPreviewCard.tsx
import { Box, Card, CardActionArea, Skeleton, Stack, Typography } from '@mui/material'
import type { OgPreviewData } from '~shared/hooks/useOgPreview'

interface Props {
  data: OgPreviewData | undefined
  isLoading: boolean
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function OgPreviewCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ mt: 1 }}>
        <Stack direction="row" gap={1} p={1.5}>
          <Skeleton variant="rectangular" width={80} height={60} sx={{ borderRadius: 1, flexShrink: 0 }} />
          <Stack gap={0.5} flex={1}>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Stack>
        </Stack>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card variant="outlined" sx={{ mt: 1 }}>
      <CardActionArea
        component="a"
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {data.image ? (
          <Stack direction="row" gap={1.5} p={1.5}>
            <Box
              component="img"
              src={data.image}
              alt={data.title ?? ''}
              sx={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: 1,
                flexShrink: 0,
                bgcolor: 'grey.100',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <Stack gap={0.25} flex={1} minWidth={0}>
              {data.title && (
                <Typography variant="body2" fontWeight={600} noWrap>
                  {data.title}
                </Typography>
              )}
              {data.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {data.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                {getDomain(data.url)}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={0.25} p={1.5}>
            {data.title && (
              <Typography variant="body2" fontWeight={600} noWrap>
                {data.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              {getDomain(data.url)}
            </Typography>
          </Stack>
        )}
      </CardActionArea>
    </Card>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
yarn ts-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/shared/components/OgPreviewCard.tsx
git commit -m "feat: 적응형 OG 미리보기 카드 컴포넌트 추가"
```

---

## Task 5: TripChatMessage에 적용

**Files:**
- Modify: `src/features/trip/trip-chat/trip-chat-pannel/TripChatMessage.tsx`

현재 파일:
```tsx
<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
  {message.content}
</Typography>
```

- [ ] **Step 1: TripChatMessage.tsx 수정**

```tsx
// src/features/trip/trip-chat/trip-chat-pannel/TripChatMessage.tsx
import { useAuth } from "~features/auth/useAuth"
import type { ChatMessage } from "../tripChat.types"
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { extractUrls, renderTextWithLinks } from "~shared/utils/urls";
import { useOgPreview } from "~shared/hooks/useOgPreview";
import { OgPreviewCard } from "~shared/components/OgPreviewCard";

interface Props {
  message: ChatMessage
}

export function TripChatMessage({ message }: Props) {
  const { data: { id } } = useAuth();
  const isMe = message.userId === id;
  const firstUrl = extractUrls(message.content)[0] ?? null;
  const { data: ogData, isLoading: ogLoading } = useOgPreview(firstUrl);

  return (
    <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" gap={1}>
      {!isMe && (
        <Avatar
          src={message.profile?.profileUrl ?? undefined}
          sx={{ width: 28, height: 28, fontSize: 12 }}
        >
          {message.profile?.name?.[0] ?? '?'}
        </Avatar>
      )}
      <Stack alignItems={isMe ? 'flex-end' : 'flex-start'} maxWidth="70%">
        {!isMe && message.profile && (
          <Typography variant="caption" color="text.secondary" mb={0.25}>
            {message.profile.name}
          </Typography>
        )}
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            bgcolor: isMe ? 'primary.main' : 'grey.100',
            color: isMe ? 'primary.contrastText' : 'text.primary',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderTextWithLinks(message.content)}
          </Typography>
        </Box>
        {firstUrl && (
          <Box width="100%">
            <OgPreviewCard data={ogData} isLoading={ogLoading} />
          </Box>
        )}
        <Typography variant="caption" color="text.disabled" mt={0.25}>
          {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Stack>
    </Stack>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
yarn ts-check
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-chat/trip-chat-pannel/TripChatMessage.tsx
git commit -m "feat: 채팅 메시지에 URL 링크 및 OG 카드 표시"
```

---

## Task 6: TripMemoDetailPage에 적용

**Files:**
- Modify: `src/features/trip/trip-memo/TripMemoDetailPage.tsx`

현재 본문 렌더링:
```tsx
<Typography
  variant="body1"
  color={memo.title ? 'text.secondary' : 'text.primary'}
  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
>
  {memo.content}
</Typography>
```

- [ ] **Step 1: TripMemoDetailPage.tsx 수정 — import 추가**

파일 상단 import에 추가:
```tsx
import { extractUrls, renderTextWithLinks } from '~shared/utils/urls';
import { useOgPreview } from '~shared/hooks/useOgPreview';
import { OgPreviewCard } from '~shared/components/OgPreviewCard';
```

- [ ] **Step 2: Resolved 컴포넌트 내 firstUrl 추출 및 훅 호출 추가**

`memo` 변수 선언 바로 아래에 추가:
```tsx
const firstUrl = extractUrls(memo.content)[0] ?? null;
const { data: ogData, isLoading: ogLoading } = useOgPreview(firstUrl);
```

- [ ] **Step 3: 본문 Typography + OgPreviewCard 교체**

기존:
```tsx
<Typography
  variant="body1"
  color={memo.title ? 'text.secondary' : 'text.primary'}
  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
>
  {memo.content}
</Typography>
```

교체:
```tsx
<Typography
  variant="body1"
  color={memo.title ? 'text.secondary' : 'text.primary'}
  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
>
  {renderTextWithLinks(memo.content)}
</Typography>
{firstUrl && (
  <OgPreviewCard data={ogData} isLoading={ogLoading} />
)}
```

- [ ] **Step 4: 타입 체크**

```bash
yarn ts-check
```
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/trip/trip-memo/TripMemoDetailPage.tsx
git commit -m "feat: 메모 상세에 URL 링크 및 OG 카드 표시"
```

---

## Task 7: 전체 테스트

- [ ] **Step 1: 단위 테스트 전체 실행**

```bash
yarn test
```
Expected: PASS (urls.test.ts 포함 전체 통과)

- [ ] **Step 2: 타입 체크 전체 실행**

```bash
yarn ts-check
```
Expected: 오류 없음
