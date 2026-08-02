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

- [ ] Define properties and businesses.
- [ ] Define inventory and vehicles.
- [ ] Define missions and consequence chains.
- [ ] Define relationships and factions.
- [ ] Define reputation, political heat, and world clocks.
- [ ] Define scheduled world events.

## Item 3: Cross-game command protocol

- [ ] Define command envelopes from mobile and main-game clients.
- [ ] Define accepted, rejected, duplicate, and conflict responses.
- [ ] Define authority rules for economy and irreversible decisions.
- [ ] Define replay-safe receipts and audit metadata.

## Item 4: Contract fixtures and compatibility

- [ ] Add canonical example snapshots.
- [ ] Add mobile-to-network round-trip fixtures.
- [ ] Add future main-game client fixtures.
- [ ] Add compatibility and tamper-detection tests.

## Phase 2 exit criteria

- [ ] Every core record in `docs/PRODUCTION_PHASES.md` has an executable contract.
- [ ] Both client types can express changes without owning authoritative state.
- [ ] Ledger, reward, canon, and consequence protections are automatically tested.
- [ ] Contract documentation and fixtures are sufficient to build the Phase 3 backend.
