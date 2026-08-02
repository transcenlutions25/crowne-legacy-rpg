# Crowne Legacy Production Phases

Crowne Legacy Mobile is the first playable layer of a larger shared-world game ecosystem. Each phase must be completed and verified before production moves to the next phase.

## Phase 1: Stabilize the Mobile Vertical Slice

Goal: establish one complete, reproducible, tested mobile baseline in the official GitHub repository.

Exit criteria:

- Complete verified source package is present in the repository.
- The game launches locally from a clean checkout.
- `npm run check` passes.
- `npm test` passes all gameplay and canon-protection tests.
- Mobile layout, accessibility controls, autosave, offline mode, suggested choices, moral decisions, and one-time payment protection remain functional.
- The repository contains no duplicate or conflicting game implementations.
- The baseline is tagged as version `v0.1.0` after final verification.

## Phase 2: Define the Crown Network

Goal: create the shared data contract that both Crowne Legacy Mobile and the future main game will use.

Core records:

- Player identity
- Character state
- Wallet and ledger
- Properties and businesses
- Inventory and vehicles
- Missions and consequences
- Relationships and factions
- Reputation and political heat
- World clocks and scheduled events
- Cross-game action receipts

The backend, not either client game, will become the source of truth.

## Phase 3: Accounts and Cloud Saves

Goal: add secure sign-in, cloud save, device recovery, versioned save migration, and conflict-safe synchronization while preserving offline play.

## Phase 4: Persistent Mobile World

Goal: expand the mobile game into a standalone management and narrative game with businesses, crews, properties, communications, family systems, contracts, notifications, and evolving world events.

## Phase 5: Main Game Integration Gateway

Goal: expose a controlled API and game-state bridge for the future 3D open-world game. The main game will read and write the same Crown Network records instead of maintaining a separate economy or save universe.

## Phase 6: Advanced Cross-Game Play

Goal: launch missions, decisions, businesses, surveillance, logistics, communications, investments, crews, and consequences that move between mobile and the main game.

Examples:

- Start a contract on mobile and complete the physical mission in the main game.
- Purchase or manage a business on mobile, then enter it in the 3D world.
- Recruit and assign crew members on mobile who later appear in the main game.
- Receive mobile alerts caused by events that happened in the main game.
- Make strategic mobile decisions that change future dialogue, territory, prices, alliances, and mission access.

## Production Rule

No phase may bypass canon protection, ledger integrity, one-time reward protection, accessibility, or player-visible consequences. New systems must extend the existing Crowne Legacy characters and world rather than replacing them with generic content.
