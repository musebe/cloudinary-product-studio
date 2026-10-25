# Build log

## October 25, 2026: foundation

Created `cloudinary-product-studio` inside `Desktop/Articles` using the official minimal Nuxt generator. The registry reports Nuxt 4.6.2 and Vue 3.5.44. Installed and read the Vue best-practices/testing skills, including the required reactivity, SFC, data-flow, and composable references.

The build starts with a saved example comparison and bounded scene planning. Paid generation, analysis, uploads, and account mutations remain disabled. Existing Cloudinary examples will be explicitly identified; no generated result or consistency score is fabricated.

The Cloudinary documentation confirms that generative background replacement and reference-guided Image Generation are different APIs. The former has special costs and a Beta limitation. Live capability and budget checks are a separate checkpoint.

## October 25, 2026: saved comparison and scene planning

Implemented the first usable slice:

- Packaged the published Cloudinary teapot photograph and watercolor result. Recorded their source URL, prompt, dimensions, byte counts, and SHA-256 hashes; tests verify the packaged files. The watercolor is explicitly labeled as a documentation example, not this app's generation and not a background-only edit.
- Added three fixed scene recipes. Previewing a recipe creates only a validated local plan: reference, prompt, explicit edit model, seed, and zero provider calls. There is no generation operation.
- Added native review controls with shape, color, and fine-detail checks. Approval requires all three checks; rejection does not. Editing checks, resetting, or changing image identity invalidates the current review. Refreshing clears it.
- Added evidence JSON download and optional Cloudinary Vue SDK delivery. Remote bytes are not verified, so selecting remote delivery resets and disables review/download until packaged files are selected again. A Cloudinary URL version is not an immutable historical snapshot.
- Kept all credentials in private runtime configuration. Copied only the Cloudinary credential set from the existing media-pipeline project's local environment at the user's request, without printing values or changing the source. Created a fresh app-specific session secret. The local environment remains ignored by Git.
- Added truthful health reporting and a generation placeholder that always returns HTTP 501 without contacting a provider. A supplied key is not reported as verified.

### Verification and fixes

- 105 unit/component tests pass, including strict request contracts, review identity invalidation, component behavior, file hashes, and stored-asset URL construction.
- 12 Playwright checks pass across desktop and mobile, including the remote-review restriction and recovery to saved files. Browser builds use an isolated directory so they do not disturb the regular development server.
- Linting and type checking pass. The production build succeeds.
- Inspected full-page desktop and mobile screenshots, checked image loading, and tested layout widths from 320 to 1,440 pixels.
- Browser tests intercept remote delivery; initial saved-mode loading makes no external requests. No user-account upload, AI analysis, transformation, or generation was performed.

