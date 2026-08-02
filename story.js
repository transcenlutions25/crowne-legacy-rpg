export const CONTRACT_CHAIN = Object.freeze([
  { id: "accept", label: "Accept" },
  { id: "worksite", label: "Worksite" },
  { id: "completion", label: "Complete" },
  { id: "approval", label: "Approval" },
  { id: "payment", label: "Payment" },
  { id: "close", label: "Close" }
]);

// This is a chapter index, never a claim that these are the only Crowne Legacy characters.
// Entries are additive. A chapter update may add canon characters but may not replace one.
export const CHAPTER_CAST = Object.freeze({
  tay: Object.freeze({
    id: "tay",
    name: "Tay Crowne",
    initials: "TC",
    role: "Playable Lead • Systems Strategist",
    canon: "locked",
    portrait: "assets/tay-crownspire-relay-opening.webp"
  }),
  dawn: Object.freeze({
    id: "dawn",
    name: "Dawn Crowne",
    initials: "DC",
    role: "Operations Partner • Contract Strategy",
    canon: "locked",
    portrait: null
  }),
  kai: Object.freeze({
    id: "kai",
    name: "Kai",
    initials: "K",
    role: "Crowne Legacy • Referenced This Chapter",
    canon: "locked",
    portrait: null
  }),
  nia: Object.freeze({
    id: "nia",
    name: "Nia Vale",
    initials: "NV",
    role: "Crownspire Seven Superintendent",
    canon: "chapter_support",
    portrait: null
  }),
  civic: Object.freeze({
    id: "civic",
    name: "Civic Works",
    initials: "CW",
    role: "Inspection Authority",
    canon: "faction",
    portrait: null
  })
});

export const EVIDENCE_CATALOG = Object.freeze({
  "cobalt-pulse": "Reverse-fed cobalt pulse",
  "outbound-handshake": "Outbound relay handshake",
  "c9-map": "Master C-9 service map",
  "duplicated-credential": "Duplicated Nia credential",
  "early-notice": "Inspection notice sent to Copperline 48 hours early",
  "bridge-loan": "Nia's bridge-loan admission",
  "ceramic-scoring": "Deliberate ceramic scoring",
  "counterfeit-seal": "Counterfeit safety seal",
  "white-mortar": "White service-tunnel mortar witness statement",
  "public-witness": "Residents' Circle shutdown witness",
  "monitor-trace": "Remote monitor trace packet"
});

const choice = (config) => Object.freeze(config);
const scene = (config) => Object.freeze(config);

