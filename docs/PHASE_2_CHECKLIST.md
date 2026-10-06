# Phase 2 Checklist — Crown Network

## Item 1: Shared contract foundation

- [x] Define a versioned Crown Network snapshot.
- [x] Define stable player and character identity records.
- [x] Define an integer wallet and append-only ledger.
- [x] Define idempotent cross-game action receipts.
- [x] Preserve one-time reward protection.
- [x] Add a migration path from the verified mobile save.
- [x] Add integrity and migration tests.
- [x] Obtain successful GitHub Actions verification.
- [x] Merge the foundation into `main`.

## Item 2: Typed domain records

- [x] Define properties and businesses.
- [x] Define inventory and vehicles.
- [x] Define missions and consequence chains.
- [x] Define relationships and factions.
- [x] Define reputation, political heat, and world clocks.
- [x] Define scheduled world events.

## Item 3: Cross-game command protocol

- [x] Define command envelopes from mobile and main-game clients.
- [x] Define accepted, rejected, duplicate, and conflict responses.
- [x] Define authority rules for economy and irreversible decisions.
- [x] Define replay-safe receipts and audit metadata.

## Item 4: Contract fixtures and compatibility

- [x] Add canonical example snapshots.
- [x] Add mobile-to-network round-trip fixtures.
- [x] Add future main-game client fixtures.
- [x] Add compatibility and tamper-detection tests.

## Phase 2 exit criteria

- [ ] Every core record in `docs/PRODUCTION_PHASES.md` has an executable contract.
- [ ] Both client types can express changes without owning authoritative state.
- [ ] Ledger, reward, canon, and consequence protections are automatically tested.
- [ ] Contract documentation and fixtures are sufficient to build the Phase 3 backend.

Items 2–4 are implemented as reference contracts and fixtures in this change. Phase exit remains pending review and exact-commit CI; this is not a backend deployment. See [the first Android release gates](FIRST_PLAYABLE_RELEASE.md).
