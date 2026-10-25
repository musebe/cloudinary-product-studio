import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { candidateAsset, referenceAsset } from '../../shared/studio/example'

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
  expect(evidence.provenance.origin).toBe('published-cloudinary-documentation')
  expect(evidence).not.toHaveProperty('score')
  await page.getByRole('checkbox', { name: 'Product color' }).uncheck()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
  await expect(accept).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'Shape and proportions' })).not.toBeChecked()
  await expect(page.getByRole('status')).toHaveText('Not reviewed')
})

test('previews a bounded scene request without generating or relabeling the sample', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST') requests.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('radio', { name: 'Warm studio' }).check()
  await page.getByRole('button', { name: 'Preview scene request' }).click()
  await expect(page.getByRole('heading', { name: 'Warm studio', exact: true })).toBeVisible()
  await expect(page.getByText('Not generated', { exact: true })).toBeVisible()
  await expect(page.getByText('flux-2-klein-9b-edit', { exact: true })).toBeVisible()
  await expect(page.locator('.request-box')).toContainText('reference image [1]')
  await expect(page.locator('.plan-facts')).toContainText('Provider calls0')
  await expect(page.getByRole('button', { name: 'Accept candidate' })).toBeHidden()
  await page.getByRole('button', { name: 'Back to saved comparison' }).click()
  await expect(page.getByText('Reference-guided watercolor, not a new scene.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Saved comparison', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(requests).toEqual([])
})

test('supports keyboard controls, enlarged comparison, and narrow screens', async ({ page }) => {
  await page.goto('/')
  const marble = page.getByRole('radio', { name: 'Quiet marble' })
  await expect(marble).toBeEnabled()
  await marble.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Warm studio' })).toBeChecked()
  await page.getByRole('button', { name: 'Enlarge image comparison' }).click()
  await expect(page.getByRole('button', { name: 'Enlarge image comparison' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.image-pair')).toHaveClass(/enlarged/)
  await page.getByRole('button', { name: 'Scene plan', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Warm studio', exact: true })).toBeVisible()
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
  expect(deliveryRequests.sort()).toEqual([
    'https://res.cloudinary.com/demo/image/upload/v1784151459/docs/teapot-product.jpg',
    'https://res.cloudinary.com/demo/image/upload/v1790152537/teapot-product/watercolor.png',
  ])
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
    cloudinary: { credentialsVerified: false },
    capabilities: { liveGeneration: false, liveUpload: false, savedComparison: true },
    providerCalls: 0,
  })
  const generation = await request.post('/api/generate', { data: { sceneId: 'marble' } })
  expect(generation.status()).toBe(501)
  expect(generation.headers()['content-type']).toContain('application/json')
  expect((await generation.json()).statusMessage).toContain('No provider call was made')
})
