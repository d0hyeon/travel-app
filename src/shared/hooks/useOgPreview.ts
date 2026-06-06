import { useQuery } from '@tanstack/react-query'
import { useSuspenseQuery } from './extends/useSuspenseQuery'

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

export function useOgPreview(url: string) {
  return useSuspenseQuery({
    queryKey: ['og-preview', url],
    queryFn: () => fetchOgPreview(url!),
    staleTime: Infinity,
    retry: false,
  })
}
