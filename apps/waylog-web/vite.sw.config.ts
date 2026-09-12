import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/service-worker.ts'),
      output: {
        entryFileNames: 'service-worker.js',
        format: 'es',
      },
    },
  },
  resolve: {
    alias: [
      { find: /^~(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  }
})
