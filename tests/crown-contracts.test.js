import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CROWN_NETWORK_RECORDS, createCrownNetworkSnapshot, validateCrownNetworkSnapshot, migrateLegacyGameState, restoreLegacyGameState, applyLedgerTransaction } from '../crown-network.js';
import { processCrownCommand, validateCommandEnvelope } from '../crown-commands.js';
import { resolveChoice, normalizeState } from '../game-engine.js';
import { getScene } from '../story.js';
const fixture = name => JSON.parse(readFileSync(new URL(`fixtures/${name}.json`, import.meta.url)));
const network = () => fixture('network-v1-domains');
const command = () => fixture('mobile-command-v1');
const options = { receivedAt: '2026-08-02T12:00:00.000Z', resolve: () => ({ approved: true, amount: 50 }) };

test('all non-array collection shapes return errors without throwing', () => {
  for (const key of CROWN_NETWORK_RECORDS.filter(k => !['player', 'wallet', 'reputation'].includes(k))) {
    for (const value of [null, {}, 1, true, 'invalid']) {
      const candidate = network(); candidate[key] = value;
      assert.equal(validateCrownNetworkSnapshot(candidate).valid, false, `${key}: ${JSON.stringify(value)}`);
    }
    const candidate = network(); candidate[key] = [null];
    assert.equal(validateCrownNetworkSnapshot(candidate).valid, false, `${key}: null entry`);
  }
  for (const input of [null, false, 1, 'snapshot', [], {}]) assert.equal(validateCrownNetworkSnapshot(input).valid, false);
});

test('typed records reject missing fields, invalid references, clocks and duplicate IDs', () => {
  assert.equal(validateCrownNetworkSnapshot(network()).valid, true);
  for (const key of ['properties','businesses','inventory','vehicles','missions','relationships','factions','worldClocks','scheduledEvents']) {
    const candidate = network(); candidate[key] = [{}];
    assert.equal(validateCrownNetworkSnapshot(candidate).valid, false, key);
    const duplicate = network(); duplicate[key].push(structuredClone(duplicate[key][0]));
    assert.equal(validateCrownNetworkSnapshot(duplicate).valid, false, `${key} duplicate`);
  }
  const candidate = network(); candidate.businesses[0].propertyId = 'missing';
  candidate.worldClocks[0].value = 5; candidate.reputation.politicalHeat = '5';
  const errors = validateCrownNetworkSnapshot(candidate).errors;
  assert.ok(errors.some(e => e.includes('missing record')));
  assert.ok(errors.some(e => e.includes('exceeds limit')));
  assert.ok(errors.some(e => e.includes('politicalHeat')));
});

test('numeric wire values are never coerced and overflow cannot credit a wallet', () => {
  for (const value of ['0', null, false, 0.5, Infinity, NaN]) {
    const candidate = network(); candidate.wallet.balance = value;
    assert.equal(validateCrownNetworkSnapshot(candidate).valid, false);
  }
  assert.throws(() => applyLedgerTransaction(network(), {idempotencyKey:'bad',amount:'50',description:'Invalid'}), /safe integer/);
  const max = applyLedgerTransaction(createCrownNetworkSnapshot(), {idempotencyKey:'max',amount:Number.MAX_SAFE_INTEGER,description:'Range test'}).snapshot;
  assert.throws(() => applyLedgerTransaction(max, {idempotencyKey:'overflow',amount:1,description:'Overflow test'}), /safe integer/);
});

test('legacy v1 snapshot fixture stays readable without inventing a lost archive', () => {
  const old = fixture('network-v1-original');
  assert.equal(validateCrownNetworkSnapshot(old).valid, true);
  assert.throws(() => restoreLegacyGameState(old), /no complete/);
  assert.equal(processCrownCommand(old, {...command(),snapshotId:old.id}, options).status, 'accepted');
});

test('migration round trips the entire v3 checkpoint, including unknown additive fields', () => {
  const save = fixture('mobile-v3-checkpoint'); save.extensionForFutureChapter = { retained: true };
  const before = structuredClone(save);
  const migrated = migrateLegacyGameState(save);
  const restored = restoreLegacyGameState(JSON.parse(JSON.stringify(migrated)));
  assert.deepEqual(restored, before);
  assert.deepEqual(save, before);
  assert.ok(normalizeState(restored));
  restored.stats.hp = 1;
  assert.equal(migrated.characters[0].state.legacySave.stats.hp, 8);
  assert.throws(() => migrateLegacyGameState({...save,version:4}), /legacy game state/);
});

test('paid mobile saves retain payment protection after migration and archive restore', () => {
  let save = fixture('mobile-v3-checkpoint');
  save.sceneId = 'payment'; save.stage = 'payment'; save.flags.approved = true;
  const paymentChoice = getScene('payment').choices.find(choice => choice.id === 'claim-payment');
  save = resolveChoice(save, paymentChoice).state;
  assert.equal(save.paymentClaimed,true);
  const migrated = migrateLegacyGameState(save); migrated.id = command().snapshotId;
  const restored = restoreLegacyGameState(migrated);
  assert.equal(resolveChoice(restored, paymentChoice).result.special.claimed, false);
  assert.equal(processCrownCommand(migrated, command(), options).reason, 'reward-already-claimed');
});

test('mobile and main-game clients express requests with authority-owned effects', () => {
  for (const name of ['mobile-command-v1','main-game-command-v1']) {
    const request = fixture(name);
    assert.equal(validateCommandEnvelope(request).valid, true);
    const result = processCrownCommand(network(), request, options);
    assert.equal(result.status, 'accepted');
    assert.equal(result.snapshot.wallet.balance, 50);
    assert.equal(result.snapshot.revision, 1);
    assert.equal(result.receipt.commandId,request.id);
    assert.equal(result.receipt.sourceClient,request.sourceClient);
    assert.equal(validateCrownNetworkSnapshot(result.snapshot).valid,true);
  }
  assert.equal(processCrownCommand(network(),command()).reason,'authority-required');
  assert.equal(processCrownCommand(network(),{...command(),payload:{missionId:'blackout-contract',amount:999}},options).reason,'invalid-command');
  assert.equal(processCrownCommand(network(),{...command(),authority:true},options).reason,'invalid-command');
});

test('replay returns exact receipt even after JSON persistence; changed key payload conflicts', () => {
  const initial = network(); const before = structuredClone(initial);
  const first = processCrownCommand(initial,command(),options);
  assert.deepEqual(initial,before);
  const persisted = JSON.parse(JSON.stringify(first.snapshot));
  const replay = processCrownCommand(persisted,command(),{...options,resolve:()=>{throw new Error('must not run');}});
  assert.equal(replay.status,'duplicate');
  assert.deepEqual(replay.receipt,first.receipt);
  assert.deepEqual(replay.snapshot,persisted);
  const conflict = processCrownCommand(persisted,{...command(),sourceClient:'crowne-legacy-main-game'},options);
  assert.equal(conflict.status,'conflict');
  assert.equal(conflict.reason,'idempotency-key-reused');
  assert.deepEqual(conflict.snapshot,persisted);
});

test('stale, rejected and identity-mismatched commands leave economy intact and are replay safe', () => {
  for (const [request, reason] of [[{...command(),expectedRevision:2},'stale-revision'],[{...command(),playerId:'other-player'},'identity-mismatch'],[{...command(),payload:{missionId:'missing'}},'unknown-mission']]) {
    const result = processCrownCommand(network(),request,options);
    assert.equal(result.reason,reason);
    assert.equal(result.snapshot.wallet.balance,0);
    assert.equal(result.snapshot.ledger.length,0);
    assert.equal(processCrownCommand(result.snapshot,request,options).status,'duplicate');
  }
});

test('different command keys cannot double-credit the same mission', () => {
  const first = processCrownCommand(network(),command(),options);
  const second = processCrownCommand(first.snapshot,{...command(),id:'new-id',idempotencyKey:'new-key',expectedRevision:1},options);
  assert.equal(second.reason,'reward-already-claimed');
  assert.equal(second.snapshot.wallet.balance,50);
  assert.equal(second.snapshot.ledger.length,1);
});

