import { z } from 'zod'
import { scenePresets } from './contracts.ts'

/** Public, immutable evidence only. This contract never accepts credentials or request options. */
function plainStrictObject<Shape extends z.ZodRawShape>(shape: Shape) {
  return z.preprocess((value, context) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const prototype = Object.getPrototypeOf(value)
      const keys = Reflect.ownKeys(value)
      const hasUnsafeKey = keys.some(
        (key) => typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key),
      )

      if ((prototype !== Object.prototype && prototype !== null) || hasUnsafeKey) {
        context.addIssue({ code: 'custom', message: 'Expected a plain evidence object.' })
        return z.NEVER
      }
    }

    return value
  }, z.strictObject(shape))
}

const identifierSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/)
const cloudNameSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,127}$/)
const publicIdSchema = z
  .string()
  .max(255)
  .regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/)
const sha256Schema = z.string().regex(/^[a-f\d]{64}$/i)
const assetIdSchema = z.string().regex(/^[a-f\d]{32}$/i)
const textSchema = z.string().trim().min(1)
const boundedSeedSchema = z.number().int().min(0).max(2_147_483_647)
const timestampSchema = z.iso.datetime({ offset: true })
const positiveIntegerSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

const referenceUrl =
  'https://res.cloudinary.com/demo/image/upload/v1784151459/docs/teapot-product.jpg'

const sourceSchema = plainStrictObject({
  id: identifierSchema,
  cloudName: z.literal('demo'),
  publicId: z.literal('docs/teapot-product'),
  version: z.literal(1784151459),
  format: z.literal('jpg'),
  localPath: z.literal('/demo/teapot-reference.jpg'),
  width: positiveIntegerSchema,
  height: positiveIntegerSchema,
  bytes: positiveIntegerSchema,
  sha256: sha256Schema,
  alt: textSchema.max(1_000),
})

const generationSchema = plainStrictObject({
  operation: z.literal('image_to_image'),
  modelRequested: z.literal('flux-2-klein-9b-edit'),
  // Preserve the provider's actual result; do not assert that requested and used models match.
  modelUsed: textSchema.max(256),
  prompt: textSchema.max(16_384),
  seedRequested: boundedSeedSchema,
  seedUsed: boundedSeedSchema.nullable(),
  requestId: textSchema.max(256),
  createdAt: timestampSchema,
  referenceUrl: z.literal(referenceUrl),
})

const verificationSchema = plainStrictObject({
  adminReadback: z.literal(true),
  deliveryDownloaded: z.literal(true),
  verifiedAt: timestampSchema,
})

const outputSchema = plainStrictObject({
  id: identifierSchema,
  sceneId: z.enum(['marble', 'botanical']),
  name: textSchema.max(120),
  cloudName: cloudNameSchema,
  publicId: publicIdSchema,
  assetId: assetIdSchema,
  version: positiveIntegerSchema,
  format: z.literal('png'),
  width: z.number().int().min(1).max(2048),
  height: z.number().int().min(1).max(2048),
  bytes: z.number().int().min(1).max(10_485_760),
  sha256: sha256Schema,
  localPath: z.enum(['/demo/generated/marble.png', '/demo/generated/botanical.png']),
  alt: textSchema.max(1_000),
  generation: generationSchema,
  verification: verificationSchema,
}).superRefine((output, context) => {
  if (output.localPath !== `/demo/generated/${output.sceneId}.png`) {
    context.addIssue({
      code: 'custom',
      message: 'The local image path must match its saved scene.',
      path: ['localPath'],
    })
  }

  const preset = scenePresets.find((scene) => scene.id === output.sceneId)
  if (output.generation.seedRequested !== preset?.seed) {
    context.addIssue({
      code: 'custom',
      message: 'The requested seed must match the fixed scene preset.',
      path: ['generation', 'seedRequested'],
    })
  }
})

export const savedDemoManifestSchema = plainStrictObject({
  schemaVersion: z.literal('product-studio.saved.v1'),
  recordedOn: z.iso.date(),
  source: sourceSchema,
  outputs: z.array(outputSchema).length(2),
}).superRefine((manifest, context) => {
  const uniqueFields = ['id', 'sceneId', 'assetId', 'localPath'] as const

  for (const field of uniqueFields) {
    const seen = new Set<string>()
    for (const [index, output] of manifest.outputs.entries()) {
      // Asset IDs are hexadecimal and therefore case-insensitive.
      const value = field === 'assetId' ? output[field].toLowerCase() : output[field]
      if (seen.has(value)) {
        context.addIssue({
          code: 'custom',
          message: `Saved outputs must have unique ${field} values.`,
          path: ['outputs', index, field],
        })
      }
      seen.add(value)
    }
  }

  for (const [index, output] of manifest.outputs.entries()) {
    if (output.id === manifest.source.id) {
      context.addIssue({
        code: 'custom',
        message: 'A generated candidate must have a different ID from its reference.',
        path: ['outputs', index, 'id'],
      })
    }
  }
})

export type SavedDemoManifest = z.infer<typeof savedDemoManifestSchema>
