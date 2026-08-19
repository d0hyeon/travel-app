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
    dedupe: ['react', 'react-dom'],
    alias: [
      // dedupe 는 사전번들 대상에만 적용돼 swiper 같은 .mjs 라이브러리가
      // RN 앱의 react 19.1 을 잡는 것을 막지 못한다. 경로로 직접 고정한다.
      { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime') },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime') },
      // dedupe 는 사전 번들된 .mjs 라이브러리(swiper 등)에는 닿지 않는다.
      // RN 앱이 다른 react 버전을 들여와도 웹은 자기 것만 쓰도록 경로를 못박는다.
      { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      { find: /^~(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  },
})
