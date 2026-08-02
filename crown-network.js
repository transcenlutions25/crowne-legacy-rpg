export const CROWN_NETWORK_VERSION = 1;
export const CROWN_CURRENCY = "CROWN";

export const CROWN_NETWORK_RECORDS = Object.freeze([
  "player",
  "characters",
  "wallet",
  "ledger",
  "properties",
  "businesses",
  "inventory",
  "vehicles",
  "missions",
  "consequences",
  "relationships",
  "factions",
  "reputation",
  "worldClocks",
  "scheduledEvents",
  "actionReceipts"
]);

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function timestamp(value = null) {
  const candidate = value ? new Date(value) : new Date();
  if (Number.isNaN(candidate.getTime())) throw new Error("A valid ISO timestamp is required.");
  return candidate.toISOString();
}

function identifier(prefix = "record") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function requireInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${label} must be a safe integer.`);
  return number;
}

export function createPlayerIdentity({
  playerId = identifier("player"),
  displayName = "Player",
  activeCharacterId = "tay-crowne",
  createdAt = null
} = {}) {
  const at = timestamp(createdAt);
  return {
    id: requireText(playerId, "Player ID"),
    displayName: requireText(displayName, "Display name"),
    activeCharacterId: requireText(activeCharacterId, "Active character ID"),
    createdAt: at,
    updatedAt: at
  };
}

export function createCharacterState({
  characterId = "tay-crowne",
  name = "Tay Crowne",
  campaign = "Crowne Legacy: The Blackout Contract",
  level = 1,
  xp = 0,
  state = {},
  updatedAt = null
} = {}) {
  return {
    id: requireText(characterId, "Character ID"),
    name: requireText(name, "Character name"),
    campaign: requireText(campaign, "Campaign"),
    level: Math.max(1, requireInteger(level, "Character level")),
    xp: Math.max(0, requireInteger(xp, "Character XP")),
    state: clone(state),
    updatedAt: timestamp(updatedAt)
  };
}

export function createWallet({
  walletId = "primary-wallet",
  currency = CROWN_CURRENCY,
  balance = 0,
  totalEarned = 0,
  updatedAt = null
} = {}) {
  const normalizedBalance = requireInteger(balance, "Wallet balance");
  const normalizedEarned = requireInteger(totalEarned, "Total earned");
  if (normalizedBalance < 0 || normalizedEarned < 0) throw new Error("Wallet values cannot be negative.");
  return {
    id: requireText(walletId, "Wallet ID"),
    currency: requireText(currency, "Wallet currency"),
    balance: normalizedBalance,
    totalEarned: normalizedEarned,
    updatedAt: timestamp(updatedAt)
  };
}

export function createCrownNetworkSnapshot({
  snapshotId = identifier("snapshot"),
  player = createPlayerIdentity(),
  characters = [createCharacterState()],
  wallet = createWallet(),
  ledger = [],
  properties = [],
  businesses = [],
  inventory = [],
  vehicles = [],
  missions = [],
  consequences = [],
  relationships = [],
  factions = [],
  reputation = {},
  worldClocks = [],
  scheduledEvents = [],
  actionReceipts = [],
  createdAt = null,
  updatedAt = null
} = {}) {
  const created = timestamp(createdAt);
  const snapshot = {
    version: CROWN_NETWORK_VERSION,
    id: requireText(snapshotId, "Snapshot ID"),
    player: clone(player),
    characters: clone(characters),
    wallet: clone(wallet),
    ledger: clone(ledger),
    properties: clone(properties),
    businesses: clone(businesses),
    inventory: clone(inventory),
    vehicles: clone(vehicles),
    missions: clone(missions),
    consequences: clone(consequences),
    relationships: clone(relationships),
    factions: clone(factions),
    reputation: clone(reputation),
    worldClocks: clone(worldClocks),
    scheduledEvents: clone(scheduledEvents),
    actionReceipts: clone(actionReceipts),
    createdAt: created,
    updatedAt: timestamp(updatedAt || created)
  };

  const validation = validateCrownNetworkSnapshot(snapshot);
  if (!validation.valid) throw new Error(`Invalid Crown Network snapshot: ${validation.errors.join(" ")}`);
  return snapshot;
}

function duplicateValues(records, selector) {
  const seen = new Set();
  const duplicates = new Set();
  for (const record of records) {
    const value = selector(record);
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateCrownNetworkSnapshot(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== "object") return { valid: false, errors: ["Snapshot must be an object."] };
  if (candidate.version !== CROWN_NETWORK_VERSION) errors.push(`Snapshot version must be ${CROWN_NETWORK_VERSION}.`);

  for (const key of CROWN_NETWORK_RECORDS) {
    if (!(key in candidate)) errors.push(`Missing core record: ${key}.`);
  }

  if (!candidate.player?.id) errors.push("Player identity is missing an ID.");
  if (!Array.isArray(candidate.characters) || candidate.characters.length === 0) {
    errors.push("At least one character is required.");
  } else if (!candidate.characters.some((character) => character.id === candidate.player?.activeCharacterId)) {
    errors.push("The active character must exist in the character collection.");
  }

  const collectionKeys = CROWN_NETWORK_RECORDS.filter((key) => !["player", "wallet", "reputation"].includes(key));
  for (const key of collectionKeys) {
    if (!Array.isArray(candidate[key])) errors.push(`${key} must be an array.`);
  }

  const balance = Number(candidate.wallet?.balance);
  const totalEarned = Number(candidate.wallet?.totalEarned);
  if (!Number.isSafeInteger(balance) || balance < 0) errors.push("Wallet balance must be a nonnegative safe integer.");
  if (!Number.isSafeInteger(totalEarned) || totalEarned < 0) errors.push("Wallet totalEarned must be a nonnegative safe integer.");

  const characterDuplicates = duplicateValues(candidate.characters || [], (record) => record?.id);
  if (characterDuplicates.length) errors.push(`Duplicate character IDs: ${characterDuplicates.join(", ")}.`);
  const ledgerDuplicates = duplicateValues(candidate.ledger || [], (record) => record?.id);
  if (ledgerDuplicates.length) errors.push(`Duplicate ledger IDs: ${ledgerDuplicates.join(", ")}.`);
  const receiptDuplicates = duplicateValues(candidate.actionReceipts || [], (record) => record?.idempotencyKey);
  if (receiptDuplicates.length) errors.push(`Duplicate action receipts: ${receiptDuplicates.join(", ")}.`);

  let runningBalance = 0;
  for (const entry of candidate.ledger || []) {
    if (!entry?.id || !entry?.idempotencyKey) {
      errors.push("Every ledger entry requires an ID and idempotency key.");
      continue;
    }
    const amount = Number(entry.amount);
    if (!Number.isSafeInteger(amount)) {
      errors.push(`Ledger amount for ${entry.id} must be a safe integer.`);
      continue;
    }
    runningBalance += amount;
    if (entry.balanceAfter !== runningBalance) errors.push(`Ledger balance chain is invalid at ${entry.id}.`);
    if (runningBalance < 0) errors.push(`Ledger balance became negative at ${entry.id}.`);
  }
  if (Number.isSafeInteger(balance) && runningBalance !== balance) {
    errors.push(`Ledger total ${runningBalance} does not match wallet balance ${balance}.`);
  }

  const ledgerIds = new Set((candidate.ledger || []).map((entry) => entry?.id));
  for (const receipt of candidate.actionReceipts || []) {
    if (!receipt?.id || !receipt?.idempotencyKey || !receipt?.sourceClient) {
      errors.push("Every action receipt requires an ID, idempotency key, and source client.");
    }
    if (receipt?.ledgerEntryId && !ledgerIds.has(receipt.ledgerEntryId)) {
      errors.push(`Receipt ${receipt.id} references a missing ledger entry.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function applyLedgerTransaction(inputSnapshot, {
  idempotencyKey,
  amount,
  type = "transaction",
  description,
  sourceClient = "crowne-legacy-mobile",
  occurredAt = null,
  metadata = {}
} = {}) {
  const snapshot = clone(inputSnapshot);
  const initialValidation = validateCrownNetworkSnapshot(snapshot);
  if (!initialValidation.valid) throw new Error(`Cannot transact against an invalid snapshot: ${initialValidation.errors.join(" ")}`);

  const key = requireText(idempotencyKey, "Idempotency key");
  const signedAmount = requireInteger(amount, "Transaction amount");
  if (signedAmount === 0) throw new Error("Transaction amount cannot be zero.");

  const existing = snapshot.actionReceipts.find((receipt) => receipt.idempotencyKey === key);
  if (existing) return { snapshot, receipt: existing, applied: false, reason: "duplicate" };

  const nextBalance = snapshot.wallet.balance + signedAmount;
  if (nextBalance < 0) return { snapshot, receipt: null, applied: false, reason: "insufficient-funds" };

  const at = timestamp(occurredAt);
  const ledgerEntry = {
    id: identifier("ledger"),
    idempotencyKey: key,
    type: requireText(type, "Transaction type"),
    description: requireText(description, "Transaction description"),
    amount: signedAmount,
    balanceAfter: nextBalance,
    sourceClient: requireText(sourceClient, "Source client"),
    metadata: clone(metadata),
    occurredAt: at
  };
  const receipt = {
    id: identifier("receipt"),
    idempotencyKey: key,
    sourceClient: ledgerEntry.sourceClient,
    status: "applied",
    ledgerEntryId: ledgerEntry.id,
    occurredAt: at
  };

  snapshot.ledger.push(ledgerEntry);
  snapshot.actionReceipts.push(receipt);
  snapshot.wallet.balance = nextBalance;
  if (signedAmount > 0) snapshot.wallet.totalEarned += signedAmount;
  snapshot.wallet.updatedAt = at;
  snapshot.updatedAt = at;

  const finalValidation = validateCrownNetworkSnapshot(snapshot);
  if (!finalValidation.valid) throw new Error(`Transaction violated Crown Network integrity: ${finalValidation.errors.join(" ")}`);
  return { snapshot, receipt, applied: true, reason: "applied" };
}

