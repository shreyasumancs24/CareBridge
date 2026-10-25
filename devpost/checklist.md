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
- Mocked browser tests cover retry preservation and stale explanation/Q&A results when the document changes in flight. The learner completed the final local walkthrough and reports the app works perfectly. With the learner's confirmation that there is no billing, the 20,000-character synthetic explanation also returned a validated structured response through the CareBridge route.
- Do not enable paid usage or a paid fallback. The remaining `todos.md` item about marking checklist tasks complete is outside the approved scope and build plan; keep it for a future scope review rather than changing this proof of concept during final review.

## Slices

- [x] **1. You can paste a synthetic summary and see its explanation and traceable checklist**
  Becomes usable: The one-page app accepts a synthetic summary or sample, validates it, sends an explanation request through the server, and displays only a validated explanation and checklist with explicit source excerpts. Loading, failure, retry, and stale-explanation handling work.
  Why now: This is the core CareBridge value. The flow is implemented; the learner confirmed the local walkthrough, and a live synthetic explanation at exactly 20,000 characters returned a parsed, source-validated response after the learner confirmed there is no billing.
  PRD ref: `prd.md > The Core Journey`, `Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, and `States and Boundaries`
  Spec ref: `spec.md > The Core Journey Through the System`, `Components > One-page UI`, `Components > CareBridge Route Handler`, `Components > Model call and evidence checks`, `External Services and Dependencies > Cloudflare Workers AI`, and `Minimal Verification Plan`
  Build: Replace the starter page with the responsive input and results experience; add the explanation request handler and shared validation/provider helpers; keep credentials server-side; add the synthetic sample, matching UI/server input checks, exact excerpt checks, recoverable errors and retry, and stale-response protection. Add no dependency or persistent storage.
  Verify (mechanical): Mocked input, parser, malformed-output, checklist excerpt, lint, and build checks passed. The parser accepts both `result.response` and `result.choices[0].message.content`. Do not make another live AI request unless it is explicitly approved and will not enable paid usage.
  Learner check: Run the app locally and try sample selection, empty input, and over-limit input without sending a model request. Before submitting the sample, check the Cloudflare dashboard confirms further use cannot incur charges; only then submit synthetic text and confirm the explanation/checklist show source wording and errors preserve the text. If that billing condition is not confirmed, stop before submission and report it.
  Commit: `Build source-grounded explanation flow`

- [x] **2. You can ask grounded questions and keep the current-page history**
  Becomes usable: Users can ask multiple questions, see each question beside its answer and exact evidence, receive a clear insufficient-information response when evidence is missing, and retry a failed question without losing earlier exchanges.
  Why now: This completes the third part of the approved core loop using the server and safety boundaries established in slice 1. Q&A, mocked retry/stale-result checks, and the final learner walkthrough are complete.
  PRD ref: `prd.md > Features and Behavior > Document questions and answers`, `States and Boundaries`, and `Verification Plan`
  Spec ref: `spec.md > The Core Journey Through the System`, `Components > One-page UI`, `Components > CareBridge Route Handler`, `Components > Model call and evidence checks`, `Data Model`, and `Minimal Verification Plan`
  Build: Add the question operation to the existing server route; validate question responses and exact evidence against the current document; append Q&A exchanges in page memory; preserve failed questions and retry controls; discard in-flight answers after document edits.
  Verify (mechanical): Mocked supported/unsupported answers, evidence validation, provider errors, and timeout cases are covered; lint and build pass. Add or perform direct browser verification for failed-question retry, retained history, and edits while a request is in flight.
  Learner check: Ask one question answered by the sample and one absent from it. Confirm both exchanges stay visible, the second is not guessed, and changing the document clears the old results and history.
  Commit: `Add evidence-grounded question history`

- [x] **3. Complete safety checks, verify the large-input boundary, and clean up the temporary test route**
  Becomes usable: The complete one-page synthetic-text MVP has the agreed safety copy, accessible states, tested recovery behavior, setup instructions, and no temporary connection route.
  Why now: Finalize the small complete demonstration after explanation and Q&A work together. The synthetic maximum-length request passed structured-response and exact-excerpt validation through the CareBridge route.
  PRD ref: `prd.md > Screens and Layout`, `Look and Feel`, `States and Boundaries`, `Non-Goals`, and `Verification Plan`
  Spec ref: `spec.md > Look and Feel`, `Where It Runs and How Someone Tries It`, `Minimal Verification Plan`, `File Structure`, and `Important Failure Modes`
  Build: Finish accessible responsive styling and safety copy; document local setup and environment variable names without values; verify the maximum-length synthetic case only when account billing/quota conditions are confirmed safe; remove `app/api/cloudflare-check/route.ts` after the product integration is verified; do not add paid fallbacks, storage, or unrelated features. The temporary route was removed after the approved live Q&A test succeeded.
  Verify (mechanical): Mocked tests, lint, build, and headless mocked browser checks passed; the live 20,000-character synthetic explanation returned HTTP 200 and passed response-shape and exact-excerpt checks. Source inspection found no document logging, and only the CareBridge API route remains.
  Learner check: Start the app with the instructions in the README and walk through sample, explanation, checklist, supported/unsupported Q&A, retry, and editing during processing. Confirm no old result appears for changed text.
  Commit: `Finish and verify CareBridge MVP`

## Hands-on Checkpoints

- [x] Early usable behavior explored — learner confirmed the sample only fills the input, explanation results appear after submission, and empty/over-limit input is handled.
- [x] Final kick-the-tires exploration and feedback completed — learner reports the local app works perfectly and requested continuation; no fixes requested.

## Final Review

- [ ] Final review complete — verification and feedback are complete; awaiting the learner's explicit ready-to-ship confirmation.

## Code Tour and App Map

- [x] Learning activity complete — guided route through `app/page.tsx` (`Home`, `explainInstructions`, `updateDocument`), `app/api/carebridge/route.ts` (`POST`), and `lib/carebridge.ts` (input/output validation and excerpt checks); learner confirmed the route was checked.
- [x] Optional edit and transfer reflection addressed — no optional code edit made; learner answered the transfer reflection, stored only in the ignored learner profile.
- [x] `devpost/app-map.html` generated from finished code, checked against current paths/symbols, and shown; includes an offline flow diagram and a project-grounded practice to reuse.

Activity and evidence: Learner completed the guided explanation-request route and confirmed it was checked.
Route and stops: `app/page.tsx` — `Home`, `explainInstructions`, `updateDocument`; `app/api/carebridge/route.ts` — `POST`; `lib/carebridge.ts` — request validation, result parsing, exact source excerpt checks.
Edit outcome: No optional label edit made; implementation remains at the approved scope.
Reflection: Answered; personal response recorded in the ignored learner profile.
Activity mode: Guided route through the running app's implementation.

## Revisions

- Kept live-model checks subject to explicit approval and no paid usage. The learner confirmed there is no billing before the one 20,000-character synthetic explanation check; remaining account quota was not inspected.
- Learner confirmed the slice 1 input/explanation checks. Mocked browser checks passed for retry preservation and in-flight document edits in both explanation and Q&A.
- Learner confirmed the final local walkthrough was working perfectly and confirmed there is no billing. A single 20,000-character synthetic explanation request to the existing CareBridge route returned HTTP 200 and a validated result with three checklist entries; every checklist excerpt was an exact substring of the submitted text. No provider response text or secret was retained in the verification output.
- Final verification: 23/23 unit and route tests passed, lint passed, the production build passed, and a browser check with a mocked API confirmed sample fill, no auto-submit, explanation rendering, and a source-traceable checklist with zero live provider requests. Source review confirmed page-memory-only document/results state, no application content logging, safety copy, and only the CareBridge API route. The learner reported no walkthrough issues.
- Final review fixes: none requested. Explicit ready-to-ship confirmation remains pending. The optional task-completion interaction stays deferred outside the approved scope.
