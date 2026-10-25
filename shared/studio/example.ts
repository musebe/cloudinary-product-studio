export interface ExampleAsset {
  readonly cloudName?: string
  readonly id: string
  readonly publicId: string
  readonly version: number
  readonly format: 'jpg' | 'png'
  readonly width: number
  readonly height: number
  readonly bytes: number
  readonly sha256: string
  readonly localPath: string
  readonly alt: string
}

export const referenceAsset: ExampleAsset = Object.freeze({
  id: 'cloudinary-docs-teapot-reference',
  publicId: 'docs/teapot-product',
  version: 1784151459,
  format: 'jpg',
  width: 1920,
  height: 1314,
  bytes: 214441,
  sha256: '5a935e6fb0b12f3ba9c0a12f6b901a294a76c23dafba28c86a62f14d8301ee12',
  localPath: '/demo/teapot-reference.jpg',
  alt: 'Product photograph of a white ceramic teapot with terracotta dots, lid, spout, and handle.',
})

export const candidateAsset: ExampleAsset = Object.freeze({
  id: 'cloudinary-docs-teapot-watercolor',
  publicId: 'teapot-product/watercolor',
  version: 1790152537,
  format: 'png',
  width: 1792,
  height: 1344,
  bytes: 2928680,
  sha256: 'a18e71c370044d0e4322e72fadf05f26ec19910538b196794d02c634ef1bf235',
  localPath: '/demo/teapot-watercolor.png',
  alt: 'Cloudinary documentation example restyling the teapot as a watercolor painting.',
})

export const exampleProvenance = Object.freeze({
  origin: 'published-cloudinary-documentation' as const,
  source:
    'https://cloudinary.com/documentation/image_generation_addon#let_cloudinary_choose_the_edit_model',
  recordedOn: '2026-10-25',
  prompt:
    'Restyle the product in [1] as a hand-painted watercolor illustration, keeping the composition and proportions',
  operation: 'image-to-image restyling, not background replacement',
  verification:
    'Downloaded public files; checked file dimensions, byte counts, and SHA-256. No account Admin API readback.',
})

export const exampleIdentity = Object.freeze({
  referenceId: referenceAsset.id,
  candidateId: candidateAsset.id,
  candidateSha256: candidateAsset.sha256,
})