export function migrateLegacyGameState(legacyState, {
  playerId = "local-player",
  displayName = "Local Player",
  sourceClient = "crowne-legacy-mobile"
} = {}) {
  if (!legacyState || typeof legacyState !== "object") throw new Error("A legacy game state is required.");

  const characterId = String(legacyState.activeCharacter || "Tay Crowne")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "tay-crowne";
  const walletBalance = Math.max(0, requireInteger(legacyState.stats?.wallet || 0, "Legacy wallet"));
  const totalEarned = Math.max(walletBalance, requireInteger(legacyState.stats?.totalEarned || 0, "Legacy total earned"));
  const migratedAt = timestamp(legacyState.updatedAt || null);

  const player = createPlayerIdentity({
    playerId,
    displayName,
    activeCharacterId: characterId,
    createdAt: legacyState.startedAt || migratedAt
  });
  const character = createCharacterState({
    characterId,
    name: legacyState.activeCharacter || "Tay Crowne",
    campaign: legacyState.campaign || "Crowne Legacy",
    level: legacyState.stats?.level || 1,
    xp: legacyState.stats?.xp || 0,
    state: {
      legacyStateVersion: legacyState.version ?? null,
      mode: legacyState.mode ?? null,
      sceneId: legacyState.sceneId ?? null,
      stage: legacyState.stage ?? null,
      hp: legacyState.stats?.hp ?? null,
      maxHp: legacyState.stats?.maxHp ?? null,
      funds: clone(legacyState.funds || {}),
      evidence: clone(legacyState.evidence || []),
      flags: clone(legacyState.flags || {}),
      world: clone(legacyState.world || {}),
      legacyDecisions: clone(legacyState.legacyDecisions || []),
      missionHistory: clone(legacyState.history || []),
      narrativeLedger: clone(legacyState.ledger || []),
      completedAt: legacyState.completedAt || null
    },
    updatedAt: migratedAt
  });

  const ledger = walletBalance > 0 ? [{
    id: identifier("ledger"),
    idempotencyKey: `migration:${player.id}:${legacyState.version ?? "unknown"}`,
    type: "migration-opening-balance",
    description: "Verified Crowne Legacy Mobile balance migrated into the Crown Network.",
    amount: walletBalance,
    balanceAfter: walletBalance,
    sourceClient,
    metadata: { legacySaveVersion: legacyState.version ?? null },
    occurredAt: migratedAt
  }] : [];
  const actionReceipts = ledger.map((entry) => ({
    id: identifier("receipt"),
    idempotencyKey: entry.idempotencyKey,
    sourceClient,
    status: "applied",
    ledgerEntryId: entry.id,
    occurredAt: migratedAt
  }));

  return createCrownNetworkSnapshot({
    player,
    characters: [character],
    wallet: createWallet({ balance: walletBalance, totalEarned, updatedAt: migratedAt }),
    ledger,
    reputation: clone(legacyState.world || {}),
    consequences: clone(legacyState.legacyDecisions || []),
    missions: [{
      id: "blackout-contract",
      campaign: legacyState.campaign || "Crowne Legacy: The Blackout Contract",
      sceneId: legacyState.sceneId || "briefing",
      stage: legacyState.stage || "accept",
      status: legacyState.completedAt ? "completed" : "active",
      updatedAt: migratedAt
    }],
    actionReceipts,
    createdAt: legacyState.startedAt || migratedAt,
    updatedAt: migratedAt
  });
}
