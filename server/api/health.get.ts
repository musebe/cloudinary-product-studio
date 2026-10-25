import { savedOutputs } from '#shared/studio/saved-data'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    status: 'ok',
    application: 'cloudinary-product-studio',
    mode: 'saved-generated-scenes',
    savedExamples: savedOutputs.length,
    generationRequestsInSavedRun: 2,
    cloudinary: {
      credentialsSupplied: Boolean(
        config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret,
      ),
      credentialsVerified: false,
    },
    capabilities: {
      savedComparison: true,
      scenePlanning: false,
      localReview: true,
      liveUpload: false,
      liveGeneration: false,
    },
    providerCalls: 0,
  }
})
