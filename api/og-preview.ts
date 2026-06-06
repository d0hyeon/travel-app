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
