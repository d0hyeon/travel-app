import { defineConfig } from 'vite'
import { glob } from 'glob'
import path from 'path'

const swEntries = Object.fromEntries(
  glob.sync('src/**/*.sw.ts').map((file) => [
    path.basename(file, '.sw.ts'),
    path.resolve(__dirname, file),
  ])
)

export default defineConfig({
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: swEntries,
      output: {
        entryFileNames: '[name].sw.js',
        format: 'es',
      },
    },
  },
})
