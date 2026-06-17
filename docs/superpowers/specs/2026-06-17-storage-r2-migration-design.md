# Supabase Storage → Cloudflare R2 마이그레이션 설계

**날짜:** 2026-06-17  
**상태:** 승인됨

---

## 배경

현재 Supabase Storage 무료 플랜(1GB)을 사용 중이며 용량 한계에 근접. Cloudflare R2(무료 10GB + CDN)로 마이그레이션하여 비용 절감 및 성능 개선이 목표.

- 저장 파일: 사진 429개 + 포스트 사진 42개 (총 471개)
- 버킷: `photos` 하나
- DB: `photos` 테이블의 `url` 컬럼에 Supabase CDN URL 저장, `storage_path`에 상대 경로 저장

---

## 아키텍처

```
클라이언트 업로드
  → Supabase Edge Function (presigned PUT URL 발급)
  → R2 버킷 직접 업로드

이미지 서빙
  → images.waylog.me (Cloudflare R2 커스텀 도메인)
  → Cloudflare CDN 캐시
```

**도메인:**
- 앱: `waylog.me` (Vercel)
- 이미지: `images.waylog.me` → Cloudflare R2 커스텀 도메인 연결

---

## 변경 범위

### 1. 마이그레이션 스크립트 (일회성)
`scripts/migrate-storage-to-r2.ts`

- Supabase Storage `photos` 버킷 전체 파일 목록 조회
- 각 파일 signed URL로 다운로드
- R2에 동일 `storage_path` 키로 업로드
- DB `photos` 테이블 `url` 컬럼을 `https://images.waylog.me/{storage_path}`로 일괄 업데이트
- 완료 후 카운트 검증 출력 (Supabase 파일 수 == R2 파일 수)

### 2. 앱 코드 변경
`src/features/photo/photo.api.ts` 한 파일만 수정

| 함수 | 변경 전 | 변경 후 |
|------|---------|---------|
| `uploadToStorage` | Supabase signed upload URL | R2 presigned PUT URL (S3 SDK) |
| `deletePhoto` | `supabase.storage.remove()` | R2 `DeleteObjectCommand` |
| `deletePhotosByTripId` | `supabase.storage.remove()` | R2 `DeleteObjectCommand` |
| public URL 생성 | `supabase.storage.getPublicUrl()` | `https://images.waylog.me/{path}` 고정 패턴 |

### 3. 환경변수 추가
```
# 서버 (Edge Function / 마이그레이션 스크립트)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=photos

# 클라이언트
VITE_R2_PUBLIC_BASE_URL=https://images.waylog.me
```

### 4. Supabase Edge Function
클라이언트에서 R2 자격증명을 직접 노출하지 않기 위해 presigned URL 발급을 Edge Function으로 위임.

- `supabase/functions/r2-presigned-url/index.ts`
- 인증된 사용자에게만 PUT presigned URL 발급
- 삭제도 Edge Function 경유

---

## DB 변경

스키마 변경 없음. `url` 컬럼 값만 R2 URL로 교체.

---

## 마이그레이션 실행 순서

1. Cloudflare R2 버킷 생성 + `images.waylog.me` 커스텀 도메인 연결
2. R2 API 토큰 발급 (Access Key ID / Secret)
3. 마이그레이션 스크립트 실행 (로컬에서 `tsx scripts/migrate-storage-to-r2.ts`)
4. 검증: R2 파일 수 확인, 앱에서 이미지 로딩 확인
5. Supabase Edge Function 배포 (presigned URL 발급)
6. 앱 코드(`photo.api.ts`) 교체 후 배포
7. Supabase Storage 버킷 삭제 (검증 후)

---

## 롤백

- 마이그레이션 스크립트 실행 전까지 Supabase Storage는 그대로 유지
- 앱 코드 배포 전 DB `url` 값이 R2로 바뀌어도, Supabase Storage 파일은 삭제하지 않으므로 롤백 가능
- 앱 배포 후 문제 시 `url` 컬럼을 Supabase URL로 재업데이트하면 복구

---

## 패키지

```
@aws-sdk/client-s3        # R2 업로드/삭제 (S3 호환)
@aws-sdk/s3-request-presigner  # presigned URL 생성
```
