import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'NAR – Gıda Etiketi Analizi',
        short_name: 'NAR',
        description: 'E-kod ve paketli gıda etiketi analizi',
        lang: 'tr',
        theme_color: '#FAF6EE',
        background_color: '#FAF6EE',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,json}'], maximumFileSizeToCacheInBytes: 3_000_000, runtimeCaching: [{ urlPattern: /\/img\/p\/.*\.webp$/, handler: 'CacheFirst', options: { cacheName: 'urun-gorselleri', expiration: { maxEntries: 300 } } }] }
    })
  ]
})
