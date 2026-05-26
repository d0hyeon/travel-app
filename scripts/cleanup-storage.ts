/**
 * Storage 고아 파일 정리 스크립트
 *
 * 사용법:
 *   npx tsx scripts/cleanup-storage.ts           # dry-run (삭제 예정 목록만 출력)
 *   npx tsx scripts/cleanup-storage.ts --delete  # 실제 삭제
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env')
  const content = readFileSync(envPath, 'utf-8')
  return Object.fromEntries(
    content.split('\n')
      .filter((line) => line.includes('=') && !line.startsWith('#'))
      .map((line) => {
        const [key, ...rest] = line.split('=')
        return [key.trim(), rest.join('=').trim()]
      })
  )
}

const env = loadEnv()
const SUPABASE_URL = env['VITE_SUPABASE_URL']
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/cleanup-storage.ts')
  process.exit(1)
}
const BUCKET = 'photos'
const BATCH_SIZE = 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const isDryRun = !process.argv.includes('--delete')

// Storage 버킷의 모든 파일 경로를 재귀적으로 수집
async function listAllStorageFiles(prefix = ''): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 })

  if (error) throw error
  if (!data) return []

  const paths: string[] = []

  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name

    if (item.metadata == null) {
      // metadata가 null이면 폴더 → 재귀
      const nested = await listAllStorageFiles(fullPath)
      paths.push(...nested)
    } else {
      // 파일
      paths.push(fullPath)
    }
  }

  return paths
}

// DB에서 유효한 storage_path 집합 조회
async function getReferencedPaths(): Promise<Set<string>> {
  const referenced = new Set<string>()

  // photos 테이블
  const { data: photoRows, error: photoError } = await supabase
    .from('photos')
    .select('storage_path')
  if (photoError) throw photoError
  for (const row of photoRows ?? []) referenced.add(row.storage_path)

  // post_photos 테이블
  const { data: postPhotoRows, error: postPhotoError } = await supabase
    .from('post_photos')
    .select('storage_path')
  if (postPhotoError) throw postPhotoError
  for (const row of postPhotoRows ?? []) referenced.add(row.storage_path)

  return referenced
}

async function main() {
  console.log(`모드: ${isDryRun ? 'DRY-RUN (실제 삭제 없음)' : '실제 삭제'}`)
  console.log('Storage 파일 목록 수집 중...')

  const [allFiles, referencedPaths] = await Promise.all([
    listAllStorageFiles(),
    getReferencedPaths(),
  ])

  console.log(`Storage 파일 수: ${allFiles.length}`)
  console.log(`DB 참조 경로 수: ${referencedPaths.size}`)

  const orphans = allFiles.filter((path) => !referencedPaths.has(path))

  if (orphans.length === 0) {
    console.log('\n고아 파일 없음. Storage가 깨끗합니다.')
    return
  }

  console.log(`\n고아 파일 ${orphans.length}개 발견:`)
  for (const path of orphans) {
    console.log(`  ${isDryRun ? '[삭제 예정]' : '[삭제]'} ${path}`)
  }

  if (isDryRun) {
    console.log('\n실제 삭제하려면 --delete 플래그를 추가하세요.')
    console.log('  npx tsx scripts/cleanup-storage.ts --delete')
    return
  }

  // 배치 삭제
  let deleted = 0
  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) throw error
    deleted += batch.length
    console.log(`삭제 진행: ${deleted}/${orphans.length}`)
  }

  console.log(`\n완료: ${deleted}개 파일 삭제됨`)
}

main().catch((err) => {
  console.error('오류 발생:', err)
  process.exit(1)
})
