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
