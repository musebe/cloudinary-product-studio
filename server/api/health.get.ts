export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    status: 'ok',
    application: 'cloudinary-product-studio',
    mode: 'saved-example-and-scene-planning',
    cloudinary: {
      credentialsSupplied: Boolean(
        config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret,
      ),
      credentialsVerified: false,
    },
    capabilities: {
      savedComparison: true,
      scenePlanning: true,
      localReview: true,
      liveUpload: false,
      liveGeneration: false,
    },
    providerCalls: 0,
  }
})
