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
    'primary-accent': '#c0c1ff',
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

const light = {
  dark: false,
  colors: {
    // Backgrounds
    background: '#f3f2fb',
    'surface-lowest': '#e6e4f4',
    'surface-low': '#f9f8fe',
    surface: '#ffffff',
    'surface-light': '#ebe9f7',
    'surface-bright': '#dfdcf1',
    'surface-variant': '#ebe9f7', // bg of tooltips

    // Text
    'on-background': '#1b1a26',
    'on-surface': '#1b1a26',
    'on-surface-variant': '#474560',
    'on-surface-muted': '#63618a',

    // borders
    border: '#d9d6ee',
    'border-subtle': '#e8e6f5',

    // brand
    primary: '#5548e0',
    'on-primary': '#ffffff',
    'primary-accent': '#4639c8',
    'primary-container': '#e3e0ff',

    // Secondary button
    secondary: '#ebe9f7',
    'on-secondary': '#1b1a26',

    // statuses
    success: '#0a7350',
    'success-container': '#d3f2e4',
    error: '#ba1a1a',
    'error-container': '#ffdad6',
  },
  variables: {
    'border-color': '#c7c4d7',
    'border-opacity': 0.08,
  },
}

export default createVuetify({
  theme: { 
    defaultTheme: 'dark', // 'dark' | 'light' | 'system'
    themes: { light, dark },
  },
  icons: {
    defaultSet: 'mdi',
  },
})