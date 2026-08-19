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

// 공유 패키지(@waylog/*)에도 peer 로 react 가 심겨 웹(19.2)과 앱(19.1)의
// 인스턴스가 섞인다. 두 인스턴스가 공존하면 훅 호출이 "Invalid hook call" 로 깨지므로
// RN 번들에서는 어디서 import 하든 앱이 가진 것 하나로 강제한다.
const SINGLETONS = ['react', 'react-dom', 'react-native']

const defaultResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pkg = SINGLETONS.find(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`),
  )

  if (pkg) {
    const rest = moduleName.slice(pkg.length)
    return context.resolveRequest(
      context,
      path.resolve(projectRoot, 'node_modules', pkg) + rest,
      platform,
    )
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
