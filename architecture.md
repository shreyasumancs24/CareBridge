# CareBridge Architecture

## Current state

This document records the observed starter and a proposed direction for review; the CareBridge product architecture is not implemented or approved yet. The repository contains a Next.js 16.4.2 App Router starter, React 19.3.0, TypeScript, Tailwind CSS 4, and an npm lockfile. `app/page.tsx` still renders the default starter page, `app/layout.tsx` defines the root layout and default metadata, and `app/globals.css` imports Tailwind. There is no `app/api/`, `components/`, `lib/`, or tests directory at this point.

The Git command resolves the repository root to `C:/Users/hp`, while the project files are in `C:/Users/hp/carebridge`; there is no `.git` directory in the project root. This is an environment/repository-layout issue to resolve before Git-based publishing.

## Proposed MVP shape (pending Skill Pack planning and learner approval)

Keep one Next.js application. UI belongs in `app/` and reusable UI in `components/`; backend Route Handlers, if needed, belong in `app/api/`. Put narrowly scoped shared server logic in `lib/`. Do not create separate frontend or backend projects/folders for appearance.

The likely core flow is: user pastes synthetic or their own document text, requests a plain-language explanation and checklist, then asks a question about that same document. The initial version should favor temporary in-memory request processing and no database, accounts, or persistent document storage. Whether PDF extraction is included remains a scope decision because it adds dependency, validation, and error-handling work.

## Proposed responsibilities

- `app/`: App Router pages, layout, styles, and (if included) API Route Handlers.
- `components/`: reusable accessible interface elements, if the UI requires them.
- `lib/`: request validation, AI provider adapter, prompt/output parsing, and source-passage selection, if the approved design needs these helpers.
- `public/`: static assets.
- `tests/`: focused tests for safety and validation, if tests fit the selected proof-of-concept setup.

These directories are recommendations, not existing files.

## Proposed data flow and endpoints

Endpoint contracts are not approved or implemented. A simple implementation could expose an analysis Route Handler accepting validated document text and returning structured explanation sections plus document-supported tasks. A question Route Handler could accept the document text and a question, retrieve relevant text passages, and return an answer with its supporting passage or an explicit insufficient-information result. Keep request/response schemas small and validate them before calling an AI provider.

For a short document, passage selection can be simple local text chunking or keyword/relevance matching; no vector database is justified for this MVP. The browser should not receive the AI provider secret. Route Handlers should avoid logging request bodies, particularly medical text.

## AI and medical safety (proposed)

Choose a provider and SDK only after the product spec and credential availability are known. Prompts should require plain-language explanations grounded in the source, preserve warnings and uncertainty, distinguish source statements from general explanations, and prohibit diagnoses, medication changes, invented doses, or unsupported follow-up instructions. Validate the response shape and handle malformed or unavailable AI output. The interface must say that CareBridge is educational, not clinically validated, not a substitute for a clinician, and not for emergencies.

## Validation, errors, and privacy (proposed)

Validate text and upload types/size at the server boundary; if PDF is supported, reject encrypted, empty, or unreadable content with clear guidance. Process document data only for the request and avoid persistence. Do not put document content or secrets in logs or error messages. Use environment variables for any server-side API key, with placeholder names in `.env.example` and actual `.env*` files ignored by Git.

## Deployment (not selected)

The installed Skill Pack makes deployment optional; the required submission evidence is a short demo video and a public GitHub repository. If a hosted version is chosen later, a Next.js-compatible host such as Vercel is a candidate, with provider secrets configured in server-side environment settings. No deployment URL or account configuration exists.

## Trade-offs and pending decisions

- Start with pasted text if PDF extraction threatens the short timebox; decide in approved scope/spec.
- Use document-local passage retrieval rather than a vector database to keep the proof of concept small and explainable.
- Avoid database and authentication because the core demonstration can work within one temporary session.
- Select an AI provider and dependencies only after checking credentials, SDK compatibility, and the approved requirements.
- Planning workflow and MVP boundaries remain pending; no application feature code has been written.
