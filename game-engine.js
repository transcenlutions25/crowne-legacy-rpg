import { EVIDENCE_CATALOG, getScene } from "./story.js";

export const STATE_VERSION = 3;
export const SAVE_KEY = "crowne-legacy.blackout-contract.save.v3";
export const SETTINGS_KEY = "crowne-legacy.settings.v1";

export const WORLD_AXES = Object.freeze({
  communityTrust: "Community trust",
  marketTrust: "Market trust",
  niaTrust: "Nia trust",
  civicTrust: "Civic Works trust",
  evidenceStrength: "Evidence strength",
  politicalHeat: "Political heat",
  autonomy: "Crowne autonomy",
  residentSafety: "Resident safety",
  integrity: "Public integrity"
});

const CURRENT_EVIDENCE = Object.freeze([
  "cobalt-pulse",
  "outbound-handshake",
  "c9-map",
  "duplicated-credential",
  "early-notice",
  "bridge-loan"
]);

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function baseState(mode) {
  return {
    version: STATE_VERSION,
    campaign: "Crowne Legacy: The Blackout Contract",
    mode,
    activeCharacter: "Tay Crowne",
    rosterScope: "chapter-subset",
    sceneId: "briefing",
    stage: "accept",
    stats: {
      level: 1,
      hp: 10,
      maxHp: 10,
      ac: 14,
      xp: 0,
      nextLevelXp: 300,
      wallet: 0,
      pendingReward: 50,
      totalEarned: 0,
      reserve: 18,
      inspector: 25
    },
    funds: {
      operations: 0,
      residents: 0
    },
    evidence: [],
    flags: {},
    world: Object.fromEntries(Object.keys(WORLD_AXES).map((key) => [key, 0])),
    legacyDecisions: [],
    paymentClaimed: false,
    fundsAllocated: false,
    history: [],
    ledger: [
      {
        at: now(),
        type: "campaign",
        text: mode === "replay"
          ? "The Blackout Contract opened for a full replay."
          : "Questforge checkpoint loaded at expansion port C-9."
      }
    ],
    startedAt: now(),
    updatedAt: now(),
    completedAt: null
  };
}

export function createReplayState() {
  return baseState("replay");
}

export function createCurrentCheckpointState() {
  const state = baseState("checkpoint");
  state.sceneId = "c9";
  state.stage = "worksite";
  state.stats.hp = 8;
  state.stats.xp = 50;
  state.stats.reserve = 9;
  state.stats.inspector = 16;
  state.evidence = [...CURRENT_EVIDENCE];
  state.flags = {
    contractAccepted: true,
    cleanTerms: true,
    relayMapped: true,
    evidenceSuite: true,
    exportLogged: true
  };
  return state;
}

export function normalizeState(candidate) {
  if (!candidate || candidate.version !== STATE_VERSION) {
    return null;
  }

  const defaults = baseState(candidate.mode || "checkpoint");
  const state = {
    ...defaults,
    ...clone(candidate),
    stats: { ...defaults.stats, ...(candidate.stats || {}) },
    funds: { ...defaults.funds, ...(candidate.funds || {}) },
    flags: { ...(candidate.flags || {}) },
    world: { ...defaults.world, ...(candidate.world || {}) },
    evidence: Array.isArray(candidate.evidence) ? [...new Set(candidate.evidence)] : [],
    legacyDecisions: Array.isArray(candidate.legacyDecisions) ? candidate.legacyDecisions : [],
    history: Array.isArray(candidate.history) ? candidate.history : [],
    ledger: Array.isArray(candidate.ledger) ? candidate.ledger : defaults.ledger
  };

  if (!getScene(state.sceneId)) {
    return null;
  }

  state.stats.hp = clamp(state.stats.hp, 1, state.stats.maxHp);
  state.stats.reserve = Math.max(0, state.stats.reserve);
  state.stats.inspector = Math.max(0, state.stats.inspector);
  return state;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function secureRandomInt(max) {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function rollCheck(check, forcedRolls = null) {
  if (!check) {
    throw new Error("A check definition is required.");
  }

  const count = check.advantage ? 2 : 1;
  const rolls = forcedRolls
    ? forcedRolls.slice(0, count).map(Number)
    : Array.from({ length: count }, () => secureRandomInt(20) + 1);

  if (rolls.length !== count || rolls.some((roll) => roll < 1 || roll > 20)) {
    throw new Error("Forced d20 rolls must contain valid values from 1 to 20.");
  }

  const natural = check.advantage ? Math.max(...rolls) : rolls[0];
  const total = natural + check.modifier;
  return {
    rolls,
    natural,
    modifier: check.modifier,
    total,
    dc: check.dc,
    skill: check.skill,
    advantage: Boolean(check.advantage),
    success: total >= check.dc
  };
}

function applyNumericEffects(state, effects = {}) {
  const stats = state.stats;
  if (effects.reserve) stats.reserve = Math.max(0, stats.reserve + effects.reserve);
  if (effects.inspector) stats.inspector = Math.max(0, stats.inspector + effects.inspector);
  if (effects.hp) stats.hp = clamp(stats.hp + effects.hp, 1, stats.maxHp);
  if (effects.xp) stats.xp = Math.max(0, stats.xp + effects.xp);
  if (effects.wallet) stats.wallet = Math.max(0, stats.wallet + effects.wallet);
  if (effects.pendingReward) stats.pendingReward = Math.max(0, stats.pendingReward + effects.pendingReward);
}

function applyEvidence(state, evidenceAdd = []) {
  for (const evidenceId of evidenceAdd) {
    if (EVIDENCE_CATALOG[evidenceId] && !state.evidence.includes(evidenceId)) {
      state.evidence.push(evidenceId);
    }
  }
}

function applyWorld(state, changes = {}) {
  for (const [key, change] of Object.entries(changes)) {
    if (key in state.world) {
      state.world[key] += Number(change) || 0;
    }
  }
}

function addLedgerEntry(state, text, type = "contract") {
  if (!text) return;
  state.ledger.push({ at: now(), type, text });
}

function claimPaymentInPlace(state) {
  if (state.paymentClaimed) {
    if (!state.flags.duplicatePaymentBlocked) {
      state.flags.duplicatePaymentBlocked = true;
      addLedgerEntry(state, "Duplicate payment request blocked by the one-time wallet gate.", "payment-guard");
    }
    return { claimed: false, amount: 0, reason: "duplicate" };
  }

  const amount = Number(state.stats.pendingReward) || 0;
  if (amount <= 0) {
    return { claimed: false, amount: 0, reason: "no-pending-payment" };
  }

  state.stats.wallet += amount;
  state.stats.totalEarned += amount;
  state.stats.pendingReward = 0;
  state.paymentClaimed = true;
  addLedgerEntry(state, `${amount} Crowns credited to Tay's wallet exactly once.`, "payment");
  return { claimed: true, amount, reason: "verified" };
}

function allocateFundsInPlace(state, allocation) {
  if (!state.paymentClaimed) {
    return { allocated: false, reason: "payment-not-claimed" };
  }
  if (state.fundsAllocated) {
    return { allocated: false, reason: "already-allocated" };
  }

  const operations = Math.max(0, Number(allocation?.operations) || 0);
  const residents = Math.max(0, Number(allocation?.residents) || 0);
  const total = operations + residents;
  if (total > state.stats.wallet) {
    return { allocated: false, reason: "insufficient-wallet" };
  }

  state.stats.wallet -= total;
  state.funds.operations += operations;
  state.funds.residents += residents;
  state.fundsAllocated = true;
  return { allocated: true, operations, residents, total };
}

export function resolveChoice(inputState, choice, roll = null) {
  if (!choice) {
    throw new Error("A valid choice is required.");
  }

  const state = clone(inputState);
  if (choice.once && state.flags[choice.once]) {
    return {
      state,
      result: {
        choiceId: choice.id,
        blocked: true,
        text: "That preparation is already complete."
      }
    };
  }

  let branch = choice;
  let checkResult = null;
  if (choice.check) {
    if (!roll || typeof roll.total !== "number") {
      throw new Error(`Choice ${choice.id} requires a resolved check.`);
    }
    checkResult = roll;
    branch = roll.total >= choice.check.dc ? choice.success : choice.failure;
  }

  let special = null;
  if (choice.action === "claimPayment") {
    special = claimPaymentInPlace(state);
    if (!special.claimed) {
      return {
        state,
        result: {
          choiceId: choice.id,
          blocked: true,
          special,
          text: special.reason === "duplicate"
            ? "Duplicate payment blocked. Tay's wallet was not credited again."
            : "No verified payment is waiting."
        }
      };
    }
  }

  if (choice.action === "allocateFunds") {
    special = allocateFundsInPlace(state, choice.allocation);
    if (!special.allocated) {
      return {
        state,
        result: {
          choiceId: choice.id,
          blocked: true,
          special,
          text: "The allocation could not be completed from the current wallet state."
        }
      };
    }
  }

  applyNumericEffects(state, choice.effects);
  applyNumericEffects(state, branch.effects);
  applyEvidence(state, choice.evidenceAdd);
  applyEvidence(state, branch.evidenceAdd);
  applyWorld(state, choice.world);
  applyWorld(state, branch.world);
  Object.assign(state.flags, choice.flags || {}, branch.flags || {});
  if (choice.once) state.flags[choice.once] = true;

  if (choice.legacy) {
    state.legacyDecisions.push({
      at: now(),
      choiceId: choice.id,
      title: choice.legacy.title,
      immediate: choice.legacy.immediate,
      future: choice.legacy.future
    });
  }

  const ledgerText = branch.ledger || choice.ledger;
  addLedgerEntry(state, ledgerText, choice.legacy ? "legacy" : "contract");

  const previousSceneId = state.sceneId;
  const nextSceneId = branch.next || choice.next || state.sceneId;
  state.sceneId = nextSceneId;
  state.stage = getScene(nextSceneId).stage;
  if (nextSceneId === "close") state.completedAt = now();

  const resultText = branch.result || choice.result || "Tay's decision is recorded.";
  state.history.push({
    at: now(),
    sceneId: previousSceneId,
    choiceId: choice.id,
    recommended: Boolean(choice.recommended),
    check: checkResult,
    result: resultText,
    nextSceneId
  });
  state.updatedAt = now();

  return {
    state,
    result: {
      choiceId: choice.id,
      blocked: false,
      success: checkResult ? checkResult.total >= choice.check.dc : true,
      check: checkResult,
      special,
      text: resultText,
      nextSceneId
    }
  };
}

export function getEvidenceLabels(state) {
  return state.evidence.map((id) => EVIDENCE_CATALOG[id]).filter(Boolean);
}

export function getWorldSignals(state) {
  return Object.entries(state.world)
    .map(([id, value]) => ({ id, label: WORLD_AXES[id], value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function deriveEnding(state) {
  const { world, flags } = state;
  let title = "A Measured Legacy";
  let summary = "Tay closes the contract with competing obligations still visible in the ledger.";

  if (world.communityTrust >= 8 && world.autonomy >= 0) {
    title = "Power Shared";
    summary = "Crownspire Seven sees the Crowne operation as a partner that builds power with communities, not over them.";
  } else if (world.autonomy >= 7) {
    title = "An Independent Crown";
    summary = "Tay leaves with unusual control and growing capacity, while the community watches how he chooses to use it.";
  } else if (world.evidenceStrength <= -2 || flags.caseSealed) {
    title = "Safety Bought in Silence";
    summary = "The tower is safe tonight, but Copperline keeps room to repeat what it did beyond Crownspire Seven.";
  } else if (world.politicalHeat >= 8) {
    title = "The City Is Watching";
    summary = "The case is alive and public. Tay has earned powerful allies, powerful enemies, and no quiet road forward.";
  } else if (world.communityTrust >= 8) {
    title = "The People's Contractor";
    summary = "Crownspire trusts Tay deeply, though his independent operation will need resources to survive that promise.";
  }

  return { title, summary };
}

export function getStageProgress(stage) {
  const order = ["accept", "worksite", "completion", "approval", "payment", "close"];
  return Math.max(0, order.indexOf(stage));
}
