---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Implementation Progress (2026-10-25)

- The explanation/checklist flow, Q&A flow, and server-side Cloudflare integration are implemented.
- Mocked tests, lint, production build, and a headless browser flow with mocked responses passed. One explicitly approved live synthetic Q&A request returned a validated answer with evidence.
- The parser supports both `result.response` and `result.choices[0].message.content`; the source excerpt checks remain strict.
- The milestone boxes below stay open until their full learner checks are complete. Remaining work includes direct browser verification of retry and in-flight edits, the provisional 20,000-character synthetic case, and final review/app-map/ship tasks. The temporary connection-test route was removed after the live Q&A integration passed.
- Account billing status and remaining free quota are unknown. Do not make further live requests without explicit approval or enable paid usage/fallback.

## Slices

- [ ] **1. You can paste a synthetic summary and see its explanation and traceable checklist**
  Becomes usable: The one-page app accepts a synthetic summary or sample, validates it, sends an explanation request through the server, and displays only a validated explanation and checklist with explicit source excerpts. Loading, failure, retry, and stale-explanation handling work.
  Why now: This is the core CareBridge value. The flow is implemented, and one live synthetic Q&A response was parsed and source-validated. This did not test the live explanation operation, the 20,000-character case, or prove that future requests cannot incur charges.
  PRD ref: `prd.md > The Core Journey`, `Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, and `States and Boundaries`
  Spec ref: `spec.md > The Core Journey Through the System`, `Components > One-page UI`, `Components > CareBridge Route Handler`, `Components > Model call and evidence checks`, `External Services and Dependencies > Cloudflare Workers AI`, and `Minimal Verification Plan`
  Build: Replace the starter page with the responsive input and results experience; add the explanation request handler and shared validation/provider helpers; keep credentials server-side; add the synthetic sample, matching UI/server input checks, exact excerpt checks, recoverable errors and retry, and stale-response protection. Add no dependency or persistent storage.
  Verify (mechanical): Mocked input, parser, malformed-output, checklist excerpt, lint, and build checks passed. The parser accepts both `result.response` and `result.choices[0].message.content`. Do not make another live AI request unless it is explicitly approved and will not enable paid usage.
  Learner check: Run the app locally and try sample selection, empty input, and over-limit input without sending a model request. Before submitting the sample, check the Cloudflare dashboard confirms further use cannot incur charges; only then submit synthetic text and confirm the explanation/checklist show source wording and errors preserve the text. If that billing condition is not confirmed, stop before submission and report it.
  Commit: `Build source-grounded explanation flow`

- [ ] **2. You can ask grounded questions and keep the current-page history**
  Becomes usable: Users can ask multiple questions, see each question beside its answer and exact evidence, receive a clear insufficient-information response when evidence is missing, and retry a failed question without losing earlier exchanges.
  Why now: This completes the third part of the approved core loop using the server and safety boundaries established in slice 1. Q&A is implemented; direct verification of history, retries, and in-flight edits remains.
  PRD ref: `prd.md > Features and Behavior > Document questions and answers`, `States and Boundaries`, and `Verification Plan`
  Spec ref: `spec.md > The Core Journey Through the System`, `Components > One-page UI`, `Components > CareBridge Route Handler`, `Components > Model call and evidence checks`, `Data Model`, and `Minimal Verification Plan`
  Build: Add the question operation to the existing server route; validate question responses and exact evidence against the current document; append Q&A exchanges in page memory; preserve failed questions and retry controls; discard in-flight answers after document edits.
  Verify (mechanical): Mocked supported/unsupported answers, evidence validation, provider errors, and timeout cases are covered; lint and build pass. Add or perform direct browser verification for failed-question retry, retained history, and edits while a request is in flight.
  Learner check: Ask one question answered by the sample and one absent from it. Confirm both exchanges stay visible, the second is not guessed, and changing the document clears the old results and history.
  Commit: `Add evidence-grounded question history`

- [ ] **3. Complete safety checks, verify the large-input boundary, and clean up the temporary test route**
  Becomes usable: The complete one-page synthetic-text MVP has the agreed safety copy, accessible states, tested recovery behavior, setup instructions, and no temporary connection route.
  Why now: Finalize the small complete demonstration only after both explanation and Q&A work together. The 20,000-character limit remains provisional until its large synthetic request passes actual structured-response validation.
  PRD ref: `prd.md > Screens and Layout`, `Look and Feel`, `States and Boundaries`, `Non-Goals`, and `Verification Plan`
  Spec ref: `spec.md > Look and Feel`, `Where It Runs and How Someone Tries It`, `Minimal Verification Plan`, `File Structure`, and `Important Failure Modes`
  Build: Finish accessible responsive styling and safety copy; document local setup and environment variable names without values; verify the maximum-length synthetic case only when account billing/quota conditions are confirmed safe; remove `app/api/cloudflare-check/route.ts` after the product integration is verified; do not add paid fallbacks, storage, or unrelated features. The temporary route was removed after the approved live Q&A test succeeded.
  Verify (mechanical): Run all available focused tests, `npm run lint`, and `npm run build`; inspect changed files for secrets and document logging; verify only the CareBridge API route remains. If the live large-document test cannot safely run, leave the cap explicitly provisional and record that limitation.
  Learner check: Start the app with the instructions in the README and walk through sample, explanation, checklist, supported/unsupported Q&A, retry, and editing during processing. Confirm no old result appears for changed text.
  Commit: `Finish and verify CareBridge MVP`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 1, review the explanation and checklist behavior before completing Q&A.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [record actual activity after implementation]
Route and stops: [record actual files and symbols after the code tour]
Edit outcome: [record actual outcome]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions

- Kept additional live-model checks subject to explicit approval and no paid usage. One explicitly approved synthetic Q&A request passed; account billing status and remaining quota are still unknown.
