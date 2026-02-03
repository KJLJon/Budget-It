/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  server: {
    host: true,        // Required for Docker (0.0.0.0)
    port: 5173
  },

  optimizeDeps: {
    include: [
    'date-fns',
    'zod',
    'zustand',
    'react-hook-form',
    '@hookform/resolvers',
    'd3-sankey',
    'd3-scale',
    'd3-shape',
    'papaparse',
    'dexie',
    'dexie-react-hooks',
    'lucide-react',
    'react-hot-toast'
    ]
  },

  esbuild: {
    target: 'esnext',
    jsx: 'automatic'
  },

  build: {
    minify: false,     // Faster dev/CI builds
    sourcemap: false,  // Enable only when debugging
    rollupOptions: {
      output: {
        // Optional: split vendor chunks for faster builds
        manualChunks: {
          // vendor: ['react', 'react-dom']
        }
      }
    }
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Budget It - Personal Finance',
        short_name: 'Budget It',
        description: 'Privacy-focused personal finance management app',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  base: '/Budget-It/',

  test: {
    globals: true,
    environment: 'node'
  }
});
