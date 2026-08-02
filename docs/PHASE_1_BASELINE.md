# Phase 1 Baseline: Mobile Vertical Slice

## Objective

Create one dependable production baseline for Crowne Legacy Mobile before adding cloud services, shared-world systems, or additional chapters.

## Verified local package

The current verified package contains:

- Mobile PWA entry point and responsive interface
- Story and decision engine
- Tay Crowne C-9 checkpoint
- Suggested move for every decision scene
- Five persistent Legacy Decisions
- Visible d20 checks
- Local autosave and offline service worker
- Accessibility controls
- One-time 50-Crown settlement gate
- Canon registry and additive cast policy
- Automated gameplay tests
- Android verification captures

## Local verification result

On August 2, 2026:

- `npm run check` passed.
- `npm test` passed 7 of 7 tests.
- Duplicate payment protection passed.
- Suggested-choice coverage passed.
- Story branch integrity passed.
- Canon protection passed.

## Phase 1 remaining work

- Import every verified source and asset file into the official GitHub repository.
- Confirm the GitHub copy matches the verified package.
- Run GitHub Actions successfully from a clean checkout.
- Verify the game in an Android-sized browser viewport.
- Tag the stable baseline as `v0.1.0`.

No Phase 2 backend work begins until these items are complete.
