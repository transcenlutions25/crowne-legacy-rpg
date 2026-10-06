import { applyLedgerTransaction, validateCrownNetworkSnapshot } from './crown-network.js';
import { isRecord, isText, isInteger, isTimestamp } from './crown-domain.js';

export const COMMAND_VERSION = 1;
export const CLIENTS = Object.freeze(['crowne-legacy-mobile', 'crowne-legacy-main-game']);
const clone = value => structuredClone(value);

// Stable serialization is an equality token, NOT a signature or authentication.
export function commandFingerprint(value) {
  if (Array.isArray(value)) return `[${value.map(commandFingerprint).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${commandFingerprint(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function validateCommandEnvelope(command) {
  const errors = [];
  if (!isRecord(command)) return { valid: false, errors: ['Command must be an object.'] };
  if (command.version !== COMMAND_VERSION) errors.push('Unsupported command version.');
  for (const field of ['id', 'idempotencyKey', 'playerId', 'characterId', 'snapshotId']) if (!isText(command[field])) errors.push(`${field} is required.`);
  if (!CLIENTS.includes(command.sourceClient)) errors.push('Unknown source client.');
  if (!isInteger(command.expectedRevision) || command.expectedRevision < 0) errors.push('expectedRevision must be a nonnegative safe integer.');
  if (!isTimestamp(command.issuedAt)) errors.push('issuedAt must be an ISO timestamp.');
  const allowed = ['version', 'id', 'idempotencyKey', 'playerId', 'characterId', 'snapshotId', 'sourceClient', 'expectedRevision', 'issuedAt', 'type', 'payload'];
  if (Object.keys(command).some(key => !allowed.includes(key))) errors.push('Unknown command fields are not accepted.');
  if (!isRecord(command.payload)) errors.push('payload must be an object.');
  else if (command.type === 'mission.claim-reward') {
    if (!isText(command.payload.missionId) || Object.keys(command.payload).some(key => key !== 'missionId')) errors.push('Reward requests accept only missionId; the authority determines the amount.');
  } else if (command.type === 'mission.record-decision') {
    if (!isText(command.payload.missionId) || !isText(command.payload.choiceId) || Object.keys(command.payload).some(key => !['missionId', 'choiceId'].includes(key))) errors.push('Decision requests require only missionId and choiceId.');
  } else errors.push('Unsupported command type.');
  return { valid: errors.length === 0, errors };
}

// Pure backend adapter contract. Never expose `resolve` as a client-controlled value.
// A production backend must authenticate, authorize, resolve from trusted content,
// and atomically persist snapshot + receipt under a revision compare-and-swap.
export function processCrownCommand(inputSnapshot, command, { resolve, receivedAt = new Date().toISOString() } = {}) {
  const initial = validateCrownNetworkSnapshot(inputSnapshot);
  if (!initial.valid) throw new Error(`Invalid authoritative snapshot: ${initial.errors.join(' ')}`);
  if (!isTimestamp(receivedAt)) throw new Error('receivedAt must be an ISO timestamp.');
  let snapshot = clone(inputSnapshot);
  const validation = validateCommandEnvelope(command);
  if (!validation.valid) return { snapshot, status: 'rejected', reason: 'invalid-command', receipt: null, errors: validation.errors };
  const fingerprint = commandFingerprint(command);
  const existing = snapshot.actionReceipts.find(receipt => receipt.idempotencyKey === command.idempotencyKey);
  if (existing) return { snapshot, status: existing.requestFingerprint === fingerprint ? 'duplicate' : 'conflict', reason: existing.requestFingerprint === fingerprint ? 'already-recorded' : 'idempotency-key-reused', receipt: clone(existing) };
  const revision = snapshot.revision ?? 0;
  if (!Number.isSafeInteger(revision + 1)) return { snapshot, status: 'rejected', reason: 'revision-exhausted', receipt: null };
  const finish = (status, reason, ledgerReceipt = null) => {
    const receipt = {
      id: `command-receipt:${command.idempotencyKey}`,
      commandId: command.id,
      idempotencyKey: command.idempotencyKey,
      requestFingerprint: fingerprint,
      sourceClient: command.sourceClient,
      status, reason,
      revision: revision + 1,
      occurredAt: receivedAt,
      ...(ledgerReceipt ? { ledgerEntryId: ledgerReceipt.ledgerEntryId } : {})
    };
    if (ledgerReceipt) snapshot.actionReceipts = snapshot.actionReceipts.filter(item => item.id !== ledgerReceipt.id);
    snapshot.actionReceipts.push(receipt);
    snapshot.revision = receipt.revision;
    snapshot.updatedAt = receivedAt;
    const checked = validateCrownNetworkSnapshot(snapshot);
    if (!checked.valid) throw new Error(`Authority produced an invalid result: ${checked.errors.join(' ')}`);
    return { snapshot, status, reason, receipt: clone(receipt) };
  };
  if (command.playerId !== snapshot.player.id || command.snapshotId !== snapshot.id || command.characterId !== snapshot.player.activeCharacterId) return finish('rejected', 'identity-mismatch');
  if (command.expectedRevision !== revision) return finish('conflict', 'stale-revision');
  const mission = snapshot.missions.find(item => item.id === command.payload.missionId);
  if (!mission) return finish('rejected', 'unknown-mission');
  if (typeof resolve !== 'function') return finish('rejected', 'authority-required');
  const decision = resolve(clone(command), clone(snapshot));
  if (!isRecord(decision) || decision.approved !== true) return finish('rejected', 'not-authorized');
  if (command.type === 'mission.claim-reward') {
    // Receipt keys alone are insufficient: a new key must not replay a reward.
    if (snapshot.ledger.some(entry => entry.type === 'mission-payment' && (entry.metadata?.missionId === mission.id || entry.idempotencyKey === `mission:${mission.id}:payment`)) ||
        (mission.id === 'blackout-contract' && snapshot.characters.some(character => character.state?.legacySave?.paymentClaimed === true || (Array.isArray(character.state?.narrativeLedger) && character.state.narrativeLedger.some(entry => entry?.type === 'payment'))))) return finish('rejected', 'reward-already-claimed');
    if (!isInteger(decision.amount) || decision.amount <= 0) throw new Error('Authority reward amount must be a positive safe integer.');
    const result = applyLedgerTransaction(snapshot, {
      idempotencyKey: command.idempotencyKey,
      amount: decision.amount,
      type: 'mission-payment',
      description: `Mission reward: ${mission.id}`,
      sourceClient: command.sourceClient,
      occurredAt: receivedAt,
      metadata: { missionId: mission.id, commandId: command.id }
    });
    snapshot = result.snapshot;
    return finish('accepted', 'reward-recorded', result.receipt);
  }
  if (snapshot.consequences.some(item => item.choiceId === command.payload.choiceId)) return finish('rejected', 'decision-already-recorded');
  if (!isRecord(decision.consequence) || decision.consequence.choiceId !== command.payload.choiceId) throw new Error('Authority must provide the matching consequence record.');
  snapshot.consequences.push(clone(decision.consequence));
  return finish('accepted', 'decision-recorded');
}