test('consequences are authority-resolved, immutable by replay and ordered without cycles', () => {
  const request = {...command(),type:'mission.record-decision',payload:{missionId:'blackout-contract',choiceId:'fixture-choice'}};
  const consequence = {id:'fixture-consequence',choiceId:'fixture-choice',title:'Contract test decision',immediate:'Test immediate effect',future:'Test future effect',at:options.receivedAt,parentIds:[]};
  const result = processCrownCommand(network(),request,{...options,resolve:()=>({approved:true,consequence})});
  assert.equal(result.status,'accepted');
  assert.deepEqual(result.snapshot.consequences,[consequence]);
  assert.equal(processCrownCommand(result.snapshot,request,options).status,'duplicate');
  const corrupted = structuredClone(result.snapshot); corrupted.consequences[0].parentIds=['fixture-consequence'];
  assert.equal(validateCrownNetworkSnapshot(corrupted).valid,false);
  const repeat = processCrownCommand(result.snapshot,{...request,id:'repeat',idempotencyKey:'repeat',expectedRevision:1},{...options,resolve:()=>({approved:true,consequence})});
  assert.equal(repeat.reason,'decision-already-recorded');
});

test('ledger receipt links and primitive transaction key reuse detect tampering', () => {
  const result = processCrownCommand(network(),command(),options);
  for (const mutate of [s=>s.actionReceipts[0].idempotencyKey='wrong',s=>s.actionReceipts=[],s=>s.ledger.push(structuredClone(s.ledger[0])),s=>s.actionReceipts[0].revision='1']) {
    const candidate=structuredClone(result.snapshot); mutate(candidate);
    assert.equal(validateCrownNetworkSnapshot(candidate).valid,false);
  }
  const tx={idempotencyKey:'primitive',amount:50,description:'Test'};
  const first=applyLedgerTransaction(network(),tx);
  assert.equal(applyLedgerTransaction(first.snapshot,{...tx,amount:500}).reason,'conflict');
});

test('noncanonical command identifiers reject cleanly rather than mismatching ledger keys', () => {
  for (const key of [' id', 'id ', ' id ']) {
    const result = processCrownCommand(network(), {...command(),idempotencyKey:key}, options);
    assert.equal(result.reason,'invalid-command');
    assert.equal(result.snapshot.wallet.balance,0);
    assert.equal(result.receipt,null);
  }
});

test('malformed optional legacy narrative data cannot crash reward checks', () => {
  for (const value of [{}, null, false, 'text']) {
    const candidate = network(); candidate.characters[0].state.narrativeLedger = value;
    assert.equal(processCrownCommand(candidate,command(),options).status,'accepted');
  }
});

test('object identifiers and unusual JSON values produce validation errors, never coercion errors', () => {
  for (const key of CROWN_NETWORK_RECORDS.filter(k => !['player','wallet','reputation'].includes(k))) {
    for (const value of [{toString:null},{valueOf:null},[],{},false,0]) {
      const candidate=network();
      candidate[key]=[{id:value,idempotencyKey:value,amount:'bad',ledgerEntryId:'missing'}];
      assert.equal(validateCrownNetworkSnapshot(candidate).valid,false,key);
    }
  }
});

test('original v1 ledger rewards without mission metadata cannot pay again through commands', () => {
  const paid = fixture('network-v1-original-paid');
  assert.equal(validateCrownNetworkSnapshot(paid).valid,true);
  const result = processCrownCommand(paid,{...command(),snapshotId:paid.id},options);
  assert.equal(result.reason,'reward-already-claimed');
  assert.equal(result.snapshot.wallet.balance,50);
  assert.equal(result.snapshot.ledger.length,1);
});

test('snapshot validation is total over malformed JSON at every fixture field', () => {
  const original = network();
  const paths = [];
  function visit(value, parent = []) {
    for (const key of Object.keys(value)) {
      const path = [...parent,key]; paths.push(path);
      if (value[key] && typeof value[key] === 'object') visit(value[key],path);
    }
  }
  visit(original);
  for (const path of paths) for (const value of [null,{},[],{toString:null},false,'bad',5]) {
    const candidate = structuredClone(original); let target = candidate;
    for (const key of path.slice(0,-1)) target = target[key];
    target[path.at(-1)] = value;
    assert.doesNotThrow(() => validateCrownNetworkSnapshot(candidate),path.join('.'));
  }
});
