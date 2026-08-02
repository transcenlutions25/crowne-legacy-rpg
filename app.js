import {
  CHAPTER_CAST,
  CONTRACT_CHAIN,
  EVIDENCE_CATALOG,
  getChoice,
  getScene
} from "./story.js";
import {
  SAVE_KEY,
  SETTINGS_KEY,
  createCurrentCheckpointState,
  createReplayState,
  deriveEnding,
  getEvidenceLabels,
  getStageProgress,
  getWorldSignals,
  normalizeState,
  resolveChoice,
  rollCheck
} from "./game-engine.js";

const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");

const DEFAULT_SETTINGS = Object.freeze({
  sound: true,
  motion: true,
  largeText: false,
  highContrast: true,
  haptics: true
});

let gameState = loadSavedState();
let view = "title";
let modal = null;
let installPrompt = null;
let audioContext = null;
let settings = loadSettings();

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadSavedState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch {
    return null;
  }
}

function saveState() {
  if (!gameState) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch {
    showToast("This browser could not save progress.");
  }
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // The game still runs if preference storage is unavailable.
  }
}

function applySettings() {
  document.documentElement.classList.toggle("large-text", settings.largeText);
  document.documentElement.classList.toggle("motion-off", !settings.motion);
  document.documentElement.classList.toggle("high-contrast", settings.highContrast);
}

function showToast(message) {
  toastRegion.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  window.setTimeout(() => {
    toastRegion.innerHTML = "";
  }, 2600);
}

function haptic(pattern = 12) {
  if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
}

function tone(kind = "tap") {
  if (!settings.sound) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime;
    const profiles = {
      tap: [220, 0.025, 0.04],
      roll: [155, 0.12, 0.07],
      success: [392, 0.22, 0.09],
      failure: [130, 0.24, 0.08],
      crown: [523.25, 0.36, 0.1]
    };
    const [frequency, duration, volume] = profiles[kind] || profiles.tap;
    oscillator.type = kind === "failure" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    if (kind === "success" || kind === "crown") {
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  } catch {
    // Audio feedback is optional.
  }
}

function render() {
  applySettings();
  app.innerHTML = view === "title" ? renderTitle() : renderGame();
  document.body.dataset.view = view;
  window.requestAnimationFrame(() => {
    const focusTarget = document.querySelector("[data-autofocus]");
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  });
}

function crest(size = "brand") {
  return `<img class="crest crest--${size}" src="assets/crowne-crest.svg" alt="" />`;
}

function renderTitle() {
  const saved = gameState;
  const savedScene = saved ? getScene(saved.sceneId) : null;
  const primaryLabel = saved
    ? saved.sceneId === "close" ? "View Completed Contract" : `Resume as Tay • ${savedScene.act}`
    : "Continue as Tay at C-9";
  const primaryAction = saved ? "resume" : "start-checkpoint";

  return `
    <main class="title-screen">
      <div class="title-screen__art" aria-hidden="true"></div>
      <div class="title-screen__scrim" aria-hidden="true"></div>
      <header class="title-topbar">
        <div class="wordmark">${crest("small")}<span>CROWNE LEGACY</span></div>
        <button class="icon-button" data-action="open-settings" aria-label="Open settings">
          <span aria-hidden="true">⌁</span>
        </button>
      </header>

      <section class="title-content">
        <div class="chapter-kicker"><span></span> CONTRACT 01</div>
        <h1>The Blackout<br /><em>Contract</em></h1>
        <p class="title-lead">Play as Tay Crowne. Restore a sabotaged tower, protect its residents, and decide what kind of power the Crowne legacy will become.</p>

        <div class="title-promise" aria-label="Game features">
          <div><strong>5</strong><span>Persistent Legacy Decisions</span></div>
          <div><strong>∞</strong><span>Canon Registry, Additive Only</span></div>
          <div><strong>1×</strong><span>Verified Payment Gate</span></div>
        </div>

        <div class="title-actions">
          <button class="button button--primary button--hero" data-action="${primaryAction}" data-autofocus>
            <span>${escapeHtml(primaryLabel)}</span><span aria-hidden="true">›</span>
          </button>
          <button class="button button--secondary" data-action="start-replay">
            Replay the Full Contract
          </button>
        </div>

        <p class="title-fineprint">Android-first installable vertical slice • Offline play • Local autosave</p>
      </section>

      <footer class="title-footer">
        <span>OBSIDIAN / COBALT / GOLD</span>
        <span>QUESTFORGE STORY SYSTEM</span>
      </footer>
    </main>
    ${renderModal()}
  `;
}

