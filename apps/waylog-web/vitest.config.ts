import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        // swiper 는 사전 번들되면 alias/dedupe 가 닿지 않아 react 19.1 을 잡는다.
        // 인라인 처리해야 위의 react alias 가 적용된다.
        inline: ['swiper'],
      },
    },
  },
  resolve: {
    // React 인스턴스가 둘이면 훅 호출이 "Invalid hook call" 로 깨진다.
    // RN 앱이 다른 react 버전을 들여오면 swiper 같은 라이브러리가 그쪽을 잡을 수 있어,
    // 웹 번들에서는 항상 이 앱이 가진 것 하나로 고정한다.
    // react-query 도 Context 를 쓴다. 인스턴스가 갈리면 Provider 를 못 찾는다.
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: [
      // dedupe 는 사전 번들된 .mjs 라이브러리(swiper 등)에는 닿지 않는다.
      // 테스트 환경에서는 경로로 직접 못박아 앱이 가진 react 하나만 쓰게 한다.
      { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime') },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime') },
      { find: /^~(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  },
})
