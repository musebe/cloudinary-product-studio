export default defineNuxtConfig({
  compatibilityDate: '2026-10-25',
  buildDir: process.env.PRODUCT_STUDIO_BUILD_DIR,
  devtools: { enabled: false },
  build: { transpile: ['@cloudinary/vue', '@cloudinary/html'] },
  css: ['~/assets/main.css'],
  devServer: { host: '127.0.0.1', port: 3004 },
  runtimeConfig: {
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    demoSessionSecret: '',
    enableLiveUploads: false,
    enableGeneration: false,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Product Studio | Vue and Cloudinary',
      meta: [
        {
          name: 'description',
          content:
            'Compare two saved Cloudinary-generated product scenes with their reference. Inspect shape, color, and details without generating another image.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
    },
  },
  routeRules: {
    '/api/**': {
      headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    },
  },
})
