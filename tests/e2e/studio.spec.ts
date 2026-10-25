import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  savedOutputs,
  savedReference as referenceAsset,
  storedOutputUrl,
} from '../../shared/studio/saved-data'

const candidateAsset = savedOutputs[0]!

test('loads a working saved comparison without external requests', async ({ page }) => {
  const externalRequests: string[] = []
  const mutations: string[] = []
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.method() === 'POST') mutations.push(request.url())
  })
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      externalRequests.push(route.request().url())
      await route.abort()
    } else {
      await route.continue()
    }
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('New scene. Same product.')
  await expect(page.getByRole('heading', { name: 'Look closer before you accept.' })).toBeVisible()
  await expect(page.locator('.image-pair img')).toHaveCount(2)
  for (const image of await page.locator('img').all()) {
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true)
  }
  await expect(page.getByRole('button', { name: 'Accept candidate' })).toBeDisabled()
  expect(externalRequests).toEqual([])
  expect(mutations).toEqual([])
  expect(errors).toEqual([])
})

test('binds a local review to the example, invalidates edits, and clears on reload', async ({
  page,
}) => {
  await page.goto('/')
  const accept = page.getByRole('button', { name: 'Accept candidate' })
  await page.getByRole('button', { name: 'Needs changes', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Changes needed')
  await page.getByRole('checkbox', { name: 'Shape and proportions' }).check()
  await page.getByRole('checkbox', { name: 'Product color' }).check()
  await expect(accept).toBeDisabled()
  await page.getByRole('checkbox', { name: 'Finish and details' }).check()
  await accept.click()
  await expect(page.getByRole('status')).toHaveText('Accepted in this review')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download evidence' }).click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const evidence = JSON.parse(await readFile(downloadPath!, 'utf8'))
  expect(evidence.authority).toBe('browser-only-attestation')
  expect(evidence.review).toMatchObject({
    referenceId: referenceAsset.id,
    candidateId: candidateAsset.id,
    candidateSha256: candidateAsset.sha256,
    decision: 'approved',
    checks: { shape: true, color: true, details: true },
  })
  expect(evidence.provenance.origin).toBe('generated-for-this-project')
  expect(evidence.schemaVersion).toBe('product-studio.saved-review.v1')
  expect(evidence.candidate.verification.adminReadback).toBe(true)
  expect(evidence.candidate.generation.modelUsed).toBe('flux-2-klein-9b-edit')
  expect(evidence).not.toHaveProperty('score')
  await page.getByRole('checkbox', { name: 'Product color' }).uncheck()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
  await expect(accept).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'Shape and proportions' })).not.toBeChecked()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
})

test('switches between exactly two saved scenes without generating or inheriting a review', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST') requests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('radio')).toHaveCount(2)
  await expect(page.locator('.image-pair img').nth(1)).toHaveAttribute(
    'src',
    '/demo/generated/marble.png',
  )
  await page.getByRole('checkbox', { name: 'Shape and proportions' }).check()
  await page.getByRole('button', { name: 'Needs changes', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Changes needed')
  await page.getByRole('radio', { name: 'Botanical light' }).check()
  await expect(page.locator('.image-pair img').nth(1)).toHaveAttribute(
    'src',
    '/demo/generated/botanical.png',
  )
  await expect(page.getByRole('checkbox', { name: 'Shape and proportions' })).not.toBeChecked()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
  await page.getByRole('button', { name: 'Needs changes', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download evidence' }).click()
  const download = await downloadPromise
  const evidence = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(evidence.candidate.id).toBe(savedOutputs[1]!.id)
  expect(evidence.review.candidateSha256).toBe(savedOutputs[1]!.sha256)
  expect(evidence.review.decision).toBe('rejected')
  await page.getByRole('radio', { name: 'Quiet marble' }).check()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
  await expect(page.getByRole('button', { name: 'Accept candidate' })).toBeDisabled()
  expect(requests).toEqual([])
})

test('supports keyboard controls, enlarged comparison, and narrow screens', async ({ page }) => {
  await page.goto('/')
  const marble = page.getByRole('radio', { name: 'Quiet marble' })
  await expect(marble).toBeEnabled()
  await marble.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Botanical light' })).toBeChecked()
  await page.getByRole('button', { name: 'Enlarge image comparison' }).click()
  await expect(page.getByRole('button', { name: 'Enlarge image comparison' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.image-pair')).toHaveClass(/enlarged/)
  await expect(page.locator('.image-pair img').nth(1)).toHaveAttribute(
    'src',
    '/demo/generated/botanical.png',
  )
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
})

test('Cloudinary Vue delivery uses only stored example URLs and falls back on failure', async ({
  page,
}) => {
  const deliveryRequests: string[] = []
  await page.route('https://res.cloudinary.com/**', async (route) => {
    deliveryRequests.push(route.request().url())
    await route.abort()
  })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Use Cloudinary delivery' }).check()
  await expect(page.getByText('Showing saved copy')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Download evidence' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Needs changes', exact: true })).toBeDisabled()
  await expect(page.getByText('Saved files required', { exact: true })).toBeVisible()
  expect(deliveryRequests.sort()).toEqual(
    [
      'https://res.cloudinary.com/demo/image/upload/v1784151459/docs/teapot-product.jpg',
      storedOutputUrl(candidateAsset),
    ].sort(),
  )
  for (const image of await page.locator('.image-pair img').all()) {
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true)
  }
  await page.getByRole('checkbox', { name: 'Use Cloudinary delivery' }).uncheck()
  await expect(page.getByRole('button', { name: 'Download evidence' })).toBeEnabled()
  await expect(page.getByRole('checkbox', { name: 'Shape and proportions' })).not.toBeChecked()
})

test('health is truthful and generation is fail-closed', async ({ request }) => {
  const health = await request.get('/api/health')
  expect(health.ok()).toBe(true)
  expect(health.headers()['cache-control']).toBe('private, no-store')
  expect(await health.json()).toMatchObject({
    status: 'ok',
    mode: 'saved-generated-scenes',
    savedExamples: 2,
    generationRequestsInSavedRun: 2,
    cloudinary: { credentialsVerified: false },
    capabilities: { liveGeneration: false, liveUpload: false, savedComparison: true },
    providerCalls: 0,
  })
  const generation = await request.post('/api/generate', { data: { sceneId: 'marble' } })
  expect(generation.status()).toBe(403)
  expect(generation.headers()['content-type']).toContain('application/json')
  expect((await generation.json()).statusMessage).toContain('No provider call was made')
})
