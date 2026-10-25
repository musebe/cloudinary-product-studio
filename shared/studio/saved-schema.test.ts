import { describe, expect, it } from 'vitest'
import { savedDemoManifestSchema, type SavedDemoManifest } from './saved-schema'

/** Synthetic contract fixtures only. These are not provider results or production app assets. */
function syntheticManifest(): SavedDemoManifest {
  const makeOutput = (sceneId: 'marble' | 'botanical'): SavedDemoManifest['outputs'][number] => ({
    id: `synthetic-${sceneId}`,
    sceneId,
    name: `Synthetic ${sceneId} example`,
    cloudName: 'synthetic-tests',
    publicId: `product-studio/test-only/${sceneId}`,
    assetId: (sceneId === 'marble' ? 'a' : 'b').repeat(32),
    version: 1792922400,
    format: 'png',
    width: 1024,
    height: 1024,
    bytes: 1000,
    sha256: (sceneId === 'marble' ? 'c' : 'd').repeat(64),
    localPath: `/demo/generated/${sceneId}.png`,
    alt: `Synthetic fixture for the ${sceneId} scene.`,
    generation: {
      operation: 'image_to_image',
      modelRequested: 'flux-2-klein-9b-edit',
      modelUsed: 'flux-2-klein-9b-edit',
      prompt: 'Synthetic test prompt: retain the product in [1] and change its setting.',
      seedRequested: sceneId === 'marble' ? 104729 : 155921,
      seedUsed: null,
      requestId: `synthetic-request-${sceneId}`,
      createdAt: '2026-10-25T10:00:00.000Z',
      referenceUrl:
        'https://res.cloudinary.com/demo/image/upload/v1784151459/docs/teapot-product.jpg',
    },
    verification: {
      adminReadback: true,
      deliveryDownloaded: true,
      verifiedAt: '2026-10-25T10:01:00.000Z',
    },
  })

  return {
    schemaVersion: 'product-studio.saved.v1',
    recordedOn: '2026-10-25',
    source: {
      id: 'synthetic-reference',
      cloudName: 'demo',
      publicId: 'docs/teapot-product',
      version: 1784151459,
      format: 'jpg',
      localPath: '/demo/teapot-reference.jpg',
      width: 1920,
      height: 1314,
      bytes: 214441,
      sha256: 'e'.repeat(64),
      alt: 'Synthetic reference metadata for schema tests.',
    },
    outputs: [makeOutput('marble'), makeOutput('botanical')],
  }
}

