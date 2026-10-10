import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig( ({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')

  const CERT_KEY_PATH = env.CERT_KEY_PATH
  const CERT_PATH = env.CERT_PATH
  const hasLocalCerts = fs.existsSync(CERT_KEY_PATH) && fs.existsSync(CERT_PATH)

  return {
    plugins: [
      vue(),
      vueJsx(),
      vuetify({ styles: { configFile: 'src/styles/settings.scss' } }),
      tailwindcss(),
      vueDevTools(),
    ],
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
