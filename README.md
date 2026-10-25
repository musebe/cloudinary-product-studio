# Product Studio

A focused Vue and Cloudinary demo for reference-led product imagery. Compare a product photograph with two saved AI-generated scenes and record a human review of the product's shape, color, and details.

The two scenes were generated once with Cloudinary, verified through the Admin API, and included in this project. Visitors switch between saved images; they cannot trigger generation charges. Reviews stay local to the page.

[Live demo](https://cloudinary-product-studio.vercel.app/) · [Source code](https://github.com/musebe/cloudinary-product-studio)

Built with Nuxt 4, Vue 3, TypeScript, and the Cloudinary Vue SDK. The public demo does not need a database or Cloudinary credentials.

## Run locally

Use Node.js 24 and pnpm 10:

```bash
git clone https://github.com/musebe/cloudinary-product-studio.git
cd cloudinary-product-studio
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [Product Studio](http://localhost:3004). If `.env.local` already exists, keep it instead of copying the template over it.

The saved demo needs no credentials. The reference and both generated images are included in `public/demo`, so the first load does not contact Cloudinary or generate an image.

## Deploy the saved demo

Import this repository into Vercel using these settings:

| Setting               | Value                            |
| --------------------- | -------------------------------- |
| Framework             | Nuxt.js                          |
| Root directory        | Repository root                  |
| Node.js               | 24.x                             |
| Install command       | `pnpm install --frozen-lockfile` |
| Build command         | `pnpm build`                     |
| Output directory      | Use the framework default        |
| Environment variables | None required for the saved demo |

Do not upload `.env.local`, the private `.data` ledger, or Cloudinary API secrets to Vercel. The committed `vercel.json` configures the framework and commands; `.vercelignore` excludes local credentials and artifacts from CLI uploads. Generation remains blocked on the public API even if a reserved flag is changed.

After deployment, `/api/health` should return `status: "ok"`, `savedExamples: 2`, and `capabilities.liveGeneration: false`. `credentialsSupplied: false` is expected for this saved-only deployment. Check both scene selections, evidence downloads, and the mobile layout. `POST /api/generate` must return HTTP 403.

The [public deployment](https://cloudinary-product-studio.vercel.app/) was verified on October 25, 2026: both saved scenes load, desktop and mobile reviews work, the served image hashes match the manifest, and generation returns HTTP 403. No Cloudinary credentials are configured in Vercel. Pushes to this repository's `main` branch deploy through the connected Vercel project.

Vercel supports Nuxt's server-rendered build with [framework defaults](https://vercel.com/docs/frameworks/full-stack/nuxt). Do not replace `pnpm build` with a static-only export or set the output directory to `.output/public`, because this project includes API routes.

## Try the demo

1. Compare the original teapot photo with **Quiet marble**, which loads by default. Select **Botanical light** to switch to the other saved result.
2. Review the three product checks. **Accept candidate** becomes available only when all three are checked; **Needs changes** is always available.
3. Download the evidence JSON. It contains the source and candidate identities, file hashes, provenance, and the current local review.
4. Open **Generation provenance & request** to inspect the actual model, prompt, seed, asset ID, and file hashes. Use **Enlarge image comparison** to inspect the details.
5. Optionally enable **Use Cloudinary delivery**. This loads the published examples through the Cloudinary Vue SDK, with no transformation chain. A failed request falls back to the packaged files. Switching delivery resets the review; review/download stay disabled until you return to the hash-checked saved files, because remote bytes have not been verified.

Changing the selected scene or any review check clears the current decision. No image is automatically marked as passing. In particular, inspect the dot pattern, handle, proportions, and finish rather than assuming a supplied reference guarantees identity.

## Saved outputs

| Scene           | Model                  | Output          | Verified                                             |
| --------------- | ---------------------- | --------------- | ---------------------------------------------------- |
| Quiet marble    | `flux-2-klein-9b-edit` | 1024 × 1024 PNG | Admin readback, delivered bytes, dimensions, SHA-256 |
| Botanical light | `flux-2-klein-9b-edit` | 1024 × 1024 PNG | Admin readback, delivered bytes, dimensions, SHA-256 |

Exactly two generation requests were made on October 25, 2026. Cloudinary reported 3 Image Generation credits per image, 6 total. The generated assets remain in the Media Library, and packaged copies make the demo usable after deployment without account keys or new generation calls. The manifest is `shared/studio/saved-manifest.json`.

## Configuration

These variables are private Nuxt runtime configuration. Do not use a `NUXT_PUBLIC_` prefix for credentials.

| Variable                     | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `NUXT_CLOUDINARY_CLOUD_NAME` | Product environment for operator-only image authoring                 |
| `NUXT_CLOUDINARY_API_KEY`    | Server-side Cloudinary API authentication                             |
| `NUXT_CLOUDINARY_API_SECRET` | Server-side Cloudinary API secret                                     |
| `NUXT_DEMO_SESSION_SECRET`   | A fresh random secret of at least 32 bytes for future session support |
| `NUXT_ENABLE_LIVE_UPLOADS`   | Reserved; keep `false` until upload support is implemented            |
| `NUXT_ENABLE_GENERATION`     | Keep `false`; the public demo always serves saved images              |

`pnpm dev` explicitly loads `.env.local`. Restart the development server after changing it. The health endpoint reports whether credentials are supplied, not whether the current values have been verified. Historical asset verification is recorded separately in the saved manifest. Reserved flags do not enable public uploads or generation.

## Operator-only authoring

The already-completed authoring command is kept for implementation reference:

```bash
node --env-file=.env.local scripts/generate-saved-demos.mjs --run-approved-two
```

Do not add this command to install, build, startup, or deployment hooks. It uses the Cloudinary Image Generation add-on and spends generation credits. A local ledger under `.data` reserves at most two requests, prevents automatic replacement/retries, and resumes task polling without regenerating. Existing verified files are not overwritten with different bytes. A fresh checkout does not include the private ledger, so running the authoring command there would start a new paid run and requires a new budget approval. It is unnecessary for running or deploying the saved demo.

## Verify

```bash
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

`check` runs formatting, linting, type checking, unit/component tests, and the production build. Browser tests use their own development server on port 3104 and an isolated `.nuxt-e2e` build directory; leave that port available. They do not stop the regular development server.

```bash
curl http://localhost:3004/api/health
```

`POST /api/generate` returns JSON with HTTP 403 and performs no provider operation, including if a reserved environment flag is changed. Browser tests block/mock external image delivery rather than making provider requests.

## Project map

```text
app/
  components/              Reference, scenes, comparison, review, and image rendering
  composables/             Candidate-bound local review state
  utils/                   Evidence download
shared/studio/             Strict contracts, saved manifest, generation evidence
server/api/                Health and blocked public-generation route
scripts/                   Operator-only bounded generation and verification
public/demo/generated/     The two packaged generated scenes
tests/e2e/                 Desktop and mobile browser checks
docs/                      Build brief, verified build log, and article handoff
```

## Boundaries

- A reference and a fixed seed do not guarantee product identity. No automatic consistency score is calculated.
- Reviews are browser-only attestations. Changing a check invalidates the decision; refreshing clears it. They are not durable audit records or a publication gate.
- Selecting a scene loads an existing image, not a generation or transformation URL.
- More generation needs a separately approved budget. Public generation remains disabled.
- No database, paid analysis, background replacement, or image generation is required for the saved demo.

## Example sources

The reference photograph comes from [Cloudinary's Image Generation documentation](https://cloudinary.com/documentation/image_generation_addon#generate_an_image_from_reference_images). The two active scenes were generated for this project, not copied from the documentation. Their original URLs, actual model, prompts, seeds, dimensions, byte counts, verification times, and SHA-256 hashes are recorded in the saved manifest and checked by tests. The earlier watercolor fixture is retained only as a historical documentation example and is not an active demo result. Use your own authorized product assets for a real catalog.

See the [build brief](docs/build-brief.md) for scope and optional future work, and the [build log](docs/build-log.md) for verified progress.
