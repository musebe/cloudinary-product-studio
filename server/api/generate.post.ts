export default defineEventHandler(() => {
  throw createError({
    statusCode: 403,
    statusMessage:
      'Public generation is disabled. This demo serves two saved outputs. No provider call was made.',
  })
})
