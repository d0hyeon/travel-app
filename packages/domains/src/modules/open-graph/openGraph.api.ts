import { supabase } from "../../client";

export interface OgPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
  siteName: string | null;
}

/**
 * og-preview Edge Function 을 호출한다.
 *
 * 웹은 /api/og-preview 프록시를 거쳤지만 앱에는 그 서버가 없다.
 * 양쪽 다 같은 Edge Function 을 부르므로 supabase 클라이언트로 통일한다.
 */
export async function readOpenGraph(url: string): Promise<OgPreviewData> {
  const { data, error } = await supabase.functions.invoke<OgPreviewData>(
    `${readOpenGraph.path}?url=${encodeURIComponent(url)}`,
    { method: "GET" },
  );

  if (error) throw error;
  if (data == null) throw new Error("미리보기를 불러오지 못했습니다.");

  return data;
}
readOpenGraph.path = "og-preview";
