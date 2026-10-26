# CareBridge Development Checklist

Updated 2026-10-26. The approved one-page proof of concept is implemented. Project records report 23 passing mocked tests, lint, production build, a mocked browser flow, the learner's final walkthrough, one live synthetic Q&A request, and one 20,000-character synthetic explanation through the CareBridge route. These checks were recorded before this documentation update and were not rerun for it. The deployed URL is recorded in `README.md`; public access has not been verified. Explicit ready-to-ship confirmation remains. The separate request to mark checklist tasks complete is deferred pending a scope decision because it is outside the approved scope/build plan. The 2–4 hour estimate is a target, not a measured result.

## Hackathon requirements and planning

- [x] Complete the `1-start` onboarding and learner profile.
- [x] Complete and approve `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md`.
- [x] Review and approve `devpost/checklist.md` before implementation; build mode was learn.
- [x] Complete the learner's final walkthrough and code tour; the offline app map is in `devpost/app-map.html`.
- [ ] Confirm the proposed MVP fits the Skill Pack's 2–4 hours of active work.
- [ ] Record a short demo video and complete the learner-written Devpost submission and exit survey.
- [ ] Complete explicit ready-to-ship confirmation.

## Project setup and configuration

- [x] Inspect the existing Next.js App Router starter, dependencies, and npm lockfile.
- [x] Keep the existing Next.js stack; no additional application package was needed.
- [x] Document environment variable names with placeholders in `.env.example`; never add real keys.
- [x] Keep Cloudflare credentials in ignored `.env.local`; they are read only by server code.

## Product implementation

- [x] Implement the responsive one-page pasted-text flow and synthetic sample.
- [x] Add accessible empty, loading, validation, and recoverable error states.
- [x] Generate a plain-language explanation and missing/uncertain notes.
- [x] Show checklist tasks with exact supporting source excerpts.
- [x] Ground Q&A in the current document, show source excerpts for supported answers, and fail closed when evidence is missing or mismatched.
- [x] Preserve failed questions for retry and clear results/history when the document changes.
- [x] Keep document, results, and Q&A history in page memory only; no database or persistent browser storage.
- [x] Keep PDF extraction, accounts, and persistent history outside the approved MVP.
- [x] Remove the temporary connection-test route; `app/api/carebridge/route.ts` is the app's API route.
- [ ] Add an in-app way to mark checklist tasks complete without adding medical advice; this was proposed but is not part of the approved scope.

## AI integration and limits

- [x] Use Cloudflare Workers AI with model `@cf/google/gemma-4-26b-a4b-it` via the native server-side REST API.
- [x] Validate the Cloudflare response, parse model JSON, check required fields, and validate excerpts before returning results.
- [x] Handle provider failures with generic recoverable errors; do not expose secrets, source text, or raw provider details.
- [x] Verify one live synthetic Q&A response and one 20,000-character synthetic explanation through the CareBridge route.
- [ ] Check Cloudflare account quota and billing status before further live requests; do not enable paid billing, credits, retries, or fallback.

## Verification and privacy

- [x] Mocked route/parser test suite: 23 tests reported passing.
- [x] `npm run lint` reported successful.
- [x] `npm run build` reported successful.
- [x] Mocked browser checks covered retry behavior and discarding stale results after edits during explanation and Q&A.
- [x] Verify that credential files are ignored and not tracked; tracked credential-pattern matches were limited to `.env.example` placeholders and mock tests.
- [x] Make non-diagnostic and non-emergency limits clear in the interface.
- [x] Document that exact excerpt matching provides source traceability but does not establish model correctness or clinical accuracy.

## Deployment and public release

- [x] A deployed URL is available: <https://care-bridge-git-master-ss-3ad5.vercel.app/>.
- [ ] Verify whether public access is available; Vercel deployment protection may still require configuration.
- [ ] Review the public repository contents and history for secrets or private data before release.

## Current status and next step

The complete approved one-page workflow is implemented. The project checklist records successful local tests, lint, build, and mocked browser checks, plus the synthetic provider checks described above. The app sends submitted text to Cloudflare Workers AI; use synthetic summaries only. Public access to the deployed URL, Cloudflare account quota/billing status, and explicit ready-to-ship confirmation remain unverified. Do not make further live model requests unless separately approved, and do not enable paid usage or a paid fallback. The proposed checklist-completion interaction remains deferred pending a scope decision.
