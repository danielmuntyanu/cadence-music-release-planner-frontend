import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

const dark = {
  dark: true,
  colors: {
    // Backgrounds
    background: '#111317',
    'surface-lowest': '#0c0e12',
    'surface-low': '#1a1c20',
    surface: '#1e2024',
    'surface-light': '#282a2e',
    'surface-bright': '#333539',
    'surface-variant': '#282a2e', // bg of tooltips

    // Text
    'on-background': '#e2e2e8',
    'on-surface': '#e2e2e8',
    'on-surface-variant': '#c7c4d7',
    'on-surface-muted': '#908fa0',

    // borders
    border: '#2a2b32',
    'border-subtle': '#1e1f27',

    // brand
    primary: '#8083ff',
    'on-primary': '#0d0096',
    'primary-lighten-1': '#c0c1ff',
    'primary-container': '#393b63',

    // Secondary button
    secondary: '#282a2e',
    'on-secondary': '#e2e2e8',

    // statuses
    success: '#4edea3',
    'success-container': '#19382f',
    error: '#ffb4ab',
    'error-container': '#4a1117',
  },
  variables: {
    'border-color': '#c7c4d7',
    'border-opacity': 0.08,
  },
}



export default createVuetify({
  theme: { 
    defaultTheme: 'dark', // 'dark' | 'light' | 'system'
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#48A9A6',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          brand: '#7C3AED', 
        },
      },
      dark,
    },
  },
})