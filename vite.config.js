import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isTest = mode === 'test'

  const { CERT_KEY_PATH, CERT_PATH } = env
  const hasLocalCerts =
    !isTest &&
    Boolean(CERT_KEY_PATH && CERT_PATH) &&
    fs.existsSync(CERT_KEY_PATH) &&
    fs.existsSync(CERT_PATH)

  return {
    plugins: [
      vue(),
      vueJsx(),
      vuetify({ styles: { configFile: 'src/styles/settings.scss' } }),
      tailwindcss(),
      // DevTools в тестах не нужен и может мешать
      !isTest && vueDevTools(),
    ].filter(Boolean),
    server: {
      ...(hasLocalCerts && {
        https: {
          key: fs.readFileSync(CERT_KEY_PATH),
          cert: fs.readFileSync(CERT_PATH),
        },
      }),
      port: Number(env.VITE_PORT) || 5173,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})