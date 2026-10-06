import { isRecord, isText, isInteger, isTimestamp, validateDomainRecords } from "./crown-domain.js";

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
  const number = value;
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
  for (const record of Array.isArray(records) ? records : []) {
    const value = selector(record);
    if (!isText(value)) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateCrownNetworkSnapshot(candidate) {
  const errors = [];
  if (!isRecord(candidate)) return { valid: false, errors: ["Snapshot must be an object."] };
  if (candidate.version !== CROWN_NETWORK_VERSION) errors.push(`Snapshot version must be ${CROWN_NETWORK_VERSION}.`);

  for (const key of CROWN_NETWORK_RECORDS) {
    if (!(key in candidate)) errors.push(`Missing core record: ${key}.`);
  }

  if (!candidate.player?.id) errors.push("Player identity is missing an ID.");
  if (!Array.isArray(candidate.characters) || candidate.characters.length === 0) {
    errors.push("At least one character is required.");
  } else if (!candidate.characters.some((character) => character?.id === candidate.player?.activeCharacterId)) {
    errors.push("The active character must exist in the character collection.");
  }

  const collectionKeys = CROWN_NETWORK_RECORDS.filter((key) => !["player", "wallet", "reputation"].includes(key));
  for (const key of collectionKeys) {
    if (!Array.isArray(candidate[key])) errors.push(`${key} must be an array.`);
  }

  const balance = candidate.wallet?.balance;
  const totalEarned = candidate.wallet?.totalEarned;
  if (!Number.isSafeInteger(balance) || balance < 0) errors.push("Wallet balance must be a nonnegative safe integer.");
  if (!Number.isSafeInteger(totalEarned) || totalEarned < 0) errors.push("Wallet totalEarned must be a nonnegative safe integer.");

  const characterDuplicates = duplicateValues(candidate.characters || [], (record) => record?.id);
  if (characterDuplicates.length) errors.push(`Duplicate character IDs: ${characterDuplicates.join(", ")}.`);
  const ledgerDuplicates = duplicateValues(candidate.ledger || [], (record) => record?.id);
  if (ledgerDuplicates.length) errors.push(`Duplicate ledger IDs: ${ledgerDuplicates.join(", ")}.`);
  const receiptDuplicates = duplicateValues(candidate.actionReceipts || [], (record) => record?.idempotencyKey);
  if (receiptDuplicates.length) errors.push(`Duplicate action receipts: ${receiptDuplicates.join(", ")}.`);

  let runningBalance = 0;
  for (const entry of Array.isArray(candidate.ledger) ? candidate.ledger : []) {
    if (!isText(entry?.id) || !isText(entry?.idempotencyKey)) {
      errors.push("Every ledger entry requires an ID and idempotency key.");
      continue;
    }
    const amount = entry.amount;
    if (!Number.isSafeInteger(amount)) {
      errors.push(`Ledger amount for ${entry.id} must be a safe integer.`);
      continue;
    }
    runningBalance += amount;
    if (!Number.isSafeInteger(runningBalance)) errors.push("Ledger balance exceeds safe integer range.");
    if (entry.balanceAfter !== runningBalance) errors.push(`Ledger balance chain is invalid at ${entry.id}.`);
    if (runningBalance < 0) errors.push(`Ledger balance became negative at ${entry.id}.`);
  }
  if (Number.isSafeInteger(balance) && runningBalance !== balance) {
    errors.push(`Ledger total ${runningBalance} does not match wallet balance ${balance}.`);
  }

  const ledgerIds = new Set((Array.isArray(candidate.ledger) ? candidate.ledger : []).map((entry) => entry?.id));
  for (const receipt of Array.isArray(candidate.actionReceipts) ? candidate.actionReceipts : []) {
    if (!isText(receipt?.id) || !isText(receipt?.idempotencyKey) || !isText(receipt?.sourceClient)) {
      errors.push("Every action receipt requires an ID, idempotency key, and source client.");
    }
    if (receipt?.ledgerEntryId && !ledgerIds.has(receipt.ledgerEntryId)) {
      errors.push("Receipt references a missing ledger entry.");
    }
  }

  for (const field of ["id", "createdAt", "updatedAt"]) {
    if (!(field === "id" ? isText(candidate[field]) : isTimestamp(candidate[field]))) errors.push(`Snapshot ${field} is invalid.`);
  }
  if ("revision" in candidate && (!isInteger(candidate.revision) || candidate.revision < 0)) errors.push("Snapshot revision is invalid.");
  for (const [key, fields] of [["player", ["id", "displayName", "activeCharacterId"]], ["wallet", ["id", "currency"]]]) {
    if (!isRecord(candidate[key])) errors.push(`${key} must be an object.`);
    for (const field of fields) if (!isText(candidate[key]?.[field])) errors.push(`${key}.${field} is invalid.`);
    if (!isTimestamp(candidate[key]?.updatedAt)) errors.push(`${key}.updatedAt is invalid.`);
  }
  if (isInteger(balance) && isInteger(totalEarned) && totalEarned < balance) errors.push("Wallet totalEarned cannot be below its balance.");
  if (candidate.wallet?.currency !== CROWN_CURRENCY) errors.push("Wallet currency must be CROWN.");
  if (!isTimestamp(candidate.player?.createdAt)) errors.push("player.createdAt is invalid.");
  for (const character of Array.isArray(candidate.characters) ? candidate.characters : []) {
    if (!isRecord(character)) { errors.push("Character must be an object."); continue; }
    for (const field of ["id", "name", "campaign"]) if (!isText(character[field])) errors.push(`Character ${field} is invalid.`);
    if (!isInteger(character.level) || character.level < 1 || !isInteger(character.xp) || character.xp < 0 || !isRecord(character.state) || !isTimestamp(character.updatedAt)) errors.push("Character progression or state is invalid.");
  }
  for (const key of collectionKeys) {
    const duplicates = duplicateValues(candidate[key], record => record?.id || (key === "consequences" ? record?.choiceId : null));
    if (duplicates.length) errors.push(`Duplicate ${key} IDs: ${duplicates.join(", ")}.`);
  }
  if (duplicateValues(candidate.ledger, record => record?.idempotencyKey).length) errors.push("Duplicate ledger idempotency keys.");
  for (const entry of Array.isArray(candidate.ledger) ? candidate.ledger : []) {
    if (!isRecord(entry)) continue;
    if (!["id", "idempotencyKey", "type", "description", "sourceClient"].every(key => isText(entry[key])) || !isTimestamp(entry.occurredAt) || !isRecord(entry.metadata)) errors.push("Ledger audit fields are invalid.");
    const receipts = Array.isArray(candidate.actionReceipts) ? candidate.actionReceipts.filter(r => r?.ledgerEntryId === entry.id) : [];
    if (receipts.length !== 1 || receipts[0]?.idempotencyKey !== entry.idempotencyKey || receipts[0]?.sourceClient !== entry.sourceClient) errors.push("Ledger entry must have exactly one matching receipt.");
  }
  for (const receipt of Array.isArray(candidate.actionReceipts) ? candidate.actionReceipts : []) {
    if (!isRecord(receipt)) continue;
    if (!isTimestamp(receipt.occurredAt) || !["applied", "accepted", "rejected", "conflict"].includes(receipt.status)) errors.push("Receipt audit fields are invalid.");
    if (receipt.status === "applied" && !receipt.ledgerEntryId) errors.push("Applied receipt requires a ledger entry.");
    if ("commandId" in receipt && (!isText(receipt.commandId) || !isText(receipt.requestFingerprint) || !isInteger(receipt.revision) || receipt.revision < 1 || receipt.revision > (candidate.revision ?? 0) || !isText(receipt.reason))) errors.push("Command receipt audit fields are invalid.");
  }
  validateDomainRecords(candidate, errors);

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
  if (existing) {
    const prior = snapshot.ledger.find(entry => entry.id === existing.ledgerEntryId);
    return { snapshot, receipt: existing, applied: false, reason: prior && prior.amount === signedAmount && prior.type === type && prior.sourceClient === sourceClient ? "duplicate" : "conflict" };
  }

  const nextBalance = snapshot.wallet.balance + signedAmount;
  if (!Number.isSafeInteger(nextBalance) || !Number.isSafeInteger(snapshot.wallet.totalEarned + Math.max(0, signedAmount))) throw new Error("Transaction exceeds safe integer range.");
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
  if (!isRecord(legacyState) || legacyState.version !== 3) throw new Error("A legacy game state is required.");

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
      legacySave: clone(legacyState),
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

// Recovery of the original v3 save, not a network-to-client synchronization API.
export function restoreLegacyGameState(snapshot) {
  const validation = validateCrownNetworkSnapshot(snapshot);
  if (!validation.valid) throw new Error(`Invalid snapshot: ${validation.errors.join(" ")}`);
  const archive = snapshot.characters.find(character => character.id === snapshot.player.activeCharacterId)?.state?.legacySave;
  if (!isRecord(archive) || archive.version !== 3) throw new Error("This snapshot has no complete version-3 mobile save archive.");
  return clone(archive);
}