function renderGame() {
  if (!gameState) return renderTitle();
  const scene = getScene(gameState.sceneId);
  const isClose = scene.id === "close";

  return `
    <main class="game-screen ${scene.legacyDecision ? "game-screen--legacy" : ""}">
      <div class="scene-backdrop" style="--scene-image: url('${scene.art}'); --scene-position: ${scene.artPosition}" aria-hidden="true"></div>
      <header class="game-topbar">
        <button class="brand-button" data-action="go-title" aria-label="Return to title">
          ${crest("tiny")}
          <span><b>CROWNE</b><small>LEGACY</small></span>
        </button>
        <div class="topbar-actions">
          <button class="compact-stat" data-action="open-ledger" aria-label="Open wallet and ledger">
            <span>WALLET</span><strong>${gameState.stats.wallet}<i> C</i></strong>
          </button>
          <button class="icon-button" data-action="open-settings" aria-label="Open settings"><span aria-hidden="true">⌁</span></button>
        </div>
      </header>

      ${renderContractRail(scene.stage)}

      <section class="scene-hero">
        <img src="${scene.art}" alt="${escapeHtml(scene.artAlt)}" style="object-position: ${scene.artPosition}" />
        <div class="scene-hero__shade" aria-hidden="true"></div>
        <div class="scene-hero__meta">
          <span class="scene-act ${scene.legacyDecision ? "scene-act--legacy" : ""}">${escapeHtml(scene.act)}</span>
          <span class="scene-location">${escapeHtml(scene.location)}</span>
          <h1>${escapeHtml(scene.title)}</h1>
        </div>
        ${renderHud()}
      </section>

      <section class="story-panel">
        ${renderSpeaker(scene)}
        ${scene.legacyDecision ? renderLegacyWarning() : ""}
        <div class="objective-card">
          <span>ACTIVE OBJECTIVE</span>
          <p>${escapeHtml(scene.objective)}</p>
        </div>
        <div class="story-copy">
          ${scene.copy.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        ${renderContextEchoes(scene)}
        ${isClose ? renderCloseSummary() : renderDecisionArea(scene)}
      </section>

      ${renderBottomNav()}
    </main>
    ${renderModal()}
  `;
}

function renderContractRail(currentStage) {
  const current = getStageProgress(currentStage);
  return `
    <nav class="contract-rail" aria-label="Contract progress">
      ${CONTRACT_CHAIN.map((step, index) => `
        <div class="contract-step ${index < current ? "is-done" : ""} ${index === current ? "is-current" : ""}">
          <span class="contract-step__dot">${index < current ? "✓" : index + 1}</span>
          <small>${step.label}</small>
        </div>
      `).join("")}
    </nav>
  `;
}

function renderHud() {
  const { stats } = gameState;
  const hpPercent = Math.round((stats.hp / stats.maxHp) * 100);
  const reserveDanger = stats.reserve <= 5;
  const inspectorDanger = stats.inspector <= 5;
  return `
    <div class="hud" aria-label="Tay's current status">
      <div class="hud-card hud-card--identity">
        <span class="hud-avatar">TC</span>
        <span><small>TAY • LV ${stats.level}</small><strong>${stats.hp}/${stats.maxHp} HP</strong></span>
        <i class="hp-line"><b style="width:${hpPercent}%"></b></i>
      </div>
      <div class="hud-card ${reserveDanger ? "hud-card--danger" : ""}">
        <small>RESERVE</small><strong>${stats.reserve}<i>m</i></strong>
      </div>
      <div class="hud-card ${inspectorDanger ? "hud-card--danger" : ""}">
        <small>INSPECTOR</small><strong>${stats.inspector}<i>m</i></strong>
      </div>
      <div class="hud-card">
        <small>EVIDENCE</small><strong>${gameState.evidence.length}<i> files</i></strong>
      </div>
    </div>
  `;
}