export const SCENES = Object.freeze({
  briefing: scene({
    id: "briefing",
    stage: "accept",
    act: "Contract 01",
    title: "The Blackout Contract",
    location: "Crownward • Remote Briefing",
    speaker: "dawn",
    transmission: "SECURE CROWNE CHANNEL",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne stands at Crownspire Seven's sparking arc relay in an obsidian work-command coat.",
    artPosition: "50% 24%",
    objective: "Lock clean terms before Crownspire Seven loses reserve power.",
    copy: [
      "Crownspire Seven is eighteen minutes from a building-wide blackout. A failed inspection would trigger Copperline Recovery's lien and put working families out of their homes.",
      "Dawn has already built the contract chain: accepted scope, worksite proof, completion record, Civic Works approval, verified payment, clean close. Fifty Crowns wait at the far end if Tay can make every link survive an audit."
    ],
    choices: [
      choice({
        id: "accept-clean",
        label: "Accept the verified scope",
        summary: "Lock the 50-Crown terms, evidence standard, and payment chain exactly as Dawn prepared them.",
        recommended: true,
        why: "It protects Tay from scope drift and makes Copperline's sabotage harder to bury.",
        tradeoff: "One minute is spent sealing the audit trail before Tay touches the relay.",
        check: null,
        next: "worksite",
        effects: { reserve: -1, inspector: -1 },
        flags: { contractAccepted: true, cleanTerms: true },
        ledger: "Contract accepted with verified 50-Crown scope.",
        result: "Dawn's seal meets Tay's. Every deliverable, time stamp, and payment condition turns cobalt blue. The job is live."
      }),
      choice({
        id: "tighten-hazard",
        label: "Tighten the hazard clause",
        summary: "Ask Civic Works to acknowledge sabotage risk before accepting the same 50-Crown contract.",
        recommended: false,
        why: "A signed hazard note could strengthen Tay's protection if the relay turns violent.",
        tradeoff: "The negotiation burns time and may make the inspector defensive.",
        check: { skill: "Persuasion", modifier: 6, dc: 12, advantage: false },
        success: {
          next: "worksite",
          effects: { reserve: -2, inspector: -2, xp: 10 },
          flags: { contractAccepted: true, hazardClause: true },
          ledger: "Contract accepted with Civic Works hazard acknowledgment.",
          result: "The inspector signs the hazard note. Tay gains protection without changing the residents' price."
        },
        failure: {
          next: "worksite",
          effects: { reserve: -3, inspector: -3 },
          flags: { contractAccepted: true, hazardClauseDenied: true },
          ledger: "Contract accepted after hazard-clause delay.",
          result: "Civic Works refuses new language. Dawn locks the original terms before the remaining time slips away."
        }
      }),
      choice({
        id: "red-team-terms",
        label: "Run a final red-team pass",
        summary: "Have Tay and Dawn challenge every clause once more, then accept only after the weak point is named.",
        recommended: false,
        why: "It can expose hidden scope language without involving the client.",
        tradeoff: "The review costs two minutes and finds no extra pay.",
        check: { skill: "Investigation", modifier: 6, dc: 11, advantage: true },
        success: {
          next: "worksite",
          effects: { reserve: -2, inspector: -2, xp: 10 },
          flags: { contractAccepted: true, auditReady: true },
          ledger: "Contract accepted after internal red-team review.",
          result: "Tay catches a vague completion phrase. Dawn replaces it with measurable voltage tolerances before acceptance."
        },
        failure: {
          next: "worksite",
          effects: { reserve: -2, inspector: -2 },
          flags: { contractAccepted: true },
          ledger: "Contract accepted after internal review.",
          result: "The terms hold. Nothing new surfaces, but the Crowne record now shows deliberate review."
        }
      })
    ]
  }),

  worksite: scene({
    id: "worksite",
    stage: "worksite",
    act: "Worksite",
    title: "A Failure Built to Happen",
    location: "Crownspire Seven • Relay Deck",
    speaker: "nia",
    transmission: "ONSITE",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne studies a sparking blue relay inside Crownspire Seven.",
    artPosition: "50% 42%",
    objective: "Find the safest route to stable power without destroying the sabotage trail.",
    copy: [
      "The relay is not simply failing. Ceramic channels were scored to make heat climb in a controlled pattern, and a cobalt pulse is feeding backward through an expansion port.",
      "Nia Vale keeps one hand near the emergency bypass. She needs Tay's skill, but something in the records room has her more frightened than the dark."
    ],
    choices: [
      choice({
        id: "diagnostic-sweep",
        label: "Run an evidence-safe diagnostic sweep",
        summary: "Map the live current, photograph the scoring, and identify the counterfeit seal before moving hardware.",
        recommended: true,
        why: "It gives Tay both the repair route and admissible proof with one disciplined pass.",
        tradeoff: "Two minutes come off both clocks while the relay stays unstable.",
        check: { skill: "Investigation", modifier: 6, dc: 11, advantage: false },
        success: {
          next: "records",
          effects: { reserve: -2, inspector: -2, xp: 15 },
          evidenceAdd: ["ceramic-scoring", "counterfeit-seal", "cobalt-pulse"],
          flags: { relayMapped: true },
          ledger: "Evidence-safe relay diagnostic completed.",
          result: "Tay reads the current like a confession. The damage is deliberate, the seal is counterfeit, and the pulse leads toward port C-9."
        },
        failure: {
          next: "records",
          effects: { reserve: -3, inspector: -3, hp: -1 },
          evidenceAdd: ["counterfeit-seal"],
          flags: { relayMappedPartial: true },
          ledger: "Partial relay diagnostic completed under arc surge.",
          result: "A false ground throws an arc across Tay's glove. He keeps the seal photo, but the deeper current map collapses into noise."
        }
      }),
      choice({
        id: "question-courier",
        label: "Question the resident courier",
        summary: "Follow the social route and compare Nia's account with the person who saw the last service worker.",
        recommended: false,
        why: "A witness can identify an intruder even if the relay evidence is later challenged.",
        tradeoff: "The live fault remains untouched during the interview.",
        check: { skill: "Insight", modifier: 3, dc: 12, advantage: false },
        success: {
          next: "records",
          effects: { reserve: -3, inspector: -3, xp: 15 },
          evidenceAdd: ["white-mortar", "duplicated-credential"],
          flags: { courierTrust: true },
          ledger: "Resident courier statement secured.",
          result: "The courier remembers white tunnel mortar and a utility badge carrying Nia's access color. The worker was an impostor."
        },
        failure: {
          next: "records",
          effects: { reserve: -3, inspector: -3 },
          flags: { courierUncertain: true },
          ledger: "Resident courier statement recorded as uncertain.",
          result: "The courier is scared and contradictory. Tay preserves the statement honestly instead of forcing certainty into the record."
        }
      }),
      choice({
        id: "cold-bypass",
        label: "Build a cold bypass first",
        summary: "Use the Crownkey toolkit to create a safer temporary circuit before investigating the sabotage.",
        recommended: false,
        why: "It can buy residents more reserve time before the deeper investigation.",
        tradeoff: "Working early risks disturbing physical evidence around C-9.",
        check: { skill: "Crownkey Toolkit", modifier: 5, dc: 13, advantage: false },
        success: {
          next: "records",
          effects: { reserve: 3, inspector: -2, xp: 15 },
          evidenceAdd: ["c9-map"],
          flags: { coldBypass: true },
          ledger: "Cold bypass added three minutes of reserve power.",
          result: "Tay seats the bypass without touching the scored channel. The tower gains three minutes, and C-9 becomes the obvious control point."
        },
        failure: {
          next: "records",
          effects: { reserve: -2, inspector: -2, hp: -2 },
          flags: { bypassFailed: true },
          ledger: "Cold bypass attempt aborted after live feedback.",
          result: "The counterfeit seal hides a live return. Tay breaks contact before it becomes lethal, but the relay takes its price in heat and time."
        }
      })
    ]
  }),

  records: scene({
    id: "records",
    stage: "worksite",
    act: "Worksite",
    title: "The Records Do Not Match",
    location: "Crownspire Seven • Records Bay",
    speaker: "nia",
    transmission: "PRIVATE",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne and Nia Vale inspect blue service records beside the C-9 expansion map.",
    artPosition: "50% 35%",
    objective: "Secure the records that connect the staged failure to outside access.",
    copy: [
      "A duplicate of Nia's credential opened the relay deck after midnight. The inspection notice reached Copperline Recovery forty-eight hours before it reached the tower.",
      "Nia admits she signed a bridge loan to cover emergency cooling repairs. She did not authorize sabotage, but the loan gave Copperline leverage and access."
    ],
    choices: [
      choice({
        id: "duplicate-records",
        label: "Duplicate the complete evidence suite",
        summary: "Hash the credential log, inspection notice, loan admission, handshake, and master C-9 map into Tay's contract slate.",
        recommended: true,
        why: "A complete duplicate preserves Nia's truth while protecting residents from Copperline's erasure attempt.",
        tradeoff: "The secure copy takes two minutes and alerts the records system that someone exported it.",
        check: null,
        next: "niaTruth",
        effects: { reserve: -2, inspector: -2, xp: 20 },
        evidenceAdd: ["cobalt-pulse", "outbound-handshake", "c9-map", "duplicated-credential", "early-notice", "bridge-loan"],
        flags: { evidenceSuite: true, exportLogged: true },
        ledger: "Complete records suite duplicated and hashed.",
        result: "Six records lock together under Tay's seal. The repair and the case now share one clean chain of custody."
      }),
      choice({
        id: "press-nia",
        label: "Press Nia for the full timeline",
        summary: "Use the inconsistencies to win a complete, recorded statement before copying the most relevant files.",
        recommended: false,
        why: "A voluntary account can explain why Nia's credential and Copperline's loan appear together.",
        tradeoff: "If Tay pushes too hard, Nia may protect herself and cost the team time.",
        check: { skill: "Persuasion", modifier: 6, dc: 13, advantage: false },
        success: {
          next: "niaTruth",
          effects: { reserve: -3, inspector: -3, xp: 20 },
          evidenceAdd: ["duplicated-credential", "early-notice", "bridge-loan", "c9-map"],
          flags: { niaCooperating: true },
          ledger: "Nia's voluntary timeline and core records secured.",
          result: "Tay makes the distinction plain: hidden debt is not proof of sabotage. Nia exhales and gives him the full timeline."
        },
        failure: {
          next: "niaTruth",
          effects: { reserve: -4, inspector: -4 },
          evidenceAdd: ["duplicated-credential", "early-notice"],
          flags: { niaDefensive: true },
          ledger: "Partial records secured after difficult interview.",
          result: "Nia shuts down around the loan. Tay records only what he can verify and refuses to turn suspicion into fact."
        }
      }),
      choice({
        id: "trace-handshake",
        label: "Trace the outbound handshake",
        summary: "Prioritize the live technical signal and follow it toward whoever is still watching the relay.",
        recommended: false,
        why: "The monitor may lead closer to the active saboteur than old paperwork can.",
        tradeoff: "The trace risks exposing Tay's slate and leaves some financial context behind.",
        check: { skill: "Investigation", modifier: 6, dc: 14, advantage: false },
        success: {
          next: "niaTruth",
          effects: { reserve: -3, inspector: -3, xp: 20 },
          evidenceAdd: ["cobalt-pulse", "outbound-handshake", "c9-map", "duplicated-credential"],
          flags: { monitorLocated: true },
          ledger: "Outbound relay handshake traced to a remote monitor.",
          result: "The signal folds through two civic relays, then lands on a Copperline maintenance shell. Someone is watching C-9 in real time."
        },
        failure: {
          next: "niaTruth",
          effects: { reserve: -4, inspector: -4 },
          evidenceAdd: ["outbound-handshake", "c9-map"],
          flags: { traceBurned: true },
          ledger: "Outbound handshake preserved, destination trace burned.",
          result: "The remote endpoint cuts loose. Tay loses the destination but preserves the handshake before the channel dies."
        }
      })
    ]
  }),

  niaTruth: scene({
    id: "niaTruth",
    stage: "worksite",
    act: "Legacy Decision I",
    title: "Truth Has a Blast Radius",
    location: "Crownspire Seven • Sealed Records Bay",
    speaker: "tay",
    transmission: "DECISION PERSISTS",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne and Nia Vale face a consequential decision over the Crownspire records.",
    artPosition: "50% 43%",
    objective: "Decide how much of Nia's bridge-loan secret belongs in the public record.",
    legacyDecision: true,
    copy: [
      "The bridge loan explains Copperline's access, but its private terms also expose Nia's family finances and mistakes that did not cause the sabotage.",
      "Tay can protect irrelevant privacy, publish everything in the name of transparency, or hide the loan to shield Nia. Each choice changes who trusts the Crowne operation when the next contract arrives."
    ],
    choices: [
      choice({
        id: "material-facts-under-seal",
        label: "Disclose material facts under seal",
        summary: "Give Civic Works the access terms and signed admission while redacting unrelated private details from the resident copy.",
        recommended: true,
        why: "It tells the truth needed to prove access without punishing Nia for facts that do not belong to the case.",
        tradeoff: "Some residents may see any redaction as elite protection, and Copperline still learns Nia cooperated.",
        check: null,
        next: "loadPriority",
        effects: { xp: 15 },
        flags: { truthPolicy: "material-under-seal", niaProtected: true },
        world: { communityTrust: 1, evidenceStrength: 2, niaTrust: 2, politicalHeat: 1, integrity: 2 },
        legacy: {
          title: "Privacy with accountability",
          immediate: "Civic Works receives the facts that establish access. Residents receive a truthful redacted copy.",
          future: "Tay gains a reputation for protecting people without hiding material evidence."
        },
        ledger: "Material bridge-loan facts disclosed under seal; unrelated private details redacted.",
        result: "Tay draws the line clause by clause. Nia's mistake enters the case. Her private life does not."
      }),
      choice({
        id: "publish-complete-loan",
        label: "Publish the complete loan file",
        summary: "Release every term, signature, message, and missed warning to the Residents' Circle and Civic Works.",
        recommended: false,
        why: "Total disclosure prevents anyone from accusing Tay of protecting an insider.",
        tradeoff: "Irrelevant private details become permanent, Nia may be scapegoated, and future witnesses may fear cooperating.",
        check: null,
        next: "loadPriority",
        effects: { xp: 10 },
        flags: { truthPolicy: "full-publication", niaExposed: true },
        world: { communityTrust: 1, evidenceStrength: 3, niaTrust: -3, politicalHeat: 3, integrity: 0 },
        legacy: {
          title: "Radical transparency",
          immediate: "Residents see the complete financing trap and every mistake Nia made.",
          future: "The case is harder to bury, but vulnerable witnesses may stop trusting Tay with sensitive truth."
        },
        ledger: "Complete bridge-loan file published without redaction.",
        result: "The full file leaves Tay's slate. Within minutes, residents know the truth, the rumors, and the private cost between them."
      }),
      choice({
        id: "conceal-bridge-loan",
        label: "Keep the bridge loan out of the case",
        summary: "Use the duplicated credential and relay records, but omit the financing link that gave Copperline leverage.",
        recommended: false,
        why: "It protects Nia from public blame and keeps residents focused on the actual saboteur.",
        tradeoff: "Tay knowingly weakens the motive and risks becoming part of the concealment if the loan surfaces later.",
        check: null,
        next: "loadPriority",
        effects: { xp: 5 },
        flags: { truthPolicy: "concealed", loanConcealed: true },
        world: { communityTrust: -2, evidenceStrength: -2, niaTrust: 3, politicalHeat: -1, integrity: -3 },
        legacy: {
          title: "Protective concealment",
          immediate: "Nia stays out of the public blast radius and the inspection case moves on narrower evidence.",
          future: "If the loan emerges, Copperline can attack Tay's credibility and divide the residents."
        },
        ledger: "Bridge-loan link withheld from the submitted sabotage case.",
        result: "Tay closes the loan file and leaves it behind. Nia is safer tonight. The silence now belongs to him too."
      })
    ]
  }),

  loadPriority: scene({
    id: "loadPriority",
    stage: "worksite",
    act: "Legacy Decision II",
    title: "Nine Minutes for a Whole Tower",
    location: "Crownspire Seven • Emergency Grid",
    speaker: "dawn",
    transmission: "DECISION PERSISTS",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne stands before the failing Crownspire relay as reserve power runs low.",
    artPosition: "50% 46%",
    objective: "Choose who receives scarce reserve power while Tay prepares the C-9 isolation.",
    legacyDecision: true,
    copy: [
      "The emergency grid cannot protect every circuit for the final approach. Residential medical equipment, fire doors and stair lights, and the ground-floor market refrigeration all draw from the same reserve.",
      "No allocation is painless. Dawn needs Tay's priority order now."
    ],
    choices: [
      choice({
        id: "critical-triage",
        label: "Protect life-safety circuits first",
        summary: "Keep medical outlets, fire doors, stair lights, and one elevator alive. Let market refrigeration and comfort systems fail.",
        recommended: true,
        why: "It gives the most protection to immediate human safety with the reserve that remains.",
        tradeoff: "Market vendors lose perishable stock, and some families lose income even if every resident gets home safely.",
        check: null,
        next: "c9",
        effects: { reserve: -1, inspector: -1, xp: 15 },
        flags: { loadPriority: "life-safety", vendorLosses: true },
        world: { communityTrust: 1, marketTrust: -2, residentSafety: 3, integrity: 1 },
        legacy: {
          title: "Life before inventory",
          immediate: "Critical residents and safe exits remain protected. Market cold storage goes dark.",
          future: "Vendors will remember that Tay saved lives and also that they carried the economic loss."
        },
        ledger: "Reserve power prioritized for medical and life-safety circuits.",
        result: "The market cases dim. Upstairs, oxygen pumps, fire doors, and one elevator keep their cobalt status lights."
      }),
      choice({
        id: "residences-first",
        label: "Keep every occupied home powered",
        summary: "Protect all residential circuits and shut down the market, workshops, lobby, and nonessential building services.",
        recommended: false,
        why: "Families avoid a frightening blackout inside their homes, including needs Tay cannot see from the relay deck.",
        tradeoff: "Fire routes run on minimal battery and the market takes a near-total inventory loss.",
        check: null,
        next: "c9",
        effects: { reserve: -2, inspector: -2, xp: 10 },
        flags: { loadPriority: "residences", majorVendorLosses: true },
        world: { communityTrust: 2, marketTrust: -3, residentSafety: 1, politicalHeat: 1 },
        legacy: {
          title: "Homes before common infrastructure",
          immediate: "Every occupied unit keeps basic power. The market and workshops absorb the blackout.",
          future: "Residential trust rises while small businesses demand compensation Tay cannot yet promise."
        },
        ledger: "Reserve power prioritized for all occupied residences.",
        result: "Apartment windows stay lit. Below them, shutters fall across a silent market as cooling gauges climb."
      }),
      choice({
        id: "equal-share",
        label: "Share the remaining power equally",
        summary: "Cap every floor and business at the same percentage instead of ranking one need above another.",
        recommended: false,
        why: "No group is singled out to carry the whole sacrifice.",
        tradeoff: "Equal power is not equal safety. Medical equipment and fire systems can brown out alongside shop lights.",
        check: null,
        next: "c9",
        effects: { reserve: -2, inspector: -2, xp: 5 },
        flags: { loadPriority: "equal-share", medicalNearMiss: true },
        world: { communityTrust: -1, marketTrust: 1, residentSafety: -2, integrity: 0 },
        legacy: {
          title: "Equal scarcity",
          immediate: "Every district keeps some current, but a medical pump briefly crosses its brownout threshold.",
          future: "Tay's fairness is defensible on paper and morally contested by residents with unequal needs."
        },
        ledger: "Reserve power distributed equally across all active circuits.",
        result: "Every floor dims together. For two terrible seconds, a medical alert enters Dawn's channel before the backup cell catches."
      })
    ]
  }),

  c9: scene({
    id: "c9",
    stage: "worksite",
    act: "Critical Decision",
    title: "Expansion Port C-9",
    location: "Crownspire Seven • Relay Core",
    speaker: "dawn",
    transmission: "CROWNE TACTICAL",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne and Nia Vale study the C-9 relay map under cobalt light.",
    artPosition: "50% 52%",
    objective: "Isolate C-9, restore stable power, and preserve the sabotage trail.",
    copy: [
      "C-9 is the hinge. Isolate it cleanly and the tower stabilizes. Touch the wrong conductor and the reverse-fed pulse can destroy the relay evidence or burn through Tay's coat.",
      "Dawn confirms the remote monitor is still listening. Nia can hold the manual bridge while Tay executes the isolation sequence."
    ],
    choices: [
      choice({
        id: "coordinated-isolation",
        label: "Coordinate the C-9 isolation with Nia",
        summary: "Have Nia hold the manual bridge while Tay executes the mapped three-step isolation under Dawn's timing.",
        recommended: true,
        why: "The records and relay map remove uncertainty. This is the safest path to stable power with the evidence intact.",
        tradeoff: "It costs about three minutes and the isolation pulse alerts the remote monitor.",
        check: null,
        next: "completion",
        effects: { reserve: -3, inspector: -3, xp: 25 },
        flags: { powerStable: true, evidencePreserved: true, remoteAlerted: true },
        ledger: "C-9 isolated through coordinated no-roll procedure.",
        result: "Nia locks the bridge. Tay cuts C-9 in the exact order the current demands. Blue fire contracts to a clean line, and Crownspire Seven's lights rise floor by floor."
      }),
      choice({
        id: "solo-hot-swap",
        label: "Attempt a solo hot-swap",
        summary: "Move faster by swapping the C-9 shunt while Nia clears the deck.",
        recommended: false,
        why: "A clean hot-swap could restore power one minute faster and reveal Tay's field precision.",
        tradeoff: "Failure can injure Tay and scorch part of the physical evidence.",
        check: { skill: "Crownkey Toolkit", modifier: 5, dc: 14, advantage: false },
        success: {
          next: "completion",
          effects: { reserve: -2, inspector: -2, xp: 30 },
          flags: { powerStable: true, evidencePreserved: true, soloSwap: true },
          ledger: "C-9 stabilized by successful solo hot-swap.",
          result: "Tay catches the shunt between pulses and seats it in one controlled motion. The relay steadies before the remote monitor can react."
        },
        failure: {
          next: "completion",
          effects: { reserve: -4, inspector: -4, hp: -3 },
          flags: { powerStable: true, evidenceScorched: true },
          ledger: "C-9 stabilized after hot-swap arc injury.",
          result: "The shunt kicks hard. Tay takes the arc across his shoulder but drives C-9 closed. Power returns, though one scoring pattern is burned beyond recovery."
        }
      }),
      choice({
        id: "public-shutdown",
        label: "Call a witnessed public shutdown",
        summary: "Bring the Residents' Circle onto the record, shut the deck down, and isolate C-9 under public observation.",
        recommended: false,
        why: "Independent witnesses make it much harder for Copperline to rewrite what happened.",
        tradeoff: "The process takes longer and risks panic before power returns.",
        check: { skill: "Persuasion", modifier: 6, dc: 13, advantage: false },
        success: {
          next: "completion",
          effects: { reserve: -4, inspector: -4, xp: 25 },
          evidenceAdd: ["public-witness"],
          flags: { powerStable: true, evidencePreserved: true, residentsWitnessed: true },
          ledger: "C-9 isolated under Residents' Circle observation.",
          result: "Tay names the risk without spreading fear. The residents witness every seal and time stamp as C-9 goes dark and the tower comes alive."
        },
        failure: {
          next: "completion",
          effects: { reserve: -5, inspector: -5 },
          flags: { powerStable: true, crowdUneasy: true },
          ledger: "C-9 isolated after a tense public shutdown.",
          result: "The crowd surges at the first blackout flicker. Dawn steadies the channel while Tay finishes the safe isolation under pressure."
        }
      })
    ]
  }),

  completion: scene({
    id: "completion",
    stage: "completion",
    act: "Completion",
    title: "Stable Power, Live Evidence",
    location: "Crownspire Seven • Restored Grid",
    speaker: "tay",
    transmission: "FIELD RECORD",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne stands before Crownspire Seven's restored cobalt relay.",
    artPosition: "50% 33%",
    objective: "Close the worksite record before requesting inspection approval.",
    copy: [
      "Voltage settles inside Civic Works tolerances. Elevators answer. Cooling lines cycle. Across the tower, apartment lights return without a single evacuation.",
      "The repair is done, but the contract is not. Tay still has to decide what completion record reaches the inspector first."
    ],
    choices: [
      choice({
        id: "seal-completion",
        label: "Seal the repair and evidence as one record",
        summary: "Publish voltage proof, worksite images, hashes, and the preserved sabotage chain under one completion seal.",
        recommended: true,
        why: "It proves Tay completed the job without separating the repair from the reason it was needed.",
        tradeoff: "Copperline learns that Tay has a defensible case before the inspector rules.",
        check: null,
        next: "caseCustody",
        effects: { inspector: -1, xp: 10 },
        flags: { completionSealed: true, copperlineAware: true },
        ledger: "Completion record sealed with repair and evidence chain.",
        result: "Tay's seal joins stable voltage to every preserved fact. Dawn sends the package through three mirrored channels."
      }),
      choice({
        id: "brief-residents",
        label: "Brief the Residents' Circle first",
        summary: "Give the community a plain-language account before sending the technical completion package.",
        recommended: false,
        why: "Residents gain agency and cannot be blindsided by Copperline's response.",
        tradeoff: "The inspector waits while Tay earns public trust.",
        check: { skill: "Persuasion", modifier: 6, dc: 12, advantage: false },
        success: {
          next: "caseCustody",
          effects: { inspector: -2, xp: 15 },
          flags: { completionSealed: true, residentTrust: true },
          ledger: "Residents briefed before completion submission.",
          result: "Tay makes the danger clear without turning Nia into a scapegoat. The Circle backs the evidence package in writing."
        },
        failure: {
          next: "caseCustody",
          effects: { inspector: -3 },
          flags: { completionSealed: true, residentConcern: true },
          ledger: "Resident briefing completed amid unresolved concern.",
          result: "Questions multiply faster than the clock allows. Tay records them, promises answers, and sends the completion package."
        }
      }),
      choice({
        id: "trace-monitor",
        label: "Pull one final monitor trace",
        summary: "Use the restored grid to capture the remote listener's exit route before sealing completion.",
        recommended: false,
        why: "The fresh route could point directly toward Copperline's active operator.",
        tradeoff: "The extra trace risks delaying inspection and tipping the listener off.",
        check: { skill: "Investigation", modifier: 6, dc: 14, advantage: false },
        success: {
          next: "caseCustody",
          effects: { inspector: -2, xp: 15 },
          evidenceAdd: ["monitor-trace"],
          flags: { completionSealed: true, monitorTrace: true },
          ledger: "Remote monitor exit trace appended to completion record.",
          result: "For three seconds, the restored relay becomes a lens. Tay captures a signed Copperline route packet before the listener disappears."
        },
        failure: {
          next: "caseCustody",
          effects: { inspector: -3 },
          flags: { completionSealed: true, monitorEscaped: true },
          ledger: "Final monitor trace attempted; listener escaped.",
          result: "The listener sees the trap and burns the route. Dawn seals the existing evidence before anything else can be lost."
        }
      })
    ]
  }),

  caseCustody: scene({
    id: "caseCustody",
    stage: "completion",
    act: "Legacy Decision III",
    title: "Who Gets to Hold the Truth",
    location: "Crownspire Seven • Evidence Handoff",
    speaker: "dawn",
    transmission: "DECISION PERSISTS",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne reviews the sealed Crownspire evidence before choosing its custodian.",
    artPosition: "50% 32%",
    objective: "Choose who controls the master evidence package after Civic Works receives its copy.",
    legacyDecision: true,
    copy: [
      "Dawn has three identical, verified packages and only one master key. The keyholder controls later disclosures, settlements, and appeals.",
      "Tay can build shared custody with the Residents' Circle, keep exclusive Crowne control, or place the master key with Civic Works."
    ],
    choices: [
      choice({
        id: "shared-custody",
        label: "Create shared Crowne-resident custody",
        summary: "Require Tay, Dawn, and an elected Residents' Circle custodian to approve any deletion, settlement, or public release.",
        recommended: true,
        why: "Shared custody gives residents real power while keeping technical and contract expertise at the table.",
        tradeoff: "Three keyholders mean slower decisions, more conflict, and more people Copperline can pressure.",
        check: null,
        next: "approval",
        effects: { xp: 15 },
        flags: { caseCustody: "shared", residentKey: true },
        world: { communityTrust: 3, autonomy: 1, evidenceStrength: 2, politicalHeat: 2 },
        legacy: {
          title: "Power shared with the people affected",
          immediate: "No single person can bury or sell the master evidence.",
          future: "The Circle gains leverage, and every future decision requires coalition rather than command."
        },
        ledger: "Master evidence placed in shared Crowne-resident custody.",
        result: "Three cobalt keys form one seal. Tay keeps influence, not ownership, over the truth he recovered."
      }),
      choice({
        id: "crowne-exclusive-custody",
        label: "Keep exclusive Crowne custody",
        summary: "Tay and Dawn retain the only master key so they can move quickly and protect the case from compromised institutions.",
        recommended: false,
        why: "Central control makes it harder for Copperline to exploit a weak or frightened custodian.",
        tradeoff: "Residents must trust Tay with evidence about their homes without holding equal power over it.",
        check: null,
        next: "approval",
        effects: { xp: 10 },
        flags: { caseCustody: "crowne", residentKey: false },
        world: { communityTrust: -1, autonomy: 3, evidenceStrength: 2, politicalHeat: 1 },
        legacy: {
          title: "Protection through control",
          immediate: "Tay and Dawn can answer threats without waiting for a vote.",
          future: "The Crowne operation grows stronger while residents question who authorized it to own their case."
        },
        ledger: "Master evidence retained under exclusive Crowne custody.",
        result: "Dawn closes the master key inside the Crowne vault. The case is agile, secure, and concentrated in two hands."
      }),
      choice({
        id: "civic-custody",
        label: "Transfer the master key to Civic Works",
        summary: "Place the case under formal public authority and retain only sealed reference copies.",
        recommended: false,
        why: "An institutional custodian carries legal power Tay's new operation does not yet have.",
        tradeoff: "Civic Works can delay, narrow, or settle the case beyond the residents' direct control.",
        check: null,
        next: "approval",
        effects: { xp: 5 },
        flags: { caseCustody: "civic", residentKey: false },
        world: { civicTrust: 3, autonomy: -3, evidenceStrength: 1, communityTrust: -1 },
        legacy: {
          title: "Institutional custody",
          immediate: "The evidence enters the strongest formal chain available.",
          future: "Tay gains official legitimacy but loses the power to stop a quiet institutional settlement."
        },
        ledger: "Master evidence transferred to Civic Works custody.",
        result: "The master key leaves Tay's slate. Its new seal carries the authority of the city and the uncertainty of its politics."
      })
    ]
  }),

  approval: scene({
    id: "approval",
    stage: "approval",
    act: "Approval",
    title: "Make the Record Survive",
    location: "Civic Works • Remote Inspection",
    speaker: "dawn",
    transmission: "VERIFICATION CHANNEL",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne reviews the Crownspire evidence suite in cobalt light.",
    artPosition: "50% 28%",
    objective: "Win formal approval without weakening the evidence or residents' control.",
    copy: [
      "The Civic Works inspector confirms stable power, then asks whether Tay wants the sabotage evidence treated as a separate complaint. Separating it would make approval faster and the case easier to lose.",
      "Dawn opens the complete chain on Tay's slate. Every time stamp is clean."
    ],
    choices: [
      choice({
        id: "submit-complete-chain",
        label: "Submit the complete verified chain",
        summary: "Require the repair, sabotage evidence, resident impact, and payment authorization to share one case number.",
        recommended: true,
        why: "The clean chain already satisfies the contract and prevents the evidence from being quietly separated.",
        tradeoff: "Tay puts his name directly against Copperline before his operation has institutional weight.",
        check: null,
        next: "copperlineOffer",
        effects: { xp: 20 },
        flags: { approved: true, evidenceCaseLinked: true },
        ledger: "Civic Works approved completion with linked sabotage case.",
        result: "The inspector tests three hashes, finds no break, and signs. Crownspire Seven passes. The sabotage case stays attached."
      }),
      choice({
        id: "request-field-signoff",
        label: "Request an immediate field signoff",
        summary: "Ask the inspector to approve the repair now while Dawn files the evidence as a protected companion case.",
        recommended: false,
        why: "It gets residents certainty quickly while still preserving a formal evidence route.",
        tradeoff: "Two linked files create a seam Copperline may try to exploit.",
        check: { skill: "Persuasion", modifier: 6, dc: 13, advantage: false },
        success: {
          next: "copperlineOffer",
          effects: { xp: 20 },
          flags: { approved: true, companionCase: true },
          ledger: "Field completion approved with protected companion case.",
          result: "The inspector signs the field result and accepts Dawn's companion-case lock. The seam exists, but it is documented."
        },
        failure: {
          next: "copperlineOffer",
          effects: { xp: 10 },
          flags: { approved: true, evidenceCaseLinked: true },
          ledger: "Civic Works required one combined approval record.",
          result: "The inspector refuses two files. Tay returns to the stronger combined chain and secures approval without losing the case."
        }
      }),
      choice({
        id: "invoke-resident-standing",
        label: "Invoke the residents' legal standing",
        summary: "Place the Residents' Circle beside Tay as an interested party before asking for approval.",
        recommended: false,
        why: "Community standing can make later suppression more difficult.",
        tradeoff: "It exposes residents to direct pressure from Copperline sooner.",
        check: { skill: "Persuasion", modifier: 6, dc: 14, advantage: false },
        success: {
          next: "copperlineOffer",
          effects: { xp: 25 },
          flags: { approved: true, residentStanding: true },
          ledger: "Completion approved with Residents' Circle standing.",
          result: "The Circle's chair signs beside Tay. Civic Works approves a case Copperline can no longer treat as private paperwork."
        },
        failure: {
          next: "copperlineOffer",
          effects: { xp: 10 },
          flags: { approved: true, evidenceCaseLinked: true, standingDeferred: true },
          ledger: "Completion approved; resident standing deferred.",
          result: "Civic Works defers the standing request but cannot deny the clean completion record. Dawn preserves the request for appeal."
        }
      })
    ]
  }),

  copperlineOffer: scene({
    id: "copperlineOffer",
    stage: "approval",
    act: "Legacy Decision IV",
    title: "The Offer Arrives Before the Applause",
    location: "Encrypted Third-Party Channel",
    speaker: "dawn",
    transmission: "UNSOLICITED SETTLEMENT",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne receives a high-stakes settlement offer after restoring Crownspire Seven.",
    artPosition: "50% 30%",
    objective: "Decide who has the right to answer Copperline's offer.",
    legacyDecision: true,
    copy: [
      "Copperline offers to cancel the tower's lien tonight, reimburse the market's documented losses, and withdraw every claim against Nia. In exchange, the residents waive further action and the monitor trace disappears into a sealed settlement.",
      "The offer buys immediate safety with future silence. It expires before the Civic Works payment window closes."
    ],
    choices: [
      choice({
        id: "resident-mandate",
        label: "Put the offer before the Residents' Circle",
        summary: "Give the people carrying both the risk and the benefit a verified summary, then bind Tay to their vote.",
        recommended: true,
        why: "It is their home, their losses, and their future case. Tay should advise without quietly deciding for them.",
        tradeoff: "The short vote can divide neighbors, leak the offer, and weaken Tay's ability to control the strategy.",
        check: null,
        next: "payment",
        effects: { xp: 20 },
        flags: { copperlineResponse: "resident-mandate", residentMandate: true, lienFrozen: true },
        world: { communityTrust: 4, autonomy: -1, politicalHeat: 3, evidenceStrength: 1, integrity: 3 },
        legacy: {
          title: "Agency over paternalism",
          immediate: "The Circle votes to reject permanent silence but authorizes a temporary lien freeze while the case proceeds.",
          future: "Residents own the risk of their decision, and Copperline now knows the tower can organize."
        },
        ledger: "Residents' Circle rejected permanent silence and accepted a temporary lien freeze.",
        result: "The vote is close and unsentimental. The Circle chooses a harder road with its eyes open, then asks Tay to walk it with them."
      }),
      choice({
        id: "reject-unilaterally",
        label: "Reject the offer without a resident vote",
        summary: "Keep the sabotage case whole and refuse to let a deadline pressure residents into selling their future rights.",
        recommended: false,
        why: "The offer is designed to manufacture consent before the community can understand its leverage.",
        tradeoff: "Tay protects the case by taking the decision away from the same residents he says he serves.",
        check: null,
        next: "payment",
        effects: { xp: 15 },
        flags: { copperlineResponse: "rejected-by-tay", lienContested: true },
        world: { communityTrust: -1, autonomy: 3, politicalHeat: 4, evidenceStrength: 3, integrity: 1 },
        legacy: {
          title: "Justice by unilateral refusal",
          immediate: "The evidence remains untouched and Copperline receives no waiver.",
          future: "Tay becomes the face of the fight and may be blamed if residents later wish they had taken immediate security."
        },
        ledger: "Copperline settlement rejected by Tay without resident vote.",
        result: "Tay closes the channel. The evidence stays whole. So does the question of whether the choice was his to make."
      }),
      choice({
        id: "accept-settlement",
        label: "Accept immediate lien cancellation",
        summary: "Take the guaranteed protection, reimburse market losses, and seal the monitor evidence under settlement.",
        recommended: false,
        why: "Families become safe from this lien tonight, and vendors recover losses they may not survive otherwise.",
        tradeoff: "Copperline buys silence, the active operator remains protected, and another tower may face the same scheme.",
        check: null,
        next: "payment",
        effects: { xp: 5 },
        flags: { copperlineResponse: "settled", lienCancelled: true, caseSealed: true, marketReimbursed: true },
        world: { communityTrust: 1, marketTrust: 3, politicalHeat: -3, evidenceStrength: -4, integrity: -2 },
        legacy: {
          title: "Certain safety at the cost of silence",
          immediate: "The lien disappears and documented market losses are paid.",
          future: "Copperline avoids a public finding and keeps the method it used against Crownspire Seven."
        },
        ledger: "Copperline settlement accepted; lien cancelled and monitor evidence sealed.",
        result: "The lien vanishes from the tower record. Relief moves through Crownspire Seven while the strongest evidence goes dark."
      })
    ]
  }),

  payment: scene({
    id: "payment",
    stage: "payment",
    act: "Payment",
    title: "Fifty Crowns, Verified",
    location: "Crowne Contract Ledger",
    speaker: "dawn",
    transmission: "PAYMENT AUTHORIZED",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne stands composed before the restored arc relay.",
    artPosition: "50% 26%",
    objective: "Verify the transfer once, credit Tay's wallet once, and close the invoice cleanly.",
    copy: [
      "Civic Works releases the contract payment. The ledger shows 50 Crowns pending against Tay's signed completion record.",
      "Dawn keeps the wallet gate closed until Tay chooses how to verify the transfer."
    ],
    choices: [
      choice({
        id: "claim-payment",
        action: "claimPayment",
        label: "Claim the verified 50 Crowns",
        summary: "Match the authorization hash, credit Tay's wallet once, and mark the invoice paid.",
        recommended: true,
        why: "Every contract link is complete. The payment is exact, verified, and ready for one-time settlement.",
        tradeoff: "Closing the invoice ends Tay's leverage to withhold acceptance over minor paperwork issues.",
        check: null,
        next: "stewardship",
        ledger: "Verified payment claimed and invoice closed.",
        result: "The authorization hash matches. Fifty Crowns move into Tay's wallet, and the gate seals against duplicate payment."
      }),
      choice({
        id: "audit-payment",
        label: "Audit the transfer before claiming",
        summary: "Compare Civic Works authorization, client invoice, and wallet destination one final time.",
        recommended: false,
        why: "A manual audit can catch a redirected wallet or altered invoice before settlement.",
        tradeoff: "The valid payment waits while Tay repeats checks Dawn already completed.",
        check: { skill: "Investigation", modifier: 6, dc: 10, advantage: true },
        success: {
          next: "paymentAudit",
          effects: { xp: 5 },
          flags: { paymentAudited: true },
          ledger: "Manual payment audit passed.",
          result: "All three records match. The payment is clean, exact, and still waiting behind the one-time gate."
        },
        failure: {
          next: "paymentAudit",
          effects: {},
          flags: { paymentAudited: true },
          ledger: "Manual payment audit repeated after a display mismatch.",
          result: "A stale display briefly shows the wrong time zone. Dawn resolves it against the signed hash. The payment itself is clean."
        }
      })
    ]
  }),

  paymentAudit: scene({
    id: "paymentAudit",
    stage: "payment",
    act: "Payment Audit",
    title: "The Hashes Match",
    location: "Crowne Contract Ledger",
    speaker: "dawn",
    transmission: "AUDIT COMPLETE",
    art: "assets/tay-nia-c9-records.webp",
    artAlt: "Tay Crowne reviews a verified contract ledger.",
    artPosition: "50% 28%",
    objective: "Settle the verified invoice through the one-time wallet gate.",
    copy: [
      "The manual review reaches the same result as Dawn's automated check. Client, inspector, amount, and destination all match.",
      "The 50 Crowns remain pending. No value has entered Tay's wallet yet."
    ],
    choices: [
      choice({
        id: "claim-after-audit",
        action: "claimPayment",
        label: "Claim the audited 50 Crowns",
        summary: "Credit Tay's wallet once and seal the verified invoice against duplicate settlement.",
        recommended: true,
        why: "The extra audit found no defect. Settlement now completes the chain without surrendering any protection.",
        tradeoff: "The completed invoice can no longer be held open for further review.",
        check: null,
        next: "stewardship",
        ledger: "Audited payment claimed and invoice closed.",
        result: "Fifty Crowns clear the gate exactly once. Dawn watches the duplicate lock engage before she closes the ledger."
      }),
      choice({
        id: "request-receipt",
        label: "Generate a mirrored receipt first",
        summary: "Create local, Civic Works, and resident-safe receipt copies before settlement.",
        recommended: false,
        why: "Mirrored receipts make later payment disputes easier to defeat.",
        tradeoff: "It adds paperwork without changing the verified amount or destination.",
        check: null,
        next: "paymentAudit",
        effects: {},
        flags: { mirroredReceipt: true },
        once: "mirroredReceipt",
        ledger: "Mirrored pre-settlement receipt generated.",
        result: "Three receipt shells take the same hash. The one-time wallet gate remains closed and ready."
      })
    ]
  }),

  stewardship: scene({
    id: "stewardship",
    stage: "payment",
    act: "Legacy Decision V",
    title: "What the First Fifty Builds",
    location: "Crowne Contract Ledger",
    speaker: "dawn",
    transmission: "DECISION PERSISTS",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne considers how to use the first verified Crowne Legacy contract payment.",
    artPosition: "50% 24%",
    objective: "Allocate the first 50 Crowns between independent capacity and immediate community repair.",
    legacyDecision: true,
    copy: [
      "The wallet gate credited exactly 50 Crowns and sealed against duplicate payment. Now the money has to become something.",
      "Tay can seed the Crowne operation, return it to Crownspire Seven, or split the first victory between capacity and repair."
    ],
    choices: [
      choice({
        id: "split-first-fifty",
        action: "allocateFunds",
        allocation: { operations: 25, residents: 25 },
        label: "Split the first fifty",
        summary: "Place 25 Crowns in an independent operations fund and 25 in a resident-controlled recovery fund.",
        recommended: true,
        why: "It gives the Crowne operation enough seed capital to keep serving while returning tangible value to the community that took the risk.",
        tradeoff: "Neither fund receives enough to solve its problem outright.",
        check: null,
        next: "close",
        effects: { xp: 15 },
        flags: { firstFifty: "split" },
        world: { communityTrust: 2, autonomy: 2, marketTrust: 1, integrity: 2 },
        legacy: {
          title: "Capacity and repair together",
          immediate: "Residents control a 25-Crown recovery fund. The Crowne operation gains a 25-Crown seed fund.",
          future: "Growth is slower, but the operation begins with shared benefit written into its ledger."
        },
        ledger: "First 50 Crowns split evenly between operations and resident recovery.",
        result: "Two new ledger lines appear beneath the closed invoice. The first victory becomes both a tool and a promise."
      }),
      choice({
        id: "fund-crowne-operations",
        action: "allocateFunds",
        allocation: { operations: 50, residents: 0 },
        label: "Seed Crowne Operations in full",
        summary: "Invest all 50 Crowns in equipment, licensing, and the capacity to take stronger contracts.",
        recommended: false,
        why: "A stronger independent operation can protect more communities and resist predatory firms later.",
        tradeoff: "Crownspire residents and vendors receive no direct share of the value their crisis created.",
        check: null,
        next: "close",
        effects: { xp: 10 },
        flags: { firstFifty: "operations" },
        world: { communityTrust: -1, autonomy: 4, marketTrust: -1, integrity: 0 },
        legacy: {
          title: "Build power before distributing it",
          immediate: "Crowne Operations gains its full first capital reserve.",
          future: "Tay can take harder work sooner, but the operation begins with a debt of trust to Crownspire Seven."
        },
        ledger: "First 50 Crowns invested in Crowne Operations.",
        result: "The entire payment becomes capacity: better tools, a license reserve, and a future that belongs less to gatekeepers."
      }),
      choice({
        id: "return-to-crownspire",
        action: "allocateFunds",
        allocation: { operations: 0, residents: 50 },
        label: "Return all 50 to Crownspire Seven",
        summary: "Place the full payment in a resident-controlled fund for spoiled inventory, emergency cooling, and household loss.",
        recommended: false,
        why: "The community absorbs the damage now, and immediate relief may matter more than Tay's growth.",
        tradeoff: "The Crowne operation ends its first contract with proof but no capital, making the next independent job harder to reach.",
        check: null,
        next: "close",
        effects: { xp: 10 },
        flags: { firstFifty: "residents" },
        world: { communityTrust: 4, autonomy: -3, marketTrust: 3, integrity: 2 },
        legacy: {
          title: "Repair before expansion",
          immediate: "Residents control the full 50-Crown recovery fund.",
          future: "Crownspire recovers faster while Tay remains dependent on borrowed gear and outside credit."
        },
        ledger: "First 50 Crowns transferred to Crownspire resident recovery.",
        result: "Tay's wallet returns to zero. Across the tower, fifty Crowns become food stock, cooling parts, and breathing room."
      })
    ]
  }),

  close: scene({
    id: "close",
    stage: "close",
    act: "Contract Closed",
    title: "The First Link Holds",
    location: "Crownspire Seven • Nightfall",
    speaker: "tay",
    transmission: "CROWNE LEDGER CLEAN",
    art: "assets/tay-crownspire-relay-opening.webp",
    artAlt: "Tay Crowne stands before Crownspire Seven after completing the Blackout Contract.",
    artPosition: "50% 22%",
    objective: "The Blackout Contract is complete.",
    copy: [
      "Crownspire Seven keeps its power. The residents keep their homes. Copperline loses the silent failure it paid to manufacture.",
      "Tay Crowne finishes his first verified contract with a clean ledger, a live sabotage case, and the beginnings of an independent Crownward operation."
    ],
    choices: []
  })
});

export function getScene(sceneId) {
  return SCENES[sceneId] || SCENES.briefing;
}

export function getChoice(sceneId, choiceId) {
  return getScene(sceneId).choices.find((item) => item.id === choiceId) || null;
}
