import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const isProd = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
const config = {
  plugins: [
    reactRouter(),
  ],
  resolve: {
    alias: [
      { find: /^~app/, replacement: path.resolve(__dirname, 'src/app') },
      { find: /^~shared/, replacement: path.resolve(__dirname, 'src/shared') },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled', '@mui/x-date-pickers'],
          'helper-vendor': ['@googlemaps/js-api-loader', '@supabase/supabase-js'],
          // 'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // 'media-vendor': ['@fancyapps/ui', 'swiper', 'heic-to', 'react-image-file-resizer'],
        },
      },
    },
  },
}


if (isProd) {
  config.plugins.push(
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
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
}

export default defineConfig(config);