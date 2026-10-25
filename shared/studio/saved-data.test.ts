import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Cloudinary } from '@cloudinary/url-gen'
import { describe, expect, it } from 'vitest'
import {
  savedDemo,
  savedOutputs,
  savedReference,
  getSavedOutput,
  storedOutputUrl,
  type SavedSceneId,
} from './saved-data'

describe('actual saved generation fixtures', () => {
  it('contains the two distinct approved scenes and no implicit approval', () => {
    expect(savedOutputs.map((output) => output.sceneId)).toEqual(['marble', 'botanical'])
    expect(savedDemo.source.id).toBe(savedReference.id)
    for (const output of savedOutputs) {
      expect(output).not.toHaveProperty('review')
      expect(output).not.toHaveProperty('score')
      expect(output.generation.modelUsed).toBe('flux-2-klein-9b-edit')
      expect(getSavedOutput(output.sceneId)).toBe(output)
    }
    expect(() => getSavedOutput('warm-studio' as SavedSceneId)).toThrow()
  })

  for (const asset of [savedReference, ...savedOutputs]) {
    it(`matches the saved bytes and SHA-256 for ${asset.id}`, () => {
      const bytes = readFileSync(resolve(process.cwd(), 'public', asset.localPath.slice(1)))
      expect(bytes.length).toBe(asset.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256)
      if (asset.format === 'png') {
        expect(bytes.subarray(1, 4).toString()).toBe('PNG')
        expect(bytes.readUInt32BE(16)).toBe(asset.width)
        expect(bytes.readUInt32BE(20)).toBe(asset.height)
      }
    })
  }

  for (const output of savedOutputs) {
    it(`delivers ${output.sceneId} from the recorded cloud without a transformation`, () => {
      const image = new Cloudinary({
        cloud: { cloudName: output.cloudName },
        url: { secure: true, analytics: false },
      })
        .image(`${output.publicId}.${output.format}`)
        .setVersion(output.version)
      expect(image.toURL()).toBe(storedOutputUrl(output))
      expect(output.verification).toMatchObject({ adminReadback: true, deliveryDownloaded: true })
    })
  }
})
