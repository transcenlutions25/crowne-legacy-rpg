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
