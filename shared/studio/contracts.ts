import { z } from 'zod'

export const sceneIdSchema = z.enum(['marble', 'warm-studio', 'botanical'])

export type SceneId = z.infer<typeof sceneIdSchema>

export interface ScenePreset {
  readonly id: SceneId
  readonly name: string
  readonly description: string
  readonly prompt: string
  readonly seed: number
  readonly accent: string
}

const preserveReference =
  'Edit the product in reference image [1]. Preserve its shape, color, handle, spout, finish, and small details. '

export const scenePresets: readonly ScenePreset[] = Object.freeze([
  Object.freeze({
    id: 'marble',
    name: 'Quiet marble',
    description: 'Pale stone, soft daylight, and a calm editorial backdrop.',
    prompt:
      preserveReference +
      'Place the same teapot on a pale marble counter against a warm off-white wall, with soft window daylight and a subtle contact shadow. Change only the setting; add no text or logos.',
    seed: 104_729,
    accent: '#e8e3db',
  }),
  Object.freeze({
    id: 'warm-studio',
    name: 'Warm studio',
    description: 'A warm sand-colored sweep with gentle studio lighting.',
    prompt:
      preserveReference +
      'Place the same teapot on a matte sand-colored studio surface with a matching seamless backdrop, warm diffused light, and a subtle contact shadow. Change only the setting; add no text or logos.',
    seed: 130_363,
    accent: '#d4b392',
  }),
  Object.freeze({
    id: 'botanical',
    name: 'Botanical light',
    description: 'Muted green surroundings with delicate leaf shadows.',
    prompt:
      preserveReference +
      'Place the same teapot on a light neutral table against a muted sage-green wall, with soft daylight and delicate leaf shadows in the background. Keep foliage behind the product without obscuring it. Change only the setting; add no text or logos.',
    seed: 155_921,
    accent: '#a9b8a0',
  }),
])

export type ReviewCheckId = 'shape' | 'color' | 'details'

export const reviewChecks: readonly Readonly<{
  id: ReviewCheckId
  label: string
  description: string
}>[] = Object.freeze([
  Object.freeze({
    id: 'shape',
    label: 'Shape and proportions',
    description: 'Compare the silhouette, handle, and spout with the reference.',
  }),
  Object.freeze({
    id: 'color',
    label: 'Product color',
    description: 'Check that the product color still matches the reference.',
  }),
  Object.freeze({
    id: 'details',
    label: 'Finish and details',
    description: 'Inspect the surface finish, lid, edges, and small details.',
  }),
])

export type ReviewChecks = Record<ReviewCheckId, boolean>
export type ReviewDecision = 'approved' | 'rejected'

export interface ReviewIdentity {
  readonly referenceId: string
  readonly candidateId: string
  readonly candidateSha256: string
}

export interface CandidateReview extends ReviewIdentity {
  readonly decision: ReviewDecision
  readonly checks: ReviewChecks
  readonly reviewedAt: string
}

const reviewChecksSchema = z.strictObject({
  shape: z.boolean(),
  color: z.boolean(),
  details: z.boolean(),
})

const localReviewInputSchema = z
  .strictObject({
    decision: z.enum(['approved', 'rejected']),
    checks: reviewChecksSchema,
  })
  .refine(
    ({ decision, checks }) =>
      decision !== 'approved' || (checks.shape && checks.color && checks.details),
    {
      message: 'Approval requires all three human review checks.',
      path: ['checks'],
    },
  )

const identityIdSchema = z
  .string()
  .min(1, 'Review identity must not be empty.')
  .refine((value) => value.trim().length > 0, 'Review identity must not be blank.')

const reviewIdentitySchema = z.strictObject({
  referenceId: identityIdSchema,
  candidateId: identityIdSchema,
  candidateSha256: z
    .string()
    .regex(/^[a-f\d]{64}$/i, 'Candidate SHA-256 must contain exactly 64 hexadecimal characters.'),
})

const scenePlanInputSchema = z.strictObject({ sceneId: sceneIdSchema })

const productReference = Object.freeze({
  cloudName: 'demo',
  publicId: 'docs/teapot-product',
  version: 1784151459,
} as const)

export interface ScenePlan {
  readonly schemaVersion: 'product-studio.plan.v1'
  readonly scene: Readonly<Pick<ScenePreset, 'id' | 'name' | 'prompt' | 'seed'>>
  readonly reference: typeof productReference
  readonly engine: 'cloudinary-image-to-image'
  readonly modelId: 'flux-2-klein-9b-edit'
  readonly providerCalls: 0
  readonly status: 'planned'
}

export function emptyReviewChecks(): ReviewChecks {
  return { shape: false, color: false, details: false }
}

/** Records a browser-local human decision, not a server publication gate. */
export function createLocalReview(
  input: unknown,
  identity: ReviewIdentity,
  now: Date = new Date(),
): CandidateReview {
  const validatedInput = localReviewInputSchema.parse(input)
  const validatedIdentity = reviewIdentitySchema.parse(identity)

  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('Review time must be a valid Date.')
  }

  return {
    ...validatedIdentity,
    decision: validatedInput.decision,
    checks: { ...validatedInput.checks },
    reviewedAt: now.toISOString(),
  }
}

export function isReviewCurrent(review: CandidateReview | null, identity: ReviewIdentity): boolean {
  return (
    review !== null &&
    review.referenceId === identity.referenceId &&
    review.candidateId === identity.candidateId &&
    review.candidateSha256 === identity.candidateSha256
  )
}

/** Builds data only: no delivery URL, network request, or provider execution. */
export function createScenePlan(input: unknown): ScenePlan {
  const { sceneId } = scenePlanInputSchema.parse(input)
  const preset = scenePresets.find((scene) => scene.id === sceneId)

  if (!preset) {
    throw new Error('The requested scene preset is unavailable.')
  }

  return Object.freeze({
    schemaVersion: 'product-studio.plan.v1',
    scene: Object.freeze({
      id: preset.id,
      name: preset.name,
      prompt: preset.prompt,
      seed: preset.seed,
    }),
    reference: productReference,
    engine: 'cloudinary-image-to-image',
    modelId: 'flux-2-klein-9b-edit',
    providerCalls: 0,
    status: 'planned',
  })
}
