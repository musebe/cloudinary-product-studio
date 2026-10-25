import manifest from './saved-manifest.json' with { type: 'json' }
import { savedDemoManifestSchema, type SavedDemoManifest } from './saved-schema'
import { scenePresets } from './contracts'

export const savedDemo = savedDemoManifestSchema.parse(manifest)
export type SavedOutput = SavedDemoManifest['outputs'][number]
export type SavedSceneId = SavedOutput['sceneId']
export const savedReference = Object.freeze(savedDemo.source)
export const savedOutputs: readonly Readonly<SavedOutput>[] = Object.freeze(
  savedDemo.outputs.map((output) => Object.freeze(output)),
)
export const savedScenes = Object.freeze(
  savedOutputs.map((output) => {
    const preset = scenePresets.find((scene) => scene.id === output.sceneId)!
    return Object.freeze({
      id: output.sceneId,
      name: output.name,
      description: preset.description,
      accent: preset.accent,
    })
  }),
)

export function getSavedOutput(sceneId: SavedSceneId): Readonly<SavedOutput> {
  const output = savedOutputs.find((item) => item.sceneId === sceneId)
  if (!output) throw new Error('This scene has no saved result.')
  return output
}

export function storedOutputUrl(output: Readonly<SavedOutput>) {
  return `https://res.cloudinary.com/${output.cloudName}/image/upload/v${output.version}/${output.publicId}.${output.format}`
}
