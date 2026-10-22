# CareBridge Development Checklist

This checklist reflects the repository inspected on 2026-10-22. CareBridge is currently an unmodified Next.js starter; all product work below is pending. The installed Devpost Learn Skill Pack describes a proof of concept sized for about 2–4 hours of active work. The 1-start onboarding is not complete, and the planning workflow must happen before feature development.

## Hackathon requirements and planning

- [ ] Complete the installed `1-start` onboarding and create the ignored learner profile.
- [ ] Complete `2-scope`; draft and approve `devpost/scope.md`.
- [ ] Complete `3-prd`; draft and approve `devpost/prd.md`.
- [ ] Complete `4-spec`; draft and approve `devpost/spec.md`.
- [ ] Confirm the proposed MVP fits the Skill Pack's 2–4 hours of active work.
- [ ] At shipping, prepare a short demo video and public GitHub repository; deployment is optional.

## Project setup and configuration

- [x] Inspect the existing Next.js App Router starter, dependencies, and npm lockfile.
- [ ] Resolve the Git-root layout: Git currently reports `C:/Users/hp` as the repository root, not `carebridge`.
- [ ] After spec approval, select only dependencies needed for the agreed proof of concept.
- [ ] Document environment variables in `.env.example` if an AI integration is approved; never add real keys.

## UI design and implementation

- [ ] Replace the starter screen with the approved responsive CareBridge document workflow.
- [ ] Add accessible loading, empty, validation, and error states.

## AI integration

- [ ] Choose provider/model and a compatible SDK after checking available credentials and current documentation.
- [ ] Implement safety-conscious explanation generation only after spec approval.
- [ ] Validate structured output and handle provider failures without exposing secrets or document text in logs.

## Document extraction and validation

- [ ] Decide whether PDF support fits the approved timebox; pasted text may be the first input path.
- [ ] Validate document text, size, and any supported upload type.
- [ ] If PDF is included, extract text temporarily and handle scanned or empty PDFs clearly.

## Checklist generation

- [ ] Extract only follow-up tasks and instructions stated in the source document.
- [ ] Allow users to mark listed tasks complete without adding medical advice.

## Document question answering

- [ ] Retrieve relevant passages from the current document and ground answers in them.
- [ ] Display supporting source text and say when the source does not answer a question.

## Testing and error handling

- [ ] Add focused tests for validation, medical-safety constraints, and supported API behavior after implementation.
- [ ] Run the available lint, type-check, and build commands and resolve verified errors.
- [ ] No application tests or checks have been run for this documentation-only update.

## Security and privacy checks

- [ ] Keep document contents temporary; avoid storing or logging health information.
- [ ] Verify `.env*` secrets remain ignored and no API key is committed.
- [ ] Make the non-diagnostic and non-emergency limitations clear in the interface.

## Deployment

- [ ] Decide whether optional hosting is useful after the local proof of concept works.
- [ ] Configure environment variables securely if deploying an AI-backed version.
- [ ] Verify the deployed app if deployment is selected.

## Demo video and submission preparation

- [ ] Record an accessible short demo showing the working proof of concept.
- [ ] Prepare a public GitHub repository after checking files/history for secrets and private data.
- [ ] Complete the learner-written Devpost submission fields and exit survey.

## Current blocker and next step

The Skill Pack onboarding interview is incomplete, and no approved scope, PRD, or spec exists. Next: finish `1-start`, then work through `2-scope`, `3-prd`, and `4-spec` before implementing features. The Git checkout also appears rooted at the user's home directory; determine the intended repository arrangement before any Git operation that changes files or history.
