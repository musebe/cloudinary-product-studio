import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Cloudinary } from '@cloudinary/url-gen'
import { describe, expect, it } from 'vitest'
import { candidateAsset, referenceAsset } from './example'

describe('packaged example evidence', () => {
  for (const asset of [referenceAsset, candidateAsset]) {
    it(`matches the recorded bytes and hash for ${asset.id}`, () => {
      const bytes = readFileSync(resolve(process.cwd(), 'public', asset.localPath.slice(1)))
      expect(bytes.byteLength).toBe(asset.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256)
    })

    it(`builds a versioned stored URL without transformations for ${asset.id}`, () => {
      const image = new Cloudinary({
        cloud: { cloudName: 'demo' },
        url: { secure: true, analytics: false },
      })
        .image(`${asset.publicId}.${asset.format}`)
        .setVersion(asset.version)
      expect(image.toURL()).toBe(
        `https://res.cloudinary.com/demo/image/upload/v${asset.version}/${asset.publicId}.${asset.format}`,
      )
    })
  }
})
