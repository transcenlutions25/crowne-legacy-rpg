import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAPTER_CAST,
  SCENES,
  getChoice,
  getScene
} from "../story.js";
import {
  createCurrentCheckpointState,
  createReplayState,
  resolveChoice,
  rollCheck
} from "../game-engine.js";

function allNextIds(choice) {
  return [choice.next, choice.success?.next, choice.failure?.next].filter(Boolean);
}

test("the current checkpoint matches the Questforge C-9 state", () => {
  const state = createCurrentCheckpointState();
  assert.equal(state.activeCharacter, "Tay Crowne");
  assert.equal(state.sceneId, "c9");
  assert.equal(state.stats.hp, 8);
  assert.equal(state.stats.xp, 50);
  assert.equal(state.stats.wallet, 0);
  assert.equal(state.stats.pendingReward, 50);
  assert.equal(state.stats.reserve, 9);
  assert.equal(state.stats.inspector, 16);
  assert.equal(state.evidence.length, 6);
});

test("every decision scene has exactly one suggested move with a reason and tradeoff", () => {
  for (const scene of Object.values(SCENES)) {
    if (!scene.choices.length) continue;
    const suggested = scene.choices.filter((choice) => choice.recommended);
    assert.equal(suggested.length, 1, `${scene.id} must have exactly one suggested move`);
    for (const choice of scene.choices) {
      assert.ok(choice.label, `${scene.id}/${choice.id} needs a label`);
      assert.ok(choice.summary, `${scene.id}/${choice.id} needs a summary`);
      assert.ok(choice.why, `${scene.id}/${choice.id} needs reasoning`);
      assert.ok(choice.tradeoff, `${scene.id}/${choice.id} needs a tradeoff`);
    }
  }
});

test("all story branches point to real scenes", () => {
  for (const scene of Object.values(SCENES)) {
    for (const choice of scene.choices) {
      for (const nextId of allNextIds(choice)) {
        assert.ok(SCENES[nextId], `${scene.id}/${choice.id} points to missing scene ${nextId}`);
      }
    }
  }
});

test("five morally challenging Legacy Decision scenes persist world effects", () => {
  const legacyScenes = Object.values(SCENES).filter((scene) => scene.legacyDecision);
  assert.equal(legacyScenes.length, 5);
  for (const scene of legacyScenes) {
    assert.ok(scene.choices.length >= 3, `${scene.id} needs at least three moral routes`);
    for (const choice of scene.choices) {
      assert.ok(choice.legacy?.immediate, `${scene.id}/${choice.id} needs an immediate consequence`);
      assert.ok(choice.legacy?.future, `${scene.id}/${choice.id} needs a future consequence`);
      assert.ok(Object.keys(choice.world || {}).length > 0, `${scene.id}/${choice.id} must change world state`);
    }
  }
});

test("the full suggested route completes the contract and allocates the first fifty", () => {
  let state = createReplayState();
  let safety = 0;

  while (state.sceneId !== "close" && safety < 30) {
    const scene = getScene(state.sceneId);
    const suggested = scene.choices.find((choice) => choice.recommended);
    assert.ok(suggested, `${scene.id} has no suggested choice`);
    const roll = suggested.check
      ? rollCheck(suggested.check, Array(suggested.check.advantage ? 2 : 1).fill(20))
      : null;
    const resolved = resolveChoice(state, suggested, roll);
    assert.equal(resolved.result.blocked, false);
    state = resolved.state;
    safety += 1;
  }

  assert.equal(state.sceneId, "close");
  assert.equal(state.paymentClaimed, true);
  assert.equal(state.stats.totalEarned, 50);
  assert.equal(state.stats.wallet, 0);
  assert.equal(state.funds.operations, 25);
  assert.equal(state.funds.residents, 25);
  assert.equal(state.legacyDecisions.length, 5);
  assert.equal(state.flags.duplicatePaymentBlocked, undefined);
});

test("the payment gate credits Tay exactly once and blocks duplicates", () => {
  let state = createCurrentCheckpointState();
  state.sceneId = "payment";
  state.stage = "payment";
  state.flags.approved = true;
  const paymentChoice = getChoice("payment", "claim-payment");

  const first = resolveChoice(state, paymentChoice);
  assert.equal(first.result.special.claimed, true);
  assert.equal(first.state.stats.wallet, 50);
  assert.equal(first.state.stats.totalEarned, 50);

  const duplicate = resolveChoice(first.state, paymentChoice);
  assert.equal(duplicate.result.blocked, true);
  assert.equal(duplicate.result.special.reason, "duplicate");
  assert.equal(duplicate.state.stats.wallet, 50);
  assert.equal(duplicate.state.stats.totalEarned, 50);
  assert.equal(duplicate.state.flags.duplicatePaymentBlocked, true);
});

test("the cast index identifies itself as a chapter subset and keeps known canon locked", () => {
  assert.equal(createReplayState().rosterScope, "chapter-subset");
  assert.equal(CHAPTER_CAST.tay.name, "Tay Crowne");
  assert.equal(CHAPTER_CAST.dawn.name, "Dawn Crowne");
  assert.equal(CHAPTER_CAST.kai.name, "Kai");
  assert.equal(CHAPTER_CAST.tay.canon, "locked");
  assert.equal(CHAPTER_CAST.dawn.portrait, null);
  assert.equal(CHAPTER_CAST.kai.portrait, null);
});
