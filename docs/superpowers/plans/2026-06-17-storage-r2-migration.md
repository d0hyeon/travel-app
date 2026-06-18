# Supabase Storage → Cloudflare R2 마이그레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Storage의 사진 파일(471개)을 Cloudflare R2로 이전하고, 신규 업로드/삭제도 R2를 사용하도록 앱 코드를 교체한다.

**Architecture:** 마이그레이션 스크립트(Node.js/tsx)로 Supabase Storage → R2 파일 복사 및 DB url 컬럼 일괄 업데이트를 수행한다. 클라이언트 업로드는 Supabase Edge Function이 발급한 R2 presigned PUT URL을 사용하여 R2에 직접 업로드한다. 이미지는 `images.waylog.me`(Cloudflare R2 커스텀 도메인 + CDN)를 통해 서빙된다.

**Tech Stack:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Supabase Edge Function (Deno), tsx (스크립트 실행)

## Global Constraints

- R2 public URL 베이스: `https://images.waylog.me`
- R2 버킷명: `photos`
- DB 스키마 변경 없음 — `url` 컬럼 값만 교체
- `photo.api.ts` 한 파일만 앱 코드 수정
- Edge Function은 인증된 사용자에게만 presigned URL 발급
- 기존 Supabase Storage 버킷은 검증 완료 후 삭제

---

## File Map

| 파일 | 역할 | 작업 |
|------|------|------|
| `scripts/migrate-storage-to-r2.ts` | 일회성 마이그레이션 스크립트 | 신규 생성 |
| `supabase/functions/r2-upload-url/index.ts` | presigned PUT URL 발급 Edge Function | 신규 생성 |
| `supabase/functions/r2-delete/index.ts` | R2 파일 삭제 Edge Function | 신규 생성 |
| `src/features/photo/photo.api.ts` | 업로드/삭제 로직 R2로 교체 | 수정 |
| `.env.local` | R2 환경변수 추가 | 수정 |

---

## Task 1: R2 버킷 설정 및 환경변수 준비

**Files:**
- Modify: `.env.local`

**Interfaces:**
- Produces: 환경변수 `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `VITE_R2_PUBLIC_BASE_URL`

- [ ] **Step 1: Cloudflare 대시보드에서 R2 버킷 생성**

  Cloudflare 대시보드 → R2 → "Create bucket" → 이름: `photos`

- [ ] **Step 2: R2 커스텀 도메인 연결**

  버킷 설정 → "Custom Domains" → `images.waylog.me` 추가
  (Cloudflare DNS에 CNAME 자동 생성됨)

- [ ] **Step 3: R2 API 토큰 발급**

  Cloudflare 대시보드 → R2 → "Manage R2 API Tokens" → "Create API Token"
  - 권한: Object Read & Write
  - 버킷: `photos`만 선택
  - Account ID는 대시보드 우측 사이드바에서 확인

- [ ] **Step 4: .env.local에 환경변수 추가**

  ```
  R2_ACCOUNT_ID=your_account_id
  R2_ACCESS_KEY_ID=your_access_key_id
  R2_SECRET_ACCESS_KEY=your_secret_access_key
  R2_BUCKET_NAME=photos
  VITE_R2_PUBLIC_BASE_URL=https://images.waylog.me
  ```

- [ ] **Step 5: Vercel 환경변수 추가**

  Vercel 대시보드 → Settings → Environment Variables에 위 값들 추가
  (`VITE_R2_PUBLIC_BASE_URL`만 클라이언트 노출, 나머지는 Edge Function용)

- [ ] **Step 6: Supabase Edge Function 시크릿 추가**

  ```bash
  supabase secrets set R2_ACCOUNT_ID=your_account_id
  supabase secrets set R2_ACCESS_KEY_ID=your_access_key_id
  supabase secrets set R2_SECRET_ACCESS_KEY=your_secret_access_key
  supabase secrets set R2_BUCKET_NAME=photos
  supabase secrets set R2_PUBLIC_BASE_URL=https://images.waylog.me
  ```

- [ ] **Step 7: Commit**

  ```bash
  git commit --allow-empty -m "chore: R2 버킷 및 환경변수 설정 완료"
  ```

---

## Task 2: 패키지 설치 및 마이그레이션 스크립트 작성

**Files:**
- Create: `scripts/migrate-storage-to-r2.ts`

**Interfaces:**
- Consumes: `.env.local`의 R2 환경변수, Supabase `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Produces: R2에 파일 복사 완료, DB `photos.url` 컬럼 R2 URL로 업데이트 완료