function renderSpeaker(scene) {
  const speaker = CHAPTER_CAST[scene.speaker] || CHAPTER_CAST.tay;
  const avatar = speaker.portrait
    ? `<span class="speaker-avatar speaker-avatar--photo" style="background-image:url('${speaker.portrait}')"><i>${speaker.initials}</i></span>`
    : `<span class="speaker-avatar"><i>${speaker.initials}</i></span>`;
  return `
    <div class="speaker-row">
      ${avatar}
      <div><strong>${escapeHtml(speaker.name)}</strong><span>${escapeHtml(speaker.role)}</span></div>
      <small>${escapeHtml(scene.transmission)}</small>
    </div>
  `;
}

function renderLegacyWarning() {
  return `
    <div class="legacy-warning">
      <span class="legacy-symbol" aria-hidden="true">◇</span>
      <div><strong>LEGACY DECISION</strong><p>This choice permanently changes relationships, resources, or who holds power. There is no perfect answer.</p></div>
    </div>
  `;
}

function getContextEchoes() {
  const flags = gameState.flags;
  const echoes = [];
  if (flags.truthPolicy === "material-under-seal") echoes.push("Nia remains on the channel because Tay separated accountability from humiliation.");
  if (flags.truthPolicy === "full-publication") echoes.push("The full loan file is spreading through Crownspire. Nia has stopped answering private messages.");
  if (flags.truthPolicy === "concealed") echoes.push("Dawn's silence around the omitted loan is deliberate. The choice now belongs to the Crowne record.");
  if (flags.loadPriority === "life-safety") echoes.push("Medical circuits hold while market loss reports accumulate below.");
  if (flags.loadPriority === "residences") echoes.push("Every occupied home stays lit, but the market has gone completely dark.");
  if (flags.loadPriority === "equal-share") echoes.push("The grid is equal by percentage. Residents with medical needs do not experience it as equal.");
  if (flags.caseCustody === "shared") echoes.push("The Residents' Circle now holds one of three master evidence keys.");
  if (flags.caseCustody === "crowne") echoes.push("Tay and Dawn control the only master key. That control is already becoming a political fact.");
  if (flags.caseCustody === "civic") echoes.push("Civic Works holds the master key. Tay can verify the case but cannot command it.");
  if (flags.copperlineResponse === "resident-mandate") echoes.push("The Circle chose a public fight with a temporary lien freeze. Copperline knows the tower can organize.");
  if (flags.copperlineResponse === "rejected-by-tay") echoes.push("Tay preserved the case himself. Some residents are grateful; others wanted the choice.");
  if (flags.copperlineResponse === "settled") echoes.push("The lien is gone and losses are covered. The monitor evidence is sealed against the next victim.");
  return echoes.slice(-2);
}

function renderContextEchoes(scene) {
  if (scene.id === "briefing" || scene.id === "worksite") return "";
  const echoes = getContextEchoes();
  if (!echoes.length) return "";
  return `
    <aside class="echo-card">
      <span>THE WORLD REMEMBERS</span>
      ${echoes.map((echo) => `<p>${escapeHtml(echo)}</p>`).join("")}
    </aside>
  `;
}

function renderDecisionArea(scene) {
  const visibleChoices = scene.choices.filter((item) => !item.once || !gameState.flags[item.once]);
  const suggested = visibleChoices.find((item) => item.recommended) || visibleChoices[0];
  if (!suggested) return "";

  return `
    <section class="decision-area" aria-labelledby="decision-title">
      <div class="suggested-card">
        <div class="suggested-card__eyebrow"><span>✦</span> TAY'S SUGGESTED MOVE</div>
        <h2>${escapeHtml(suggested.label)}</h2>
        <p>${escapeHtml(suggested.why)}</p>
        <div class="tradeoff"><strong>REAL COST</strong><span>${escapeHtml(suggested.tradeoff)}</span></div>
        <button class="button button--suggested" data-action="choose" data-choice="${suggested.id}">
          Lock Suggested <span aria-hidden="true">›</span>
        </button>
      </div>

      <div class="choices-heading">
        <div><span>DECISION</span><h2 id="decision-title">Choose Tay's move</h2></div>
        <small>${visibleChoices.length} routes</small>
      </div>

      <div class="choice-list">
        ${visibleChoices.map((item, index) => renderChoice(item, index)).join("")}
      </div>
    </section>
  `;
}

function renderChoice(choice, index) {
  const checkLabel = choice.check
    ? `${choice.check.skill} ${formatModifier(choice.check.modifier)} • DC ${choice.check.dc}${choice.check.advantage ? " • ADVANTAGE" : ""}`
    : "VERIFIED • NO ROLL";
  return `
    <article class="choice-card ${choice.recommended ? "choice-card--suggested" : ""} ${choice.legacy ? "choice-card--legacy" : ""}">
      <button data-action="choose" data-choice="${choice.id}" aria-label="Choose ${escapeHtml(choice.label)}">
        <span class="choice-card__number">${String(index + 1).padStart(2, "0")}</span>
        <span class="choice-card__body">
          <span class="choice-card__tags">
            ${choice.recommended ? "<i>SUGGESTED</i>" : ""}
            ${choice.legacy ? "<i class=\"legacy-tag\">PERSISTS</i>" : ""}
            <b>${escapeHtml(checkLabel)}</b>
          </span>
          <strong>${escapeHtml(choice.label)}</strong>
          <span>${escapeHtml(choice.summary)}</span>
          <span class="choice-card__tradeoff"><b>Tradeoff:</b> ${escapeHtml(choice.tradeoff)}</span>
          ${choice.legacy ? `
            <span class="choice-card__future"><b>World shift:</b> ${escapeHtml(choice.legacy.future)}</span>
          ` : ""}
        </span>
        <span class="choice-card__arrow" aria-hidden="true">›</span>
      </button>
    </article>
  `;
}

function formatModifier(modifier) {
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function renderCloseSummary() {
  const ending = deriveEnding(gameState);
  const signals = getWorldSignals(gameState).slice(0, 6);
  const evidenceLabels = getEvidenceLabels(gameState);
  return `
    <section class="close-summary">
      <div class="ending-card">
        <span>YOUR CROWNSPIRE LEGACY</span>
        <h2>${escapeHtml(ending.title)}</h2>
        <p>${escapeHtml(ending.summary)}</p>
      </div>

      <div class="close-grid">
        <div class="close-stat"><span>EARNED</span><strong>${gameState.stats.totalEarned} C</strong><small>Credited once</small></div>
        <div class="close-stat"><span>OPERATIONS</span><strong>${gameState.funds.operations} C</strong><small>Seed capital</small></div>
        <div class="close-stat"><span>RECOVERY</span><strong>${gameState.funds.residents} C</strong><small>Resident-controlled</small></div>
        <div class="close-stat"><span>EVIDENCE</span><strong>${evidenceLabels.length}</strong><small>Verified records</small></div>
      </div>

      <div class="world-report">
        <div class="section-label"><span>WORLD STATE</span><small>Changed by your decisions</small></div>
        ${signals.map((signal) => `
          <div class="world-signal">
            <span>${escapeHtml(signal.label)}</span>
            <i class="world-signal__track"><b class="${signal.value < 0 ? "is-negative" : ""}" style="--signal:${Math.min(100, Math.abs(signal.value) * 11)}%"></b></i>
            <strong>${signal.value > 0 ? "+" : ""}${signal.value}</strong>
          </div>
        `).join("")}
      </div>

      <div class="legacy-ledger">
        <div class="section-label"><span>LEGACY DECISIONS</span><small>${gameState.legacyDecisions.length} locked</small></div>
        ${gameState.legacyDecisions.length
          ? gameState.legacyDecisions.map((decision, index) => `
            <article><b>${String(index + 1).padStart(2, "0")}</b><div><strong>${escapeHtml(decision.title)}</strong><p>${escapeHtml(decision.future)}</p></div></article>
          `).join("")
          : "<p class=\"empty-note\">This checkpoint began after the first two Legacy Decisions. Replay the full contract to shape all five.</p>"}
      </div>

      <div class="completion-actions">
        <button class="button button--primary" data-action="start-replay">Replay Full Contract</button>
        <button class="button button--secondary" data-action="go-title">Return to Title</button>
      </div>
    </section>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Game records">
      <button data-action="open-evidence"><span aria-hidden="true">⌑</span><small>Evidence</small><i>${gameState.evidence.length}</i></button>
      <button data-action="open-ledger"><span aria-hidden="true">▤</span><small>Ledger</small><i>${gameState.ledger.length}</i></button>
      <button data-action="open-cast"><span aria-hidden="true">◈</span><small>Chapter Cast</small></button>
      <button data-action="open-settings"><span aria-hidden="true">⌁</span><small>Settings</small></button>
    </nav>
  `;
}

function renderModal() {
  if (!modal) return "";
  if (modal.type === "check") return renderCheckModal();
  if (modal.type === "legacy") return renderLegacyModal();
  if (modal.type === "result") return renderResultModal();
  if (modal.type === "evidence") return renderEvidenceSheet();
  if (modal.type === "ledger") return renderLedgerSheet();
  if (modal.type === "cast") return renderCastSheet();
  if (modal.type === "settings") return renderSettingsSheet();
  if (modal.type === "confirm-replay") return renderConfirmReplay();
  return "";
}

function modalShell(content, options = {}) {
  return `
    <div class="modal-layer ${options.sheet ? "modal-layer--sheet" : ""}" role="presentation">
      <button class="modal-backdrop" data-action="close-modal" aria-label="Close dialog"></button>
      <section class="modal-card ${options.className || ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        ${content}
      </section>
    </div>
  `;
}

function renderCheckModal() {
  const choice = modal.choice;
  const check = choice.check;
  const roll = modal.roll;
  return modalShell(`
    <div class="modal-grip" aria-hidden="true"></div>
    <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
    <span class="modal-kicker">OPEN CHECK</span>
    <h2 id="modal-title">${escapeHtml(choice.label)}</h2>
    <p class="modal-summary">${escapeHtml(choice.summary)}</p>

    <div class="check-formula">
      <div><span>SKILL</span><strong>${escapeHtml(check.skill)}</strong></div>
      <div><span>MOD</span><strong>${formatModifier(check.modifier)}</strong></div>
      <div><span>DC</span><strong>${check.dc}</strong></div>
      <div><span>ROLL</span><strong>${check.advantage ? "2d20 ↑" : "1d20"}</strong></div>
    </div>

    ${roll ? renderRollResult(roll) : `
      <div class="dice-stage" aria-hidden="true"><span class="d20">20</span><i></i></div>
      <p class="check-note">The natural roll, modifier, target DC, total, and outcome stay visible before you commit.</p>
      <button class="button button--primary" data-action="roll-dice" data-autofocus>Roll ${check.advantage ? "with Advantage" : "the d20"}</button>
      <button class="text-button" data-action="close-modal">Choose another route</button>
    `}
  `, { className: "check-modal" });
}

function renderRollResult(roll) {
  return `
    <div class="rolled-result ${roll.success ? "is-success" : "is-failure"}">
      <div class="rolled-die"><small>NATURAL</small><strong>${roll.natural}</strong>${roll.advantage ? `<span>${roll.rolls.join(" / ")}</span>` : ""}</div>
      <div class="rolled-math"><span>${roll.natural}</span><i>${formatModifier(roll.modifier)}</i><b>=</b><strong>${roll.total}</strong></div>
      <div class="rolled-verdict"><span>${roll.success ? "CHECK PASSED" : "CHECK FAILED"}</span><small>Total ${roll.total} vs DC ${roll.dc}</small></div>
    </div>
    <button class="button ${roll.success ? "button--primary" : "button--danger"}" data-action="commit-roll" data-autofocus>Commit Outcome</button>
    <p class="locked-roll">This roll is locked. The consequence applies when committed.</p>
  `;
}

function renderLegacyModal() {
  const choice = modal.choice;
  return modalShell(`
    <div class="modal-grip" aria-hidden="true"></div>
    <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
    <span class="modal-kicker modal-kicker--legacy">LEGACY DECISION</span>
    <h2 id="modal-title">${escapeHtml(choice.label)}</h2>
    <p class="modal-summary">${escapeHtml(choice.summary)}</p>
    <div class="legacy-confirm-grid">
      <div><span>IMMEDIATE</span><p>${escapeHtml(choice.legacy.immediate)}</p></div>
      <div><span>FUTURE RISK</span><p>${escapeHtml(choice.legacy.future)}</p></div>
      <div><span>TAY'S REASONING</span><p>${escapeHtml(choice.why)}</p></div>
      <div><span>REAL COST</span><p>${escapeHtml(choice.tradeoff)}</p></div>
    </div>
    <button class="button button--legacy" data-action="commit-legacy" data-autofocus>Lock This Legacy Decision</button>
    <button class="text-button" data-action="close-modal">Return to all choices</button>
  `, { className: "legacy-modal" });
}

function renderResultModal() {
  const result = modal.result;
  const isFailure = result.check && !result.success;
  const isLegacy = Boolean(modal.choice.legacy);
  return modalShell(`
    <div class="result-sigil ${isFailure ? "is-failure" : ""} ${isLegacy ? "is-legacy" : ""}">${isFailure ? "!" : isLegacy ? "◇" : "✓"}</div>
    <span class="modal-kicker">${isLegacy ? "WORLD STATE CHANGED" : isFailure ? "SETBACK RECORDED" : "MOVE RESOLVED"}</span>
    <h2 id="modal-title">${escapeHtml(modal.choice.label)}</h2>
    <p class="result-copy">${escapeHtml(result.text)}</p>
    ${result.special?.claimed ? `<div class="payment-flash"><span>WALLET CREDIT</span><strong>+${result.special.amount} C</strong><small>Duplicate gate locked</small></div>` : ""}
    ${result.special?.allocated ? `<div class="allocation-flash"><span>OPERATIONS <b>${result.special.operations} C</b></span><span>RECOVERY <b>${result.special.residents} C</b></span></div>` : ""}
    ${isLegacy ? `<div class="legacy-after"><span>LATER</span><p>${escapeHtml(modal.choice.legacy.future)}</p></div>` : ""}
    <button class="button button--primary" data-action="continue-result" data-autofocus>Continue</button>
  `, { className: "result-modal" });
}

function renderEvidenceSheet() {
  const labels = gameState ? getEvidenceLabels(gameState) : [];
  return modalShell(`
    <div class="sheet-header"><div><span>CONTRACT RECORD</span><h2 id="modal-title">Evidence Suite</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>
    <p class="sheet-intro">Every item is preserved under Tay's contract slate. Choices can strengthen, expose, seal, or politically weaken the case.</p>
    <div class="evidence-list">
      ${labels.length ? labels.map((label, index) => `
        <article><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(label)}</strong><small>HASH VERIFIED • CUSTODY CLEAN</small></div><i>✓</i></article>
      `).join("") : `<div class="empty-state">No evidence secured yet. Tay's diagnostic choices will build the chain.</div>`}
    </div>
  `, { sheet: true, className: "sheet-card" });
}

function renderLedgerSheet() {
  if (!gameState) return "";
  return modalShell(`
    <div class="sheet-header"><div><span>CROWNE SYSTEM</span><h2 id="modal-title">Contract Ledger</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="wallet-panel">
      <div><span>CURRENT WALLET</span><strong>${gameState.stats.wallet}<i> C</i></strong></div>
      <div><span>TOTAL VERIFIED</span><strong>${gameState.stats.totalEarned}<i> C</i></strong></div>
      <div><span>PENDING</span><strong>${gameState.stats.pendingReward}<i> C</i></strong></div>
    </div>
    <div class="payment-guard ${gameState.paymentClaimed ? "is-locked" : ""}"><span>${gameState.paymentClaimed ? "✓" : "○"}</span><div><strong>ONE-TIME PAYMENT GATE</strong><small>${gameState.paymentClaimed ? "LOCKED • DUPLICATE CREDIT BLOCKED" : "OPEN • WAITING FOR VERIFIED APPROVAL"}</small></div></div>
    <div class="ledger-list">
      ${[...gameState.ledger].reverse().map((entry) => `
        <article><span>${formatTime(entry.at)}</span><div><strong>${escapeHtml(entry.type.replaceAll("-", " ").toUpperCase())}</strong><p>${escapeHtml(entry.text)}</p></div></article>
      `).join("")}
    </div>
  `, { sheet: true, className: "sheet-card" });
}

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "NOW";
  }
}

function renderCastSheet() {
  const cast = Object.values(CHAPTER_CAST).filter((member) => member.canon !== "faction");
  return modalShell(`
    <div class="sheet-header"><div><span>CANON REGISTRY</span><h2 id="modal-title">This Chapter's Cast</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="canon-notice"><strong>THIS IS NOT THE FULL ROSTER</strong><p>Crowne Legacy has a larger user-created cast. This screen lists only characters active or referenced in The Blackout Contract. Registry updates are additive. Characters are never renamed, replaced, or given unverified portraits.</p></div>
    <div class="cast-list">
      ${cast.map((member) => `
        <article>
          ${member.portrait
            ? `<span class="cast-avatar cast-avatar--photo" style="background-image:url('${member.portrait}')"><i>${member.initials}</i></span>`
            : `<span class="cast-avatar"><i>${member.initials}</i></span>`}
          <div><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.role)}</span><small>${member.canon === "locked" ? "CANON LOCKED" : "CHAPTER SUPPORT"}</small></div>
        </article>
      `).join("")}
    </div>
  `, { sheet: true, className: "sheet-card" });
}

function renderSettingsSheet() {
  return modalShell(`
    <div class="sheet-header"><div><span>ACCESSIBILITY</span><h2 id="modal-title">Game Settings</h2></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>
    <div class="settings-list">
      ${renderSetting("sound", "Sound cues", "Short interface tones only. No speech is required.")}
      ${renderSetting("haptics", "Haptic feedback", "Uses supported Android vibration for rolls and decisions.")}
      ${renderSetting("motion", "Cinematic motion", "Disable parallax, glows, and scene transitions.")}
      ${renderSetting("largeText", "Large text", "Increases body text and decision-card sizing.")}
      ${renderSetting("highContrast", "High contrast", "Strengthens text, borders, and focus indicators.")}
    </div>
    <div class="install-card">
      <div><strong>INSTALL ON ANDROID</strong><p>${installPrompt ? "Install this build as a full-screen offline game." : "In Chrome, open the menu and choose Add to Home screen or Install app."}</p></div>
      <button class="button button--secondary" data-action="install" ${installPrompt ? "" : "disabled"}>${installPrompt ? "Install" : "Use Chrome Menu"}</button>
    </div>
    ${gameState ? `<button class="danger-link" data-action="confirm-replay">Reset and replay the contract</button>` : ""}
  `, { sheet: true, className: "sheet-card settings-sheet" });
}

function renderSetting(id, label, description) {
  const checked = Boolean(settings[id]);
  return `
    <button class="setting-row" data-action="toggle-setting" data-setting="${id}" role="switch" aria-checked="${checked}">
      <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>
      <i class="switch ${checked ? "is-on" : ""}"><b></b></i>
    </button>
  `;
}

function renderConfirmReplay() {
  return modalShell(`
    <span class="modal-kicker">RESET LOCAL SAVE</span>
    <h2 id="modal-title">Replay from contract acceptance?</h2>
    <p class="modal-summary">This replaces the current local checkpoint. The packaged Questforge campaign files remain untouched.</p>
    <button class="button button--danger" data-action="start-replay-confirmed" data-autofocus>Reset and Replay</button>
    <button class="text-button" data-action="close-modal">Keep Current Save</button>
  `, { className: "confirm-modal" });
}

function choose(choiceId) {
  if (!gameState) return;
  const choice = getChoice(gameState.sceneId, choiceId);
  if (!choice) return;
  tone("tap");
  haptic(10);
  if (choice.check) {
    modal = { type: "check", choice, roll: null };
  } else if (choice.legacy) {
    modal = { type: "legacy", choice };
  } else {
    commitChoice(choice, null);
    return;
  }
  render();
}

function commitChoice(choice, roll) {
  const resolved = resolveChoice(gameState, choice, roll);
  gameState = resolved.state;
  saveState();
  if (resolved.result.blocked) {
    modal = null;
    showToast(resolved.result.text);
    render();
    return;
  }
  tone(resolved.result.success ? (choice.legacy ? "crown" : "success") : "failure");
  haptic(choice.legacy ? [20, 45, 30] : resolved.result.success ? [12, 28, 12] : [40, 30, 40]);
  modal = { type: "result", choice, result: resolved.result };
  render();
}

function startCheckpoint() {
  gameState = createCurrentCheckpointState();
  saveState();
  view = "game";
  modal = null;
  tone("crown");
  render();
}

function startReplay() {
  if (gameState && gameState.history.length > 0) {
    modal = { type: "confirm-replay" };
    render();
    return;
  }
  startReplayConfirmed();
}

function startReplayConfirmed() {
  gameState = createReplayState();
  saveState();
  view = "game";
  modal = null;
  tone("crown");
  render();
}

function resumeGame() {
  if (!gameState) return startCheckpoint();
  view = "game";
  modal = null;
  render();
}

async function installApp() {
  if (!installPrompt) {
    showToast("Open Chrome's menu and choose Install app or Add to Home screen.");
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  render();
}

app.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger || trigger.disabled) return;
  const action = trigger.dataset.action;
  if (action === "choose") choose(trigger.dataset.choice);
  if (action === "start-checkpoint") startCheckpoint();
  if (action === "start-replay") startReplay();
  if (action === "start-replay-confirmed") startReplayConfirmed();
  if (action === "resume") resumeGame();
  if (action === "go-title") {
    view = "title";
    modal = null;
    render();
  }
  if (action === "close-modal") {
    modal = null;
    render();
  }
  if (action === "continue-result") {
    modal = null;
    render();
    window.scrollTo({ top: 0, behavior: settings.motion ? "smooth" : "auto" });
  }
  if (action === "roll-dice" && modal?.type === "check") {
    const params = new URLSearchParams(location.search);
    const forced = Number(params.get("testRoll"));
    const localTest = ["localhost", "127.0.0.1"].includes(location.hostname) && forced >= 1 && forced <= 20;
    const count = modal.choice.check.advantage ? 2 : 1;
    modal.roll = rollCheck(modal.choice.check, localTest ? Array(count).fill(forced) : null);
    tone("roll");
    haptic([15, 20, 15, 20, 25]);
    render();
  }
  if (action === "commit-roll" && modal?.type === "check" && modal.roll) {
    commitChoice(modal.choice, modal.roll);
  }
  if (action === "commit-legacy" && modal?.type === "legacy") {
    commitChoice(modal.choice, null);
  }
  if (action === "open-evidence" && gameState) {
    modal = { type: "evidence" };
    render();
  }
  if (action === "open-ledger" && gameState) {
    modal = { type: "ledger" };
    render();
  }
  if (action === "open-cast") {
    modal = { type: "cast" };
    render();
  }
  if (action === "open-settings") {
    modal = { type: "settings" };
    render();
  }
  if (action === "confirm-replay") {
    modal = { type: "confirm-replay" };
    render();
  }
  if (action === "toggle-setting") {
    const key = trigger.dataset.setting;
    if (key in settings) {
      settings[key] = !settings[key];
      saveSettings();
      tone("tap");
      render();
    }
  }
  if (action === "install") installApp();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  if (modal?.type === "settings") render();
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  showToast("Crowne Legacy installed.");
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline installation is optional during local preview.
    });
  });
}

// Read-only diagnostics for automated verification. Game mutation stays inside the engine.
window.__CROWNE_DIAGNOSTICS__ = Object.freeze({
  getState: () => (gameState ? JSON.parse(JSON.stringify(gameState)) : null),
  getView: () => view,
  stateVersion: 3
});

applySettings();
render();
