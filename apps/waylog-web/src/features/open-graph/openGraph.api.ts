import { createHttpClient } from "@waylog/domains/api";

export interface OgPreviewData {
  title: string | null
  description: string | null
  image: string | null
  url: string
  siteName: string | null
}


const internalApi = createHttpClient();

export function readOpenGraph(url: string): Promise<OgPreviewData> {
  return internalApi.get<OgPreviewData>(readOpenGraph.path, {
    params: { url: encodeURIComponent(url) }
  })
}
readOpenGraph.path = '/api/og-preview';