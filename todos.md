# CareBridge Development Checklist

Updated 2026-10-25. The approved one-page CareBridge MVP is implemented. Mocked tests, lint, build, headless browser checks, the learner's final walkthrough, and one 20,000-character synthetic explanation through the CareBridge route have passed. The temporary connection-test route has been removed. Remaining work includes the code tour/app map, explicit ready-to-ship confirmation, and optional ship tasks. The separate request to mark checklist tasks complete is not in the approved scope or build plan and needs a future scope decision. The 2–4 hour estimate remains a target, not a measured result.

## Hackathon requirements and planning

- [x] Complete the installed `1-start` onboarding and create the ignored learner profile. The learner uses coding agents to understand concepts and simplify work, has planned projects before, and wants to understand the architecture and implementation well enough to explain it in interviews.
- [x] Complete `2-scope`; draft and approve `devpost/scope.md` with a one-page MVP, explicit source traceability for checklist items, and a 2–4 hour target.
- [x] Complete `3-prd`; review and approve `devpost/prd.md`. The numeric provider-dependent input cap and provider data-handling assumptions remain assigned to `4-spec`.
- [x] Complete `4-spec`; learner reviewed and approved `devpost/spec.md`.
- [x] Review and approve `devpost/checklist.md` before beginning implementation; build mode is learn.
- [ ] Confirm the proposed MVP fits the Skill Pack's 2–4 hours of active work.
- [ ] At shipping, prepare a short demo video and public GitHub repository; deployment is optional.

## Project setup and configuration

- [x] Inspect the existing Next.js App Router starter, dependencies, and npm lockfile.
- [x] Resolve the Git-root layout: confirmed the project root `C:/Users/hp/carebridge` is its own Git repository; do not operate on the parent directory.
- [x] Keep the existing Next.js stack; no additional application package was needed for the agreed proof of concept.
- [x] Document environment variable names with placeholders in `.env.example`; never add real keys.

## UI design and implementation

- [x] Replace the starter screen with the approved responsive CareBridge document workflow.
- [x] Add accessible loading, empty, validation, and recoverable error states.

## AI integration

- [x] Check the learner's Mistral Free plan; API keys require an upgrade, which the learner does not want.
- [x] Research a no-cost alternative and document Cloudflare Workers AI with Google Gemma 4 26B A4B as a draft recommendation, including current Free-plan limits and data handling.
- [x] Learner approved the Cloudflare Workers AI + Gemma 4 native REST design in `devpost/spec.md`.
- [x] Temporary local connection test succeeded with `@cf/google/gemma-4-26b-a4b-it`; account billing status and remaining quota are unverified.
- [ ] Before any additional live model request, verify the account's free quota and billing status; never enable paid usage or a paid fallback without explicit approval.
- [x] Implement safety-conscious explanation and document-question generation through the server route.
- [x] Validate structured output and handle provider failures without exposing secrets, source text, or raw provider details.
- [x] Remove the temporary `app/api/cloudflare-check/route.ts` after the live CareBridge Q&A integration succeeded; verify that only the CareBridge API route remains.

## Document extraction and validation

- [x] Keep PDF support out of the approved MVP; use pasted synthetic text only.
- [x] Validate pasted document text and enforce the provisional 20,000-character limit; keep PDF support out of scope.

## Checklist generation

- [x] Extract only follow-up tasks and instructions stated in the source document, with exact supporting excerpts.
- [ ] Allow users to mark listed tasks complete without adding medical advice.

## Document question answering

- [x] Ground answers in the current document and fail closed when an exact supporting excerpt is missing or mismatched.
- [x] Display supporting source text for supported answers and clearly say when the document lacks enough information.
- [x] Keep question history in page memory, append exchanges, preserve failed questions for retry, and clear history when the document changes.

## Testing and error handling

- [x] Add the synthetic verification plan to the approved spec; its implemented mocked checks are listed below.
- [x] Add first-slice mocked tests for input validation, native response parsing, checklist excerpt checks, and generic provider failures.
- [x] Add mocked Q&A grounding, missing/mismatched evidence, provider status, network, timeout, and malformed-response tests.
- [x] Verify in-flight document edits during explanation and question requests with mocked browser calls; stale results were discarded and edited text/history behavior was correct.
- [x] Verify browser retries preserve the explanation input, failed question, and earlier successful Q&A exchange; retry completed without re-entry and unsupported output failed closed.
- [x] Test the 20,000-character boundary with a large synthetic document and actual structured response; keep the cap provisional until it passes. Exactly 20,000 synthetic characters returned HTTP 200 with a validated explanation, uncertainty array, three checklist items, and exact source excerpts. The learner confirmed there is no billing; remaining account quota was not inspected.
- [x] Run mocked tests, lint, and production build after the Q&A implementation.
- [x] Run one approved live synthetic Q&A check after fixing Gemma response parsing; HTTP 200 returned a validated answer with source evidence, with no retry or fallback.

## Security and privacy checks

- [x] Keep document contents temporary; source inspection found no application logging or persistent browser storage for document contents/results.
- [x] Verify local credential files remain ignored and are not tracked; tracked credential-pattern matches were limited to `.env.example` placeholders and mock tests.
- [x] Make the non-diagnostic and non-emergency limitations clear in the interface.

## Deployment

- [ ] Decide whether optional hosting is useful after the local proof of concept works.
- [ ] Configure environment variables securely if deploying an AI-backed version.
- [ ] Verify the deployed app if deployment is selected.

## Demo video and submission preparation

- [ ] Record an accessible short demo showing the working proof of concept.
- [ ] Prepare a public GitHub repository after checking files/history for secrets and private data.
- [ ] Complete the learner-written Devpost submission fields and exit survey.

## Current status and next step

The `1-start`, `2-scope`, `3-prd`, and `4-spec` workflows are complete. The approved one-page app includes explanation, a source-traceable checklist, and document Q&A with session-only history and retry behavior. Mocked tests, headless mocked browser checks, lint, and production build pass. Live synthetic Q&A and the 20,000-character explanation returned validated outputs; the learner confirmed there is no billing, though remaining account quota was not inspected. The temporary connection-test route has been removed, leaving only the CareBridge API route. The learner's final walkthrough found no issues. The code tour/app map and explicit ready-to-ship confirmation remain. Keep the separate task-completion interaction out of the implementation until it is approved in scope; do not use paid billing or fallback.
