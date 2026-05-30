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
  },
  resolve: {
    // vite.config.ts와 동일한 path alias — 테스트에서도 ~features/ 등을 그대로 쓸 수 있다
    alias: [
      { find: /^~app/, replacement: path.resolve(__dirname, 'src/app') },
      { find: /^~api/, replacement: path.resolve(__dirname, 'src/api') },
      { find: /^~features/, replacement: path.resolve(__dirname, 'src/features') },
      { find: /^~shared/, replacement: path.resolve(__dirname, 'src/shared') },
      { find: /^~test-utils/, replacement: path.resolve(__dirname, 'src/test-utils') },
    ],
  },
})
