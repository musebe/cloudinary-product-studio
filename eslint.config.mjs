import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier/flat'

export default ts.config(
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      '.nuxt-e2e/**',
      '.output/**',
      '.vercel/**',
      '.test-artifacts/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: ts.parser } },
    rules: { 'vue/html-self-closing': 'off', 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['**/*.{ts,vue}'],
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['**/*.{ts,mjs,vue}'],
    languageOptions: {
      globals: {
        defineNuxtConfig: 'readonly',
        defineEventHandler: 'readonly',
        useRuntimeConfig: 'readonly',
        createError: 'readonly',
        readValidatedBody: 'readonly',
        getRequestHeader: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        AbortController: 'readonly',
      },
    },
  },
  prettier,
)