describe('saved generation evidence contract', () => {
  it('accepts exactly two verified scenes without mutating the input', () => {
    const manifest = syntheticManifest()
    const snapshot = structuredClone(manifest)

    expect(savedDemoManifestSchema.parse(manifest)).toEqual(snapshot)
    expect(manifest).toEqual(snapshot)
  })

  it('preserves an actually used model that differs from the requested model', () => {
    const manifest = syntheticManifest()
    manifest.outputs[0]!.generation.modelUsed = 'actual-provider-model'
    manifest.outputs[0]!.generation.seedUsed = 42

    const result = savedDemoManifestSchema.parse(manifest)

    expect(result.outputs[0]!.generation.modelUsed).toBe('actual-provider-model')
    expect(result.outputs[0]!.generation.seedUsed).toBe(42)
  })

  it('accepts outputs in either order', () => {
    const manifest = syntheticManifest()
    manifest.outputs.reverse()
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(true)
  })

  it.each([null, undefined, {}, [], 'manifest'])(
    'rejects malformed top-level input: %j',
    (input) => {
      expect(savedDemoManifestSchema.safeParse(input).success).toBe(false)
    },
  )

  const invalidChanges: ReadonlyArray<[string, (manifest: SavedDemoManifest) => void]> = [
    ['zero outputs', (manifest) => (manifest.outputs = [])],
    ['one output', (manifest) => manifest.outputs.pop()],
    ['three outputs', (manifest) => manifest.outputs.push(manifest.outputs[0]!)],
    ['duplicate scenes', (manifest) => (manifest.outputs[1] = { ...manifest.outputs[0]! })],
    ['duplicate candidate IDs', (manifest) => (manifest.outputs[1]!.id = manifest.outputs[0]!.id)],
    ['candidate uses reference ID', (manifest) => (manifest.outputs[0]!.id = manifest.source.id)],
    [
      'duplicate asset IDs',
      (manifest) => (manifest.outputs[1]!.assetId = manifest.outputs[0]!.assetId),
    ],
    [
      'case-insensitive duplicate asset IDs',
      (manifest) => (manifest.outputs[1]!.assetId = manifest.outputs[0]!.assetId.toUpperCase()),
    ],
    [
      'mismatched scene path',
      (manifest) => (manifest.outputs[0]!.localPath = '/demo/generated/botanical.png'),
    ],
    ['swapped seed', (manifest) => (manifest.outputs[0]!.generation.seedRequested = 155921)],
    ['negative seed', (manifest) => (manifest.outputs[0]!.generation.seedRequested = -1)],
    ['unbounded seed', (manifest) => (manifest.outputs[0]!.generation.seedUsed = 2147483648)],
    ['fractional seed', (manifest) => (manifest.outputs[0]!.generation.seedUsed = 1.5)],
    ['missing actual model', (manifest) => (manifest.outputs[0]!.generation.modelUsed = ' ')],
    ['empty request ID', (manifest) => (manifest.outputs[0]!.generation.requestId = '')],
    ['empty prompt', (manifest) => (manifest.outputs[0]!.generation.prompt = '')],
    [
      'excessive prompt',
      (manifest) => (manifest.outputs[0]!.generation.prompt = 'p'.repeat(16385)),
    ],
    ['invalid recording date', (manifest) => (manifest.recordedOn = '2026-02-30')],
    [
      'timestamp instead of recording date',
      (manifest) => (manifest.recordedOn = '2026-10-25T10:00:00Z'),
    ],
    [
      'invalid generation timestamp',
      (manifest) => (manifest.outputs[0]!.generation.createdAt = 'today'),
    ],
    [
      'invalid verification timestamp',
      (manifest) => (manifest.outputs[0]!.verification.verifiedAt = '2026-02-30T10:00:00Z'),
    ],
    ['zero width', (manifest) => (manifest.outputs[0]!.width = 0)],
    ['excessive width', (manifest) => (manifest.outputs[0]!.width = 2049)],
    ['excessive height', (manifest) => (manifest.outputs[0]!.height = 2049)],
    ['fractional width', (manifest) => (manifest.outputs[0]!.width = 1024.5)],
    ['infinite height', (manifest) => (manifest.outputs[0]!.height = Infinity)],
    ['NaN width', (manifest) => (manifest.outputs[0]!.width = NaN)],
    ['no file bytes', (manifest) => (manifest.outputs[0]!.bytes = 0)],
    ['oversized file', (manifest) => (manifest.outputs[0]!.bytes = 10485761)],
    ['invalid source width', (manifest) => (manifest.source.width = -1)],
    ['invalid source hash', (manifest) => (manifest.source.sha256 = 'not-a-hash')],
    ['invalid candidate hash', (manifest) => (manifest.outputs[0]!.sha256 = '0'.repeat(63))],
    ['invalid asset ID', (manifest) => (manifest.outputs[0]!.assetId = 'z'.repeat(32))],
    ['invalid version', (manifest) => (manifest.outputs[0]!.version = 0)],
    ['unsafe public ID', (manifest) => (manifest.outputs[0]!.publicId = '../outside')],
    ['URL public ID', (manifest) => (manifest.outputs[0]!.publicId = 'https://example.com/asset')],
    [
      'transformation public ID',
      (manifest) => (manifest.outputs[0]!.publicId = 'e_gen_replace:from_teapot;to_other/asset'),
    ],
    ['unsafe cloud name', (manifest) => (manifest.outputs[0]!.cloudName = 'cloud/other')],
    ['URL cloud name', (manifest) => (manifest.outputs[0]!.cloudName = 'https://example.com')],
    ['invalid candidate ID', (manifest) => (manifest.outputs[0]!.id = '<script>alert(1)</script>')],
  ]

  it.each(invalidChanges)('rejects %s', (_name, mutate) => {
    const manifest = syntheticManifest()
    mutate(manifest)
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
  })

  it.each([
    ['cloudName', 'another-cloud'],
    ['publicId', 'another/reference'],
    ['version', 1784151460],
    ['format', 'png'],
    ['localPath', '/demo/another-reference.jpg'],
  ])('rejects a changed fixed reference %s', (field, value) => {
    const manifest = syntheticManifest()
    Object.assign(manifest.source, { [field]: value })
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
  })

  it.each([
    ['schemaVersion', 'product-studio.saved.v2'],
    ['sceneId', 'warm-studio'],
    ['format', 'jpg'],
    ['localPath', '/demo/generated/../marble.png'],
    ['localPath', '//example.com/marble.png'],
    ['localPath', 'https://example.com/marble.png'],
  ])('rejects an unsupported %s value %s', (field, value) => {
    const manifest = syntheticManifest()
    if (field === 'schemaVersion') Object.assign(manifest, { [field]: value })
    else Object.assign(manifest.outputs[0]!, { [field]: value })
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
  })

  it.each(['adminReadback', 'deliveryDownloaded'])(
    'requires affirmative %s verification',
    (field) => {
      for (const invalidValue of [false, null, 'true', undefined]) {
        const manifest = syntheticManifest()
        Object.assign(manifest.outputs[0]!.verification, { [field]: invalidValue })
        expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
      }
    },
  )

  it.each([
    ['operation', 'text_to_image'],
    ['modelRequested', 'auto'],
    ['referenceUrl', 'https://example.com/reference.jpg'],
    ['referenceUrl', 'https://res.cloudinary.com/demo/image/upload/docs/teapot-product.jpg'],
  ])('rejects altered generation %s evidence', (field, value) => {
    const manifest = syntheticManifest()
    Object.assign(manifest.outputs[0]!.generation, { [field]: value })
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
  })

  it.each(['root', 'source', 'output', 'generation', 'verification'])(
    'rejects unknown keys at %s',
    (level) => {
      const manifest = syntheticManifest()
      const target = targetObject(manifest, level)
      Object.assign(target, { secret: 'never-include-this', arbitraryOption: true })
      expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
    },
  )

  it.each(['__proto__', 'constructor', 'prototype'])(
    'rejects own %s keys at every level',
    (key) => {
      for (const level of ['root', 'source', 'output', 'generation', 'verification']) {
        const manifest = syntheticManifest()
        Object.defineProperty(targetObject(manifest, level), key, {
          value: { polluted: true },
          enumerable: true,
        })
        expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
      }
    },
  )

  it('rejects non-plain prototypes and symbol keys instead of copying them into evidence', () => {
    for (const level of ['root', 'source', 'output', 'generation', 'verification']) {
      const manifest = syntheticManifest()
      Object.setPrototypeOf(targetObject(manifest, level), { maliciousInheritedField: true })
      expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
    }

    const manifest = syntheticManifest()
    Object.assign(manifest.outputs[0]!, { [Symbol('hidden-options')]: 'not-evidence' })
    expect(savedDemoManifestSchema.safeParse(manifest).success).toBe(false)
  })
})

function targetObject(manifest: SavedDemoManifest, level: string): object {
  if (level === 'source') return manifest.source
  if (level === 'output') return manifest.outputs[0]!
  if (level === 'generation') return manifest.outputs[0]!.generation
  if (level === 'verification') return manifest.outputs[0]!.verification
  return manifest
}
