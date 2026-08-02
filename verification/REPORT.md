# Crowne Legacy Mobile Verification

Verified on 2026-08-02 at an emulated Android viewport of 390 × 844 CSS pixels with a 2× device scale factor.

## Passed

- Title screen renders with no horizontal overflow.
- Current Questforge checkpoint loads at C-9 with Tay at 8/10 HP, 50 XP, six evidence files, nine minutes of reserve power, and a 16-minute inspection clock.
- Every decision scene exposes one suggested move with reasoning and a tradeoff.
- Open checks show the natural roll, modifier, DC, total, advantage state, and result before commitment.
- The complete suggested route reaches the ending.
- All five Legacy Decisions persist and alter the ending report.
- The verified payment credits 50 Crowns exactly once.
- The suggested first-fifty allocation produces a 25-Crown operations fund and a 25-Crown resident recovery fund.
- The one-time payment gate displays as locked after settlement.
- Offline reload succeeds after service-worker installation.
- No browser console errors or uncaught page errors were recorded.
- Every visible button has an accessible name.
- Every visible tap target is at least 44 × 44 CSS pixels.
- Every rendered image has alt text, including intentionally empty alt text for decorative crests.

## Repository Android viewport verification

The merged repository build was independently verified through GitHub Actions on 2026-08-02 using headless Chromium with an Android 16 Pixel-class user agent at 412 × 915 CSS pixels and a 2.625× device scale factor.

- Title, game hero, and story-decision views rendered successfully.
- Document and body widths remained exactly 412 CSS pixels on all tested views.
- The viewport metadata and installable web-app manifest were present.
- Touch emulation was active and every visible button measured at least 40 × 40 CSS pixels; the smallest verified target measured 44 pixels high.
- The C-9 scene artwork loaded with a nonzero natural width.
- No console errors, uncaught page errors, or failed network requests occurred.
- GitHub Actions run: `30761568159`.
- Evidence artifact: `crowne-legacy-android-viewport`, artifact ID `8837620544`.
- Artifact digest: `sha256:1c0f475d4f574c9f92c37692bbccb0d1704794e888ca84b6e1a178dda31ed397`.
- Machine-readable results: `android-viewport-report.json`.

## Automated engine checks

Seven Node tests pass for checkpoint fidelity, suggested-choice coverage, branch integrity, five persistent moral decisions, full-route completion, duplicate-payment protection, and additive canon policy.

## Visual captures

- `title-android.webp`
- `c9-android.webp`
- `ending-android.webp`

The repeatable Android workflow also generates title, game-top, and game-story screenshots as a GitHub Actions artifact on every verification run.
