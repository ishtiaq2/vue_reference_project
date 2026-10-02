import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { mockApiPlugin } from './tools/mock-api/vitePlugin'

export default defineConfig({
  plugins: [vue(), mockApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      // Keep the build output quiet so a real warning is never lost in noise. Only the one known,
      // harmless warning is dropped: zod ships tree-shaking hints in a position Rollup cannot read.
      onwarn(warning, defaultHandler) {
        const isZodAnnotation =
          warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('/node_modules/zod/')
        if (!isZodAnnotation) defaultHandler(warning)
      },
    },
  },
})
