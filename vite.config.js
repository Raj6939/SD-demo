import { fileURLToPath, URL } from 'node:url'
import * as fs from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'


// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./certs/private-key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