- [ ] **Step 1: 패키지 설치**

  ```bash
  pnpm add -D @aws-sdk/client-s3 @aws-sdk/s3-request-presigner tsx dotenv
  ```

- [ ] **Step 2: scripts 디렉토리 생성 및 스크립트 작성**

  `scripts/migrate-storage-to-r2.ts` 전체 내용:

  ```typescript
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
  ```

- [ ] **Step 3: .env.local에 Supabase service role 키 추가**

  Supabase 대시보드 → Settings → API → `service_role` 키 복사

  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

- [ ] **Step 4: 스크립트 실행**

  ```bash
  pnpm tsx scripts/migrate-storage-to-r2.ts
  ```

  예상 출력:
  ```
  📦 DB에서 photos 목록 조회 중...
  총 471개 사진 발견
  [1/471] tripId/placeId/filename.webp ... ✅
  ...
  === 마이그레이션 결과 ===
  성공: 471
  실패: 0
  🔍 R2 파일 수 검증 중...
  DB photos: 471, R2 objects: 471
  ✅ 검증 통과
  ```

- [ ] **Step 5: 앱에서 이미지 로딩 수동 확인**

  브라우저에서 앱 열어 사진이 `images.waylog.me/...` URL로 로딩되는지 확인
  (Network 탭에서 이미지 URL 확인)

- [ ] **Step 6: Commit**

  ```bash
  git add scripts/migrate-storage-to-r2.ts package.json pnpm-lock.yaml
  git commit -m "chore: Supabase Storage → R2 마이그레이션 스크립트 실행 완료"
  ```

---

## Task 3: R2 presigned URL 발급 Edge Function

**Files:**
- Create: `supabase/functions/r2-upload-url/index.ts`
- Create: `supabase/functions/r2-delete/index.ts`

**Interfaces:**
- Consumes: Supabase Auth JWT (Authorization 헤더), `storagePath` (query param 또는 body)
- Produces:
  - `r2-upload-url`: `{ url: string, publicUrl: string }` — presigned PUT URL + 업로드 후 공개 URL
  - `r2-delete`: `{ success: boolean }` — 삭제 결과

