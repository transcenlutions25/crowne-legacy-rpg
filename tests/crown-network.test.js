import test from "node:test";
import assert from "node:assert/strict";

import { createCurrentCheckpointState } from "../game-engine.js";
import {
  CROWN_NETWORK_RECORDS,
  applyLedgerTransaction,
  createCrownNetworkSnapshot,
  migrateLegacyGameState,
  validateCrownNetworkSnapshot
} from "../crown-network.js";

test("Crown Network snapshot includes every shared-world core record", () => {
  const snapshot = createCrownNetworkSnapshot();
  for (const key of CROWN_NETWORK_RECORDS) assert.ok(key in snapshot, `missing ${key}`);
  assert.equal(snapshot.player.activeCharacterId, "tay-crowne");
  assert.equal(snapshot.characters[0].name, "Tay Crowne");
  assert.deepEqual(validateCrownNetworkSnapshot(snapshot), { valid: true, errors: [] });
});

test("a cross-game wallet credit creates one ledger entry and one receipt", () => {
  const initial = createCrownNetworkSnapshot();
  const first = applyLedgerTransaction(initial, {
    idempotencyKey: "mission:blackout-contract:payment",
    amount: 50,
    type: "mission-payment",
    description: "Blackout Contract payment",
    sourceClient: "crowne-legacy-mobile"
  });

  assert.equal(first.applied, true);
  assert.equal(first.snapshot.wallet.balance, 50);
  assert.equal(first.snapshot.wallet.totalEarned, 50);
  assert.equal(first.snapshot.ledger.length, 1);
  assert.equal(first.snapshot.actionReceipts.length, 1);
  assert.equal(first.snapshot.ledger[0].balanceAfter, 50);
  assert.equal(first.receipt.ledgerEntryId, first.snapshot.ledger[0].id);
});

test("an idempotency key blocks duplicate cross-game rewards", () => {
  const initial = createCrownNetworkSnapshot();
  const first = applyLedgerTransaction(initial, {
    idempotencyKey: "mission:blackout-contract:payment",
    amount: 50,
    description: "Blackout Contract payment"
  });
  const duplicate = applyLedgerTransaction(first.snapshot, {
    idempotencyKey: "mission:blackout-contract:payment",
    amount: 50,
    description: "Duplicate Blackout Contract payment"
  });

  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.reason, "duplicate");
  assert.equal(duplicate.snapshot.wallet.balance, 50);
  assert.equal(duplicate.snapshot.ledger.length, 1);
  assert.equal(duplicate.snapshot.actionReceipts.length, 1);
});

test("the shared ledger refuses transactions that would overdraw the wallet", () => {
  const initial = createCrownNetworkSnapshot();
  const result = applyLedgerTransaction(initial, {
    idempotencyKey: "purchase:vehicle:night-runner",
    amount: -100,
    description: "Night Runner vehicle purchase"
  });

  assert.equal(result.applied, false);
  assert.equal(result.reason, "insufficient-funds");
  assert.equal(result.snapshot.wallet.balance, 0);
  assert.equal(result.snapshot.ledger.length, 0);
});

test("legacy mobile state migrates without losing Tay, wallet, mission, or consequences", () => {
  const legacy = createCurrentCheckpointState();
  legacy.stats.wallet = 50;
  legacy.stats.totalEarned = 50;
  legacy.legacyDecisions.push({
    at: legacy.updatedAt,
    choiceId: "protect-residents",
    title: "People Before Optics",
    immediate: "Residents receive support.",
    future: "Community trust rises."
  });

  const snapshot = migrateLegacyGameState(legacy, {
    playerId: "player-kyle",
    displayName: "Kyle"
  });

  assert.equal(snapshot.player.id, "player-kyle");
  assert.equal(snapshot.player.activeCharacterId, "tay-crowne");
  assert.equal(snapshot.characters[0].name, "Tay Crowne");
  assert.equal(snapshot.wallet.balance, 50);
  assert.equal(snapshot.ledger.length, 1);
  assert.equal(snapshot.actionReceipts.length, 1);
  assert.equal(snapshot.missions[0].id, "blackout-contract");
  assert.equal(snapshot.consequences[0].choiceId, "protect-residents");
  assert.deepEqual(snapshot.reputation, legacy.world);
  assert.equal(validateCrownNetworkSnapshot(snapshot).valid, true);
});

test("wallet or ledger tampering is detected before synchronization", () => {
  const credited = applyLedgerTransaction(createCrownNetworkSnapshot(), {
    idempotencyKey: "mission:blackout-contract:payment",
    amount: 50,
    description: "Blackout Contract payment"
  }).snapshot;

  credited.wallet.balance = 5000;
  const validation = validateCrownNetworkSnapshot(credited);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("does not match wallet balance")));
});
