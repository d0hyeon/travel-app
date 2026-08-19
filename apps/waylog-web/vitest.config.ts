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
  },
  resolve: {
    // React 인스턴스가 둘이면 훅 호출이 "Invalid hook call" 로 깨진다.
    // RN 앱이 다른 react 버전을 들여오면 swiper 같은 라이브러리가 그쪽을 잡을 수 있어,
    // 웹 번들에서는 항상 이 앱이 가진 것 하나로 고정한다.
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^~(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  },
})
