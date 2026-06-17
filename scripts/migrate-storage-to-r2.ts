import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_BASE_URL = process.env.VITE_R2_PUBLIC_BASE_URL!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function downloadFromSupabase(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('photos')
    .download(storagePath)
  if (error) throw new Error(`Supabase download failed: ${storagePath} - ${error.message}`)
  return Buffer.from(await data.arrayBuffer())
}

async function uploadToR2(storagePath: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storagePath,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
}

async function countR2Objects(): Promise<number> {
  let count = 0
  let continuationToken: string | undefined

  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
    }))
    count += res.Contents?.length ?? 0
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return count
}

async function migrate() {
  console.log('📦 DB에서 photos 목록 조회 중...')
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, storage_path, url')

  if (error) throw error
  console.log(`총 ${photos.length}개 사진 발견`)

  let success = 0
  let failed = 0
  const failedPaths: string[] = []

  for (const photo of photos) {
    try {
      process.stdout.write(`[${success + failed + 1}/${photos.length}] ${photo.storage_path} ... `)

      const ext = photo.storage_path.split('.').pop()?.toLowerCase()
      const contentTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        heic: 'image/heic',
      }
      const contentType = contentTypeMap[ext ?? ''] ?? 'image/jpeg'

      const buffer = await downloadFromSupabase(photo.storage_path)
      await uploadToR2(photo.storage_path, buffer, contentType)

      const newUrl = `${R2_PUBLIC_BASE_URL}/${photo.storage_path}`
      const { error: updateError } = await supabase
        .from('photos')
        .update({ url: newUrl })
        .eq('id', photo.id)

      if (updateError) throw updateError

      console.log('✅')
      success++
    } catch (err) {
      console.log('❌', err)
      failed++
      failedPaths.push(photo.storage_path)
    }
  }

  console.log('\n=== 마이그레이션 결과 ===')
  console.log(`성공: ${success}`)
  console.log(`실패: ${failed}`)

  if (failedPaths.length > 0) {
    console.log('\n실패한 파일:')
    failedPaths.forEach(p => console.log(' -', p))
  }

  console.log('\n🔍 R2 파일 수 검증 중...')
  const r2Count = await countR2Objects()
  console.log(`DB photos: ${photos.length}, R2 objects: ${r2Count}`)

  if (r2Count >= success) {
    console.log('✅ 검증 통과')
  } else {
    console.log('⚠️  R2 파일 수가 예상보다 적습니다. 수동 확인이 필요합니다.')
  }
}

migrate().catch(console.error)
