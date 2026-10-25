export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage:
      'Live generation is not connected. Use the saved comparison or preview a scene request. No provider call was made.',
  })
})