- [ ] **Step 1: r2-upload-url Edge Function 작성**

  `supabase/functions/r2-upload-url/index.ts`:

  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
  import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3'
  import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
  })

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { storagePath, contentType } = await req.json()
    if (!storagePath || !contentType) {
      return new Response(JSON.stringify({ error: 'storagePath and contentType required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const command = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME')!,
      Key: storagePath,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })

    const url = await getSignedUrl(r2, command, { expiresIn: 300 })
    const publicUrl = `${Deno.env.get('R2_PUBLIC_BASE_URL')}/${storagePath}`

    return new Response(JSON.stringify({ url, publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  })
  ```

- [ ] **Step 2: r2-delete Edge Function 작성**

  `supabase/functions/r2-delete/index.ts`:

  ```typescript
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
  import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from 'https://esm.sh/@aws-sdk/client-s3'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
  })

  serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { storagePaths } = await req.json()
    if (!storagePaths || !Array.isArray(storagePaths) || storagePaths.length === 0) {
      return new Response(JSON.stringify({ error: 'storagePaths array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (storagePaths.length === 1) {
      await r2.send(new DeleteObjectCommand({
        Bucket: Deno.env.get('R2_BUCKET_NAME')!,
        Key: storagePaths[0],
      }))
    } else {
      await r2.send(new DeleteObjectsCommand({
        Bucket: Deno.env.get('R2_BUCKET_NAME')!,
        Delete: { Objects: storagePaths.map(Key => ({ Key })) },
      }))
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  })
  ```

- [ ] **Step 3: Edge Function 배포**

  ```bash
  supabase functions deploy r2-upload-url
  supabase functions deploy r2-delete
  ```

  예상 출력:
  ```
  Deploying function r2-upload-url ... done
  Deploying function r2-delete ... done
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/functions/r2-upload-url/ supabase/functions/r2-delete/
  git commit -m "feat: R2 presigned URL 발급 및 삭제 Edge Function 추가"
  ```

---

## Task 4: photo.api.ts R2로 교체

**Files:**
- Modify: `src/features/photo/photo.api.ts`

**Interfaces:**
- Consumes:
  - `supabase.functions.invoke('r2-upload-url', { body: { storagePath, contentType } })` → `{ url: string, publicUrl: string }`
  - `supabase.functions.invoke('r2-delete', { body: { storagePaths: string[] } })` → `{ success: boolean }`
  - `import.meta.env.VITE_R2_PUBLIC_BASE_URL` — R2 public URL 베이스
- Produces: 기존 `photo.api.ts`의 모든 public 함수 시그니처 동일하게 유지

- [ ] **Step 1: uploadToStorage 함수 R2 presigned URL 방식으로 교체**

  `src/features/photo/photo.api.ts`에서 `uploadToStorage` 함수를 다음으로 교체:

  ```typescript
  async function uploadToStorage(storagePath: string, file: File): Promise<string> {
    const { data, error } = await supabase.functions.invoke('r2-upload-url', {
      body: { storagePath, contentType: file.type || 'image/webp' },
    })
    if (error) throw error

    const { url, publicUrl } = data as { url: string; publicUrl: string }

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'image/webp' },
    })
    if (!uploadRes.ok) throw new Error(`R2 upload failed: ${uploadRes.status}`)

    return publicUrl
  }
  ```

- [ ] **Step 2: deletePhoto 함수 R2 삭제로 교체**

  `deletePhoto` 함수에서 `supabase.storage.remove` 호출을 교체:

  ```typescript
  export async function deletePhoto(photo: Photo): Promise<boolean> {
    const { error: fnError } = await supabase.functions.invoke('r2-delete', {
      body: { storagePaths: [photo.storagePath] },
    })
    if (fnError) throw fnError

    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id)

    if (dbError) throw dbError
    return true
  }
  ```

- [ ] **Step 3: deletePhotosByTripId 함수 R2 삭제로 교체**

  ```typescript
  export async function deletePhotosByTripId(tripId: string): Promise<void> {
    const photos = await getPhotosByTripId(tripId)

    if (photos.length > 0) {
      const storagePaths = photos.map(p => p.storagePath)
      await supabase.functions.invoke('r2-delete', {
        body: { storagePaths },
      })
    }
  }
  ```

- [ ] **Step 4: 불필요한 코드 제거**

  `photo.api.ts` 상단에서 제거:
  ```typescript
  const BUCKET_NAME = 'photos'  // 삭제
  ```

- [ ] **Step 5: 로컬에서 업로드 동작 수동 테스트**

  앱을 실행하고 사진 업로드 시도:
  ```bash
  pnpm dev
  ```
  - 사진 업로드 후 Network 탭에서 `r2-upload-url` Edge Function 호출 확인
  - 업로드된 이미지 URL이 `https://images.waylog.me/...` 형태인지 확인
  - 이미지가 화면에 정상 표시되는지 확인

- [ ] **Step 6: 사진 삭제 동작 수동 테스트**

  사진 삭제 후 Network 탭에서 `r2-delete` Edge Function 호출 확인, R2 버킷에서도 파일 삭제됐는지 Cloudflare 대시보드에서 확인

- [ ] **Step 7: Commit**

  ```bash
  git add src/features/photo/photo.api.ts
  git commit -m "feat: 사진 업로드/삭제를 Cloudflare R2로 교체"
  ```

---

## Task 5: 배포 및 정리

**Files:**
- (없음 — 설정 및 검증 작업)

- [ ] **Step 1: Vercel 배포**

  ```bash
  git push origin main
  ```

  Vercel 자동 배포 완료 후 `waylog.me`에서 앱 확인

- [ ] **Step 2: 프로덕션 이미지 로딩 확인**

  `waylog.me`에서 사진 탭 열어 이미지가 `images.waylog.me`로 로딩되는지 Network 탭 확인

- [ ] **Step 3: 프로덕션 업로드 확인**

  실제 사진 업로드 → R2 버킷에 파일 생성됐는지 Cloudflare 대시보드 확인

- [ ] **Step 4: Supabase Storage 버킷 삭제**

  모든 검증 통과 후:
  Supabase 대시보드 → Storage → `photos` 버킷 → Delete bucket

- [ ] **Step 5: .env.local에서 SUPABASE_SERVICE_ROLE_KEY 제거**

  마이그레이션 스크립트용으로만 추가한 값이므로 제거 (보안)

  ```
  # 삭제
  SUPABASE_SERVICE_ROLE_KEY=...
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add .env.local
  git commit -m "chore: 마이그레이션 완료 후 service role 키 제거"
  ```
