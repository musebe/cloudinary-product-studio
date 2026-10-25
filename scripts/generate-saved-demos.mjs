// Operator-only, one-time authoring workflow. Never imported by the web server.
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scenePresets } from '../shared/studio/contracts.ts'
import { savedDemoManifestSchema } from '../shared/studio/saved-schema.ts'

const { AbortSignal, fetch } = globalThis
const root = fileURLToPath(new URL('../', import.meta.url))
const ledgerPath = resolve(root, '.data/approved-generation-run.json')
const manifestPath = resolve(root, 'shared/studio/saved-manifest.json')
const referenceUrl =
  'https://res.cloudinary.com/demo/image/upload/v1784151459/docs/teapot-product.jpg'
const modelId = 'flux-2-klein-9b-edit'
const selectedScenes = ['marble', 'botanical']
const maxBytes = 10_485_760

export function reserveAttempt(ledger, sceneId, publicId) {
  if (ledger.maxRequests !== 2 || !Array.isArray(ledger.attempts) || ledger.attempts.length >= 2) {
    throw new Error('The two-request generation budget is closed.')
  }
  if (
    !selectedScenes.includes(sceneId) ||
    ledger.attempts.some((item) => item.sceneId === sceneId)
  ) {
    throw new Error('This scene is not eligible for another generation request.')
  }
  return {
    ...ledger,
    attempts: [
      ...ledger.attempts,
      { sceneId, publicId, status: 'reserved', reservedAt: new Date().toISOString() },
    ],
  }
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' })
  await rename(temporary, path)
}

async function downloadPng(url, cloudName) {
  const parsed = new URL(url)
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'res.cloudinary.com' ||
    !parsed.pathname.startsWith(`/${cloudName}/image/upload/`) ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error('The provider returned an unexpected delivery URL.')
  }
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) })
  if (!response.ok || !response.body) throw new Error('The saved image could not be downloaded.')
  const chunks = []
  let bytes = 0
  for await (const chunk of response.body) {
    bytes += chunk.byteLength
    if (bytes > maxBytes) {
      await response.body.cancel().catch(() => {})
      throw new Error('Generated image exceeds the saved-demo size limit.')
    }
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  if (
    buffer.length < 24 ||
    !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  )
    throw new Error('The generated file is not a PNG image.')
  return {
    buffer,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    sha256: createHash('sha256').update(buffer).digest('hex'),
  }
}

