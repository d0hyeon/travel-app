import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
const config = {
  base: '/',
  plugins: [
    reactRouter(),
  ],
  resolve: {
    alias: [
      { find: /^~(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  },
  build: {
    outDir: 'dist/client'
  },
  server: {
    proxy: {
      '/api/og-preview': {
        target: 'https://feubgswdgmxrbpbfbqje.supabase.co',
        changeOrigin: true,
        rewrite: (path: string) => path.replace('/api/og-preview', '/functions/v1/og-preview'),
      },
    },
  }
}


  config.plugins.push(
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      injectRegister: 'inline',
      devOptions: { enabled: false },
      
      manifest: {
        name: '여행 플래너',
        short_name: '여행',
        description: '여행 일정 및 경비 관리 앱',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        "screenshots": [
          {
            src: "screenshot-desktop2880x1564.png",
            sizes: '2880x1564',
            type: 'image/png'
          },
          {
            src: "screenshot-mobile758x1230.png",
            sizes: '758x1230',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        importScripts: ['/push.sw.js'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // {
          //   urlPattern: ({ request }) => request.mode === 'navigate',
          //   handler: 'NetworkFirst',
          //   options: {
          //     cacheName: 'pages-cache',
          //     networkTimeoutSeconds: 10,
          //   },
          // },
          {
            urlPattern: /^https:\/\/.*\.kakaocdn\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kakao-map-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-map-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    })
  )


export default defineConfig(config);