Testing exposed and fixed an SDK SSR interoperability issue (`@cloudinary/vue` and `@cloudinary/html` require bundling), lost clicks before hydration (controls now wait for mount), ambiguous identity joining (separate synchronous field watchers), and production shared-module resolution (use Nuxt's `#shared` alias). The file-integrity test uses Node paths so Vite does not rewrite fixture URLs.

### Remaining work

Signed product ingestion and source readback; bounded live image editing and task polling; durable evidence/review storage; saved outputs from this app; measured product-specific findings. These are not implemented by the saved-demo checkpoint.

## October 25, 2026: two approved saved generations

The user explicitly approved generating and saving two examples for the public demo. The MCP connection points to a different Cloudinary environment, so the operator used this project's private credentials for `demo-article-projects` instead. No changes were made to the other environment.

`scripts/generate-saved-demos.mjs` is a local-only authoring command with a durable two-request ledger and exclusive lock. It reserves each request before sending it, never retries generation automatically, resumes task polling without a new generation request, and refuses execution on deployed servers. It is not imported by any web route or build hook.

| Scene           | Actual model           | Delivered size  | Image Generation credits | Persistence                                 |
| --------------- | ---------------------- | --------------- | -----------------------: | ------------------------------------------- |
| Quiet marble    | `flux-2-klein-9b-edit` | 1024 × 1024 PNG |                        3 | Managed Cloudinary asset plus packaged copy |
| Botanical light | `flux-2-klein-9b-edit` | 1024 × 1024 PNG |                        3 | Managed Cloudinary asset plus packaged copy |

The add-on reported 50 credits before this run and 44 remaining afterward. These are Image Generation add-on credits, not general media-delivery credits. Exactly two generation requests succeeded; no replacement or third image was requested. Both results were read back through the authenticated Admin API, downloaded without transformations, checked against the persisted dimensions/byte counts, and hashed. The resulting public evidence is in `shared/studio/saved-manifest.json`; the local ledger under `.data` is not committed.

The images change the setting as requested, but product details still need human inspection. In particular, compare the dot pattern, handle shape, proportions, and surface finish; a reference image does not guarantee exact product identity. No visual pass score or approval was assigned automatically.

An initial Node import-resolution error occurred before the script reached any provider operation. Explicit TypeScript import extensions fixed it. The two-request ledger was created only by the subsequent successful run.

## October 25, 2026: saved-only public experience

The home page now defaults to Quiet marble and offers exactly two saved scene choices. The documentation watercolor is no longer an active result. Selecting either scene loads its packaged PNG without a provider request, and the comparison shows the selected output's actual generation inputs and verification evidence.

Reviews and evidence downloads are bound to the selected saved asset and its SHA-256. Switching images clears the previous decision; remote Cloudinary delivery still disables review until the hash-checked packaged copy is selected. The public generation endpoint returns HTTP 403 regardless of reserved environment flags. The operator authoring script is never called by application routes, install hooks, build hooks, or page loading.

Verification: 221 unit/component checks and 12 desktop/mobile browser checks pass. Formatting, linting, type checking, and the production build pass. Browser tests intercept remote delivery and prove initial loading and scene switching do not issue external generation requests. Both full-page desktop and mobile layouts were visually inspected. Node's native JSON loader required an explicit `with { type: 'json' }` import attribute for the browser test runner; no provider call was involved in that test-runner fix.

A production-server smoke test runs without Cloudinary credentials: both packaged generated images return HTTP 200 with matching hashes, scene switching works, and the public generation endpoint returns HTTP 403. No external browser request is required. The client bundle was scanned against the local secret values and contained none.

Remaining optional work from the original broad plan is outside the current saved-demo scope: user-upload ingestion, a general-purpose live editor, durable server-side human approvals, and a larger independent consistency benchmark. The article has not been written yet.

## October 25, 2026: GitHub and Vercel release

Updated the README first with local setup, saved-demo behavior, review limitations, and deployment settings. Commit `5912b0b` was pushed to the new public [GitHub repository](https://github.com/musebe/cloudinary-product-studio), then deployed to [Product Studio on Vercel](https://cloudinary-product-studio.vercel.app/). The Vercel project is connected to the repository for subsequent pushes. The build uses Nuxt's Vercel preset and Node.js 24.

No Cloudinary credentials were added to Vercel. CLI upload verification confirmed that `.env.local`, the private authoring ledger, and local build/test artifacts were excluded. Install and build did not run the authoring script or request any new generation.

Release verification:

- Formatting, linting, type checking, 221 unit/component tests, and the production build pass. A standalone browser rerun passes all 12 desktop/mobile checks after two navigation timeouts during concurrent local checks.
- Anonymous requests to the public production domain return HTTP 200 for the home page, health endpoint, source image, and both generated images. The three delivered image byte counts and SHA-256 hashes match the committed manifest.
- Health reports two saved examples, no supplied Cloudinary credentials, and live generation disabled. `POST /api/generate` returns HTTP 403 with a JSON response.
- Browser checks against the public production domain pass on desktop and mobile: default marble image, botanical selection, review invalidation, candidate-bound evidence download, and layout widths from 320 to 1,440 pixels. No external browser requests, POST requests, or uncaught page errors occur during saved-demo interaction.

Deployment is complete for the saved-demo scope. Article drafting, current-source review, and editorial/design handoff messages are the next checkpoint; no article publication-readiness claim is made here.
