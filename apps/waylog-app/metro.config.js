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

// React 는 앱에 하나만 존재해야 한다. 두 인스턴스가 섞이면 훅 호출이
// "Invalid hook call" 로 깨진다.
//
// 워크스페이스에는 React 버전이 갈릴 경로가 상시 존재한다:
//   - Expo SDK 를 올리면 앱의 react 가 SDK 가 고정한 버전으로 되돌아간다
//   - 웹이 react 를 올리면 공유 패키지(@waylog/*)가 그쪽을 따라간다
// 지금은 버전을 맞춰뒀지만, 어긋난 순간 조용히 깨지는 대신 여기서 막는다.
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