export async function runApprovedGeneration() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production')
    throw new Error('Generation authoring is disabled on deployed servers.')
  const cloudName = process.env.NUXT_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.NUXT_CLOUDINARY_API_KEY
  const apiSecret = process.env.NUXT_CLOUDINARY_API_SECRET
  if (!cloudName || !/^[a-zA-Z0-9_-]+$/.test(cloudName) || !apiKey || !apiSecret)
    throw new Error('Project Cloudinary credentials are required.')
  const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  const secrets = [apiKey, apiSecret, process.env.NUXT_DEMO_SESSION_SECRET, authorization].filter(
    Boolean,
  )
  const redact = (message) =>
    secrets
      .reduce((text, secret) => text.split(secret).join('[redacted]'), String(message))
      .slice(0, 500)
  const request = async (url, method = 'GET', body) => {
    const response = await fetch(url, {
      method,
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: 'error',
      signal: AbortSignal.timeout(35_000),
    })
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(
        `Cloudinary returned non-JSON HTTP ${response.status}. No generation retry was attempted.`,
      )
    }
    if (!response.ok)
      throw new Error(
        `Cloudinary HTTP ${response.status}: ${redact(data.error?.message || 'request failed')}`,
      )
    if (data.notices?.length)
      console.log(
        JSON.stringify({
          notices: data.notices.map((item) => ({
            severity: item.severity,
            text: redact(item.text),
          })),
        }),
      )
    return data
  }

  await mkdir(resolve(root, '.data'), { recursive: true })
  const lock = await open(resolve(root, '.data/generation.lock'), 'wx', 0o600).catch(() => {
    throw new Error(
      'Another authoring run is active, or a previous interrupted run needs inspection. No call was made.',
    )
  })
  let ledger
  try {
    try {
      ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
    } catch (error) {
      if (error.code !== 'ENOENT')
        throw new Error('Generation ledger cannot be read. No call was made.', { cause: error })
      ledger = {
        schemaVersion: 'product-studio.authoring.v1',
        maxRequests: 2,
        cloudName,
        runId: randomUUID(),
        authorizedOn: '2026-10-25',
        attempts: [],
      }
      await atomicJson(ledgerPath, ledger)
    }
    if (ledger.cloudName !== cloudName || ledger.maxRequests !== 2 || ledger.attempts.length > 2)
      throw new Error('Generation ledger does not match this approved run.')
    for (const sceneId of selectedScenes) {
      const scene = scenePresets.find((item) => item.id === sceneId)
      let attempt = ledger.attempts.find((item) => item.sceneId === sceneId)
      if (!attempt) {
        const publicId = `product-studio/${ledger.runId}/${sceneId}`
        ledger = reserveAttempt(ledger, sceneId, publicId)
        await atomicJson(ledgerPath, ledger)
        attempt = ledger.attempts.at(-1)
        console.log(
          JSON.stringify({
            scene: sceneId,
            operation: 'image_to_image',
            request: ledger.attempts.length,
            maxRequests: 2,
            model: modelId,
            resolution: '1K',
          }),
        )
        const result = await request(
          `https://api.cloudinary.com/v2/generate/${cloudName}/image_to_image`,
          'POST',
          {
            prompt: scene.prompt,
            reference_images: [{ source_type: 'url', url: referenceUrl }],
            model: { id: modelId },
            image_size: { aspect_ratio: '1:1', resolution: '1K' },
            format: 'png',
            seed: scene.seed,
            async: true,
            target: { target_type: 'managed_asset', public_id: publicId },
          },
        )
        attempt.requestId = result.request_id
        attempt.taskId = result.data?.task_id
        attempt.result = result.data?.assets || result.data?.result?.assets
        attempt.limits = result.limits || result.data?.limits
        attempt.status = attempt.result ? 'generated' : 'pending'
        await atomicJson(ledgerPath, ledger)
      }
      if (attempt.status === 'reserved')
        throw new Error(
          'A previous request has an uncertain outcome. Inspect it instead of generating again.',
        )
      if (!attempt.result) {
        if (!/^[a-zA-Z0-9_-]{1,256}$/.test(attempt.taskId || ''))
          throw new Error('No valid generation task ID. No additional generation was attempted.')
        for (let poll = 0; poll < 30 && !attempt.result; poll++) {
          const result = await request(
            `https://api.cloudinary.com/v2/generate/${cloudName}/tasks/${encodeURIComponent(attempt.taskId)}`,
          )
          attempt.status = result.data?.status
          attempt.limits = result.data?.limits || result.limits || attempt.limits
          if (attempt.status === 'failed') {
            await atomicJson(ledgerPath, ledger)
            throw new Error(
              'The generation task failed. No replacement image will be requested automatically.',
            )
          }
          attempt.result = result.data?.result?.assets
          await atomicJson(ledgerPath, ledger)
          if (!attempt.result) await new Promise((done) => setTimeout(done, 4000))
        }
      }
      if (!attempt.result || attempt.result.length !== 1)
        throw new Error(
          'Generation is still pending or returned an unexpected number of images. Resume this ledger; do not create a replacement request.',
        )
      if (attempt.output) continue
      const generated = attempt.result[0]
      const storage = generated.storage
      if (
        storage?.storage_type !== 'managed_asset' ||
        storage.public_id !== attempt.publicId ||
        storage.type !== 'upload' ||
        storage.resource_type !== 'image'
      )
        throw new Error('Cloudinary did not return the expected permanently stored image.')
      const lookupPath = storage.asset_id
        ? `resources/${encodeURIComponent(storage.asset_id)}`
        : `resources/image/upload/${encodeURIComponent(storage.public_id)}`
      const asset = await request(`https://api.cloudinary.com/v1_1/${cloudName}/${lookupPath}`)
      if (
        (storage.asset_id && asset.asset_id !== storage.asset_id) ||
        asset.public_id !== attempt.publicId ||
        asset.version !== storage.version ||
        asset.resource_type !== 'image' ||
        asset.type !== 'upload' ||
        asset.format !== 'png'
      )
        throw new Error('Admin API readback did not match the generated image.')
      const file = await downloadPng(asset.secure_url, cloudName)
      if (
        file.width !== asset.width ||
        file.height !== asset.height ||
        file.buffer.length !== asset.bytes ||
        file.width > 2048 ||
        file.height > 2048
      )
        throw new Error('Downloaded image does not match the persisted metadata.')
      const localPath = `/demo/generated/${sceneId}.png`
      await mkdir(resolve(root, 'public/demo/generated'), { recursive: true })
      const localFile = resolve(root, `public${localPath}`)
      try {
        await writeFile(localFile, file.buffer, { flag: 'wx' })
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        const existing = await readFile(localFile)
        if (createHash('sha256').update(existing).digest('hex') !== file.sha256)
          throw new Error(
            'An existing saved file differs from the verified provider image; it was not overwritten.',
            { cause: error },
          )
      }
      attempt.output = {
        id: `product-studio-${sceneId}-${asset.asset_id}`,
        sceneId,
        name: scene.name,
        cloudName,
        publicId: asset.public_id,
        assetId: asset.asset_id,
        version: asset.version,
        format: 'png',
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        sha256: file.sha256,
        localPath,
        alt: `AI-generated ${scene.name.toLowerCase()} scene featuring the reference white teapot with terracotta details.`,
        generation: {
          operation: 'image_to_image',
          modelRequested: modelId,
          modelUsed: generated.model?.id,
          prompt: scene.prompt,
          seedRequested: scene.seed,
          seedUsed: generated.seed ?? null,
          requestId: attempt.requestId,
          createdAt: generated.created_at || asset.created_at,
          referenceUrl,
        },
        verification: {
          adminReadback: true,
          deliveryDownloaded: true,
          verifiedAt: new Date().toISOString(),
        },
      }
      attempt.status = 'saved-and-verified'
      await atomicJson(ledgerPath, ledger)
      console.log(
        JSON.stringify({
          scene: sceneId,
          status: attempt.status,
          publicId: asset.public_id,
          width: asset.width,
          height: asset.height,
          limits: attempt.limits,
        }),
      )
    }
    const sourceBytes = await readFile(resolve(root, 'public/demo/teapot-reference.jpg'))
    const manifest = savedDemoManifestSchema.parse({
      schemaVersion: 'product-studio.saved.v1',
      recordedOn: '2026-10-25',
      source: {
        id: 'cloudinary-docs-teapot-reference',
        cloudName: 'demo',
        publicId: 'docs/teapot-product',
        version: 1784151459,
        format: 'jpg',
        localPath: '/demo/teapot-reference.jpg',
        width: 1920,
        height: 1314,
        bytes: sourceBytes.length,
        sha256: createHash('sha256').update(sourceBytes).digest('hex'),
        alt: 'Product photograph of a white ceramic teapot with terracotta dots, lid, spout, and handle.',
      },
      outputs: ledger.attempts.map((item) => item.output),
    })
    await atomicJson(manifestPath, manifest)
    console.log(
      JSON.stringify({
        savedExamples: manifest.outputs.length,
        generationRequests: ledger.attempts.length,
        publicGeneration: false,
        manifest: 'shared/studio/saved-manifest.json',
      }),
    )
  } finally {
    await lock.close()
    const { unlink } = await import('node:fs/promises')
    await unlink(resolve(root, '.data/generation.lock'))
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--run-approved-two') {
    console.error(
      'Requires --run-approved-two. This authoring command spends the approved two-image budget, not a public API.',
    )
    process.exitCode = 1
  } else {
    runApprovedGeneration().catch((error) => {
      console.error(
        error instanceof Error
          ? error.message
          : 'Generation stopped. Inspect the local ledger before any retry.',
      )
      process.exitCode = 1
    })
  }
}
