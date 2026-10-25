# Build brief

## Goal and proof

Keep one versioned product reference attached to every scene request, compare each candidate with the reference, and record an explicit human consistency review. Cloudinary is responsible for managed image references, generation or background editing, and delivery; application code bounds requests and exposes their evidence.

Working article: **Keep AI Product Images Consistent With Vue and Cloudinary**. Planned deadline: Sunday, October 25, 2026, the fourth October slot; the original Google Docs deadline has not been independently verified.

This is a new project at `Desktop/Articles/cloudinary-product-studio`. It does not change the media-pipeline or visual-evals applications.

## Scope and differentiation

The reader is a JavaScript developer creating product-image variations without treating every prompt as permission to redesign the product. The workflow anchors a source and makes allowed scene changes and protected product attributes explicit.

The previous Visual Evals project compares baseline and candidate experiments. This build focuses on reference-led editing, controlled scene recipes, and side-by-side inspection. It does not claim a general automated image-quality benchmark.

## Stack and component boundaries

- Nuxt 4, Vue 3 Composition API, TypeScript, Cloudinary Vue SDK and URL builder.
- Server-only Cloudinary Node SDK integration in a later checkpoint.
- Zod request/evidence schemas, Vitest and Vue Test Utils, Playwright.
- The page composes the studio. A scene picker owns selection controls; a comparison component owns image rendering; a review component owns attestation controls; a focused composable owns candidate-bound review state.
- Use CSS Grid, mobile-first breakpoints, explicit image dimensions, visible keyboard focus, and touch targets of at least 44 pixels.

## Checkpoints

1. Foundation: project, environment template, source notes, component contracts, and build brief.
2. Usable saved comparison: published Cloudinary reference/candidate examples with honest provenance, controlled scene plans, explicit local review, and downloadable evidence. No account operations.
3. Signed ingestion and source verification: validate image bytes, ownership, asset identity, and version on the server.
4. Bounded Cloudinary editing: generate approved scene variations, handle asynchronous completion, verify stored output and actual delivery, and retain examples for deployed visitors.
5. Persistence and review: server-bound evidence, review tied to the exact output, reload behavior, explicit rejection, and failure states.
6. Evaluation and handoff: measured product-specific checks, responsive and security tests, README, documentation, and short editorial/design handoff.

Commit after each validated checkpoint. A completed first slice is not a claim that the whole build is complete.

## Cost and capability boundaries

Cloudinary generative background replacement is documented as Beta, can be inaccurate, is unavailable in the Asia Pacific data center, and has a special transformation count. Current documentation lists 230 additional transformations per background replacement. No paid API calls are authorized by this brief.

Reference-guided Image Generation is a distinct API with model/add-on requirements. If the implementation selects it, record the actual model, reference inputs, settings, quota, and results. Do not label an Image Generation example as background replacement.

The first scene-plan implementation selects reference-guided Image Generation with the explicit `flux-2-klein-9b-edit` model. This is a planned operation only; account support, actual pricing/quota, and a bounded first test remain unverified. Generative background replacement is an alternative, not the operation demonstrated by the saved watercolor example.

A fixed seed helps reproduce a request; it does not guarantee product identity or protect text. Technical provenance and human visual judgments are separate evidence. Browser reviews are attestations, not legal clearance or production authorization.

## Documentation and verification

Record real operation counts, asset readback, source/candidate hashes, test results, and any failed attempts in `docs/build-log.md`. Do not store credentials or signed private URLs. Keep the app demo-first; no editorial brief panel on the home page.

The article will use descriptive headings, research and official source links, reproducible proof tables, and FAQs after the conclusion. No deployment tutorial section. SEO, AEO, and GEO planning belongs in the short handoff.

## Sources

- [Vue agent skills](https://github.com/vuejs-ai/skills)
- [Nuxt installation](https://nuxt.com/docs/4.x/getting-started/installation)
- [Cloudinary Vue quick start](https://cloudinary.com/documentation/vue_quick_start)
- [Generative background replacement](https://cloudinary.com/documentation/generative_background_replace)
- [Transformation counts](https://cloudinary.com/documentation/transformation_counts)
- [Cloudinary Image Generation](https://cloudinary.com/documentation/image_generation_addon)
