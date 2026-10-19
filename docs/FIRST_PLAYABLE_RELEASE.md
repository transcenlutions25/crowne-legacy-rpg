# Path to the first sellable Android chapter

The existing Blackout Contract is playable end to end today. This change strengthens the shared-world contract behind future growth; it does not launch a paid product, enable cloud accounts, or add new campaign content.

## Bounded next gates

1. **Review the Phase 2 contract.** Review typed domains, authority-resolved commands, compatibility fixtures and replay tests. Require green gameplay and Android viewport/offline CI on the exact proposed commit before merge approval. [Contract](CROWN_NETWORK_CONTRACT.md) and [checklist](PHASE_2_CHECKLIST.md).
2. **Finish chapter canon and asset approval.** Review the existing cast, dialogue and original art against owner-approved references. Existing artwork is preserved; being present in this repository is not a new likeness approval. Keep portrait approval/reconciliation as a separate design gate. Dawn and Kai have null portraits; Nia is a supporting NPC, never their substitute. Do not publish private reference material into this public repository. [Canon policy](../canon-registry.json) and [production roadmap](../AAA_ROADMAP.md).
3. **Prove Android reliability.** Complete real-device installation, offline cold start/resume, full chapter completion, app restart/update, accessibility and one-time-payment checks on the agreed supported device range. Hosted Chromium viewport checks are useful regression evidence, not physical-device certification.
4. **Choose the release scope and delivery route.** The owner decides the paid chapter's content, distribution, support and refund expectations. Preserve a complete standalone mobile experience. Evaluate cloud recovery and storefront/runtime needs without committing to a provider or recurring spend. Any backend work follows the authority and atomic-persistence rules in the contract.
5. **Approve launch readiness.** Complete content/art rights, privacy/security review, ratings, store requirements where applicable, recovery/support instructions, and final device QA. Confirm commercial terms and pricing separately. No price, payment integration or launch date is assumed here.

The first commercial gate is a polished, approved and reliably recoverable chapter with a clear purchase/delivery/support path. A future 3D world and cross-game features extend that chapter; they do not replace its existing characters or become prerequisites for playing it.

## Verification limits for this change

- The dependency-free Node gameplay and contract suites and JavaScript syntax checks run locally.
- The Android viewport script now also checks service-worker-controlled offline reload and exact v3 autosave preservation at 412×915.
- Local Chromium could not launch in the cloud process sandbox (`socket() failed: Operation not permitted`). Hosted PR CI is the browser verification route for this change; see the PR checks for actual results.
- No physical Android device, store install, purchase flow, backend authentication or cloud save has been certified by this milestone.
