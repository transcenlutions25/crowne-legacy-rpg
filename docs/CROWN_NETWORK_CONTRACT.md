# Crown Network Contract v1

The Crown Network is the shared source-of-truth contract for Crowne Legacy Mobile and the future 3D open-world game. Neither client owns the economy or permanent world state. Both clients produce actions, and the backend accepts or rejects those actions against this contract.

## Core records

- Player identity
- Character states
- Wallet
- Append-only ledger
- Properties
- Businesses
- Inventory
- Vehicles
- Missions
- Consequences
- Relationships
- Factions
- Reputation and political heat
- World clocks
- Scheduled events
- Cross-game action receipts

The executable contract is implemented in `crown-network.js`.

## Versioning

Every snapshot has a numeric `version`. Version 1 is the first shared-world contract. A client must not silently rewrite a snapshot from an unknown future version. Future migrations must be explicit and tested.

## Player and character identity

A player record has one stable ID and references an active character by ID. The referenced character must exist in the character collection. Tay Crowne remains the default active character for the current campaign; the contract supports additional existing Crowne Legacy characters without replacing canon.

## Wallet and ledger integrity

Currency is stored as integer Crowns. Floating-point currency is prohibited.

The ledger is append-only. Every entry records:

- A unique ledger ID
- An idempotency key
- A signed integer amount
- The resulting balance
- Transaction type and description
- The source client
- An ISO timestamp
- Optional metadata

The sum of the ledger must equal the wallet balance, and the balance may never become negative. Validation fails if either value is edited without the other.

## One-time rewards and action receipts

Every economy-changing action must include an idempotency key. The first accepted action creates both a ledger entry and a cross-game action receipt. Repeating the same key returns the original receipt and does not credit or debit the wallet again.

This preserves the verified one-time-payment protection from Crowne Legacy Mobile across both games.

Recommended key shape:

`<system>:<record-id>:<action>`

Examples:

- `mission:blackout-contract:payment`
- `business:crowne-logistics:weekly-payout:2031-W18`
- `vehicle:night-runner:purchase`

## Client names

Initial source-client identifiers:

- `crowne-legacy-mobile`
- `crowne-legacy-main-game`
- `crown-network-backend`

Clients may request changes, but only the backend should authoritatively commit permanent shared-world state after Phase 3.

## Legacy mobile migration

`migrateLegacyGameState` converts the verified version-3 mobile save into Contract v1 while preserving:

- Tay Crowne identity and progression
- Current mission and stage
- Wallet and total earnings
- World reputation axes
- Evidence, flags, decisions, and mission history
- Narrative ledger entries
- Completion state

A migrated opening balance receives its own idempotent migration receipt. Re-running that migration against an authoritative backend must not duplicate the balance.

## Phase 2 boundaries

This contract does not yet provide authentication, remote storage, synchronization, conflict resolution, or a production database. Those belong to Phase 3. Phase 2 establishes the portable records and invariants those systems must enforce.

## Phase 2 typed records and command reference

`crown-domain.js` supplies executable field validators. JSON numbers must be safe integers, never numeric strings, booleans, or null. Empty collections remain valid. IDs are unique within each collection; owned records reference an existing character, businesses reference a property, and scheduled events reference a clock and existing consequences.

| Collection | Required fields beyond ID |
| --- | --- |
| properties | ownerCharacterId, name, status: owned/leased/unavailable |
| businesses | propertyId, ownerCharacterId, name, status: active/paused/closed |
| inventory | ownerCharacterId, itemId, nonnegative quantity |
| vehicles | ownerCharacterId, modelId, status: available/assigned/unavailable |
| missions | campaign, sceneId, stage, status: available/active/completed/failed, updatedAt |
| relationships | fromCharacterId, toCharacterId, integer value |
| factions | name, integer reputation |
| worldClocks | nonnegative value and limit, updatedAt; value cannot exceed limit |
| scheduledEvents | clockId, dueAt, status: scheduled/fired/cancelled, consequenceIds |

Reputation remains the v1 map of integer axes, including politicalHeat. Consequences retain the original mobile shape (`choiceId`, `title`, `immediate`, `future`, `at`), with optional `id` and `parentIds`. Parents must already occur earlier in the collection, preventing missing links and cycles. Fixture-only property/business/vehicle names do not introduce production canon.

### Requests, authority and results

`crown-commands.js` is a pure reference processor, not a server or client integration. Envelope v1 requires `id`, `idempotencyKey`, `playerId`, `characterId`, `snapshotId`, `sourceClient`, `expectedRevision`, `issuedAt`, `type`, and `payload` alongside `version: 1`. Mobile and main-game fixtures demonstrate the same contract.

- `mission.claim-reward` accepts only a mission ID. A trusted authority resolver determines eligibility and the positive integer reward, never the client payload.
- `mission.record-decision` accepts a mission ID and choice ID. A trusted authority resolver supplies the canonical consequence; no generic write/overwrite command is exposed.
- `accepted` records a permitted effect. `rejected` records a well-formed request that cannot be authorized. `conflict` records a stale revision, or reports reused idempotency keys with changed envelopes. `duplicate` returns the exact original receipt with no additional mutation.
- Every persisted receipt, including rejection/stale-revision receipts, increments snapshot `revision`. Old v1 snapshots without this additive field start at zero. Exact replay is checked before stale-revision validation. After a conflict, refresh authoritative state and use a new command ID/key for a revised request.
- Receipt audit metadata includes command ID, source client, canonical request fingerprint, authority receipt time, outcome/reason, revision, and optional ledger-entry link. The fingerprint is a deterministic equality token, **not** a cryptographic signature.
- Repeated mission reward requests under different keys are blocked using mission-payment ledger metadata. Migrated v3 `paymentClaimed` and original v1 narrative payment entries also protect the existing Blackout Contract reward.
- Malformed envelopes and exhausted revisions return rejection without recording a receipt. Legacy ledger receipts cannot prove envelope equality, so reuse through the new command processor returns conflict, never another payment.

A Phase 3 backend MUST authenticate the caller and authorize player/character ownership before calling this function; derive `resolve` and receipt time only from trusted server code; reject arbitrary client snapshots; and atomically persist the snapshot and receipt with revision compare-and-swap. A copied `sourceClient` string is not identity verification. Concurrent requests cannot be made safe by this in-memory helper alone. Content eligibility, anti-cheat, receipt retention and account recovery remain backend work. Client clocks never determine reward eligibility or event execution.

### Compatibility and non-destructive recovery

`tests/fixtures/network-v1-original.json` was produced by the original main-branch migration implementation. It remains readable. New migration results additionally keep a deep copy of the entire version-3 save at `characters[].state.legacySave`, preserving payment/fund flags, pending rewards, stats, settings-independent progress and unknown additive save fields.

`restoreLegacyGameState` retrieves that original archive for explicit recovery; it does **not** project later network mutations into the playable app. Never automatically overwrite a current local save with this archive. Original v1 snapshots that lack a complete archive throw a clear recovery error rather than inventing missing progress. Unknown mobile versions are rejected. Existing local-storage keys and gameplay are unchanged.

Structural validation detects malformed values, duplicate records and broken ledger/receipt links. It does not authenticate an imported snapshot or detect an attacker consistently rewriting all records. Production integrity requires a trusted backend and append-only persistence.

The running PWA imports only `app.js`, `game-engine.js` and `story.js`; these reference-contract modules are not runtime dependencies yet. They therefore are not added to the offline shell. Any future integration must cache the entire new import graph and version the service-worker cache in that same change.
