// routes.ts를 파싱해서 CLAUDE.md 라우팅 섹션을 자동 업데이트합니다.
// 사용: node scripts/gen-docs.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

// --- routes.ts 파싱 ---

const routesContent = readFileSync(join(ROOT, 'src/app/routes.ts'), 'utf-8')

// AppRoute 상수 파싱: { 여행_상세: '/trip/:tripId', ... }
const appRouteMap = {}
const appRouteBlock = routesContent.match(/export const AppRoute\s*=\s*\{([^}]+)\}/)
if (appRouteBlock) {
  for (const [, key, value] of appRouteBlock[1].matchAll(/([^\s:]+):\s*'([^']+)'/g)) {
    appRouteMap[key] = value
  }
}

// path 표현식을 실제 경로 문자열로 변환
function resolvePath(expr) {
  expr = expr.trim()
  const ref = expr.match(/AppRoute\.([^\s,)]+)/)
  if (ref) return appRouteMap[ref[1]] ?? expr
  const literal = expr.match(/^['"](.+)['"]$/)
  if (literal) return literal[1]
  return expr
}

// 컴포넌트 파일명에서 이름 추출: "trip/TripListPage.tsx" → "TripListPage"
function componentName(filePath) {
  return filePath.split('/').pop().replace(/\.tsx?$/, '')
}

const routes = []

// index("component.tsx") → 경로 /
for (const [, file] of routesContent.matchAll(/\bindex\(\s*"([^"]+)"\s*\)/g)) {
  routes.push({ path: '/', component: componentName(file) })
}

// route(path, "component.tsx")
for (const [, pathExpr, file] of routesContent.matchAll(/\broute\(\s*([^,]+),\s*"([^"]+)"\s*\)/g)) {
  routes.push({ path: resolvePath(pathExpr), component: componentName(file) })
}

if (routes.length === 0) {
  console.error('라우트를 찾을 수 없습니다. routes.ts 구조를 확인하세요.')
  process.exit(1)
}

// --- 마크다운 생성 ---

const maxPathLen = Math.max(...routes.map(r => r.path.length))
const table = routes
  .map(({ path, component }) => `${path.padEnd(maxPathLen + 3)}→ ${component}`)
  .join('\n')

const block = `<!-- ROUTES:START -->\n\`\`\`\n${table}\n\`\`\`\n<!-- ROUTES:END -->`

// --- CLAUDE.md 업데이트 ---

const claudePath = join(ROOT, 'CLAUDE.md')
const original = readFileSync(claudePath, 'utf-8')
const updated = original.replace(
  /<!-- ROUTES:START -->[\s\S]*?<!-- ROUTES:END -->/,
  block
)

if (original === updated) {
  console.log('CLAUDE.md 라우팅 섹션이 이미 최신 상태입니다.')
} else {
  writeFileSync(claudePath, updated)
  console.log('CLAUDE.md 라우팅 섹션이 업데이트되었습니다.')
}
