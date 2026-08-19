// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Metro는 기본적으로 프로젝트 폴더 아래만 감시한다.
// 워크스페이스 루트를 넣어야 packages/* 변경이 Fast Refresh로 전달된다.
config.watchFolders = [monorepoRoot]

// 의존성 해석 순서: 앱 → 워크스페이스 루트.
// pnpm은 심링크 구조라 두 경로를 모두 명시해야 한다.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = config
