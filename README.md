# Crowne Legacy Mobile

This is an Android-first, installable vertical slice of **Crowne Legacy: The Blackout Contract**. It runs as a dependency-free progressive web app and continues directly from the existing Questforge C-9 checkpoint or replays the complete contract chain.

## Play locally

1. Install Node.js if it is not already available.
2. Open a terminal in this folder.
3. Run `npm run serve`.
4. Open `http://localhost:4173` in Chrome.

The included server has no external dependencies. A phone on the same network can open the computer's local IP address on port 4173 for immediate play.

For a true Android installation with offline service-worker support, place this folder on an HTTPS static host or run the server directly on the Android device through a local development environment. Then open the HTTPS address or `localhost:4173` in Android Chrome and select **Install app** or **Add to Home screen**.

## What is playable

- Play as Tay Crowne with the exact saved HP, XP, clocks, evidence, and pending contract reward.
- Complete Accept → Worksite → Completion → Approval → Payment → Close.
- See **Tay's Suggested Move** for every decision scene, including reasoning and a real tradeoff.
- Resolve open d20 checks with skill modifier, DC, advantage, natural roll, total, and outcome visible before commitment.
- Make five persistent Legacy Decisions that alter trust, safety, evidence, political heat, control, finances, later context, and the ending report.
- Credit the verified 50-Crown payment exactly once. Duplicate payment attempts are blocked.
- Autosave locally, play offline, toggle motion, sound, haptics, large text, and high contrast.

## Canon protection

`canon-registry.json` is explicitly a partial chapter index, not the full Crowne Legacy roster. It is additive only. Tay, Dawn, Kai, and all other user-created Crowne Legacy characters must never be renamed, replaced, or assigned unverified portraits. Nia Vale is a mission-specific supporting NPC and does not replace a Crowne Legacy character.

## Verification

- `npm test` runs the story, rules, moral-decision, cast-policy, and one-time-payment tests.
- `npm run check` parses every JavaScript module and service worker.

## Scope

This package is a polished playable vertical slice. A full commercial AAA mobile release still requires the complete canon character bible, production character and environment art, animation, voice, a native runtime or store wrapper, backend and cloud saves, device-lab QA, security review, content expansion, localization, ratings, and store certification. See `AAA_ROADMAP.md` for the production path.
