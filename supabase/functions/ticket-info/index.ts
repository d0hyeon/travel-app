import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { extractTicketInfo } from './extract.ts'

const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function detectText(image: string): Promise<string> {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: image } },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    },
  )

  // 403 은 API 미활성화·키 제한·결제 미설정이 모두 같은 코드로 와서
  // 상태 코드만으로는 어느 것인지 알 수 없다. Google 이 준 사유를 남긴다.
  if (!res.ok) throw new Error(`Vision ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const [result] = data.responses ?? []
  if (result?.error != null) throw new Error(result.error.message)

  return result?.fullTextAnnotation?.text ?? ''
}

// 추출은 읽기다. 티켓 행을 갱신하지 않아 행이 생기기 전에도 부를 수 있다.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { image } = await req.json().catch(() => ({ image: undefined }))
  if (typeof image !== 'string' || image.length === 0) {
    return json({ error: 'image 가 필요합니다.' }, 400)
  }

  try {
    return json(extractTicketInfo(await detectText(image)))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '추출에 실패했습니다.' }, 502)
  }
})
