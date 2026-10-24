---
doc: spec
status: approved
---

# CareBridge - Technical Spec

## How This Works, In Plain Language

CareBridge stays in one Next.js app. The page runs in the browser and keeps the pasted summary, results, and question history in temporary page memory. When the user asks for an explanation or an answer, the browser sends that request to a small server endpoint in the same app. That server checks the input, reads a Cloudflare API token from a private environment variable, sends the document and task to Cloudflare Workers AI, checks the response, and returns the accepted result to the page.

The Cloudflare API token never goes to the browser. There is no database, persistent browser storage, file upload, or saved conversation. The document leaves CareBridge when sent to Cloudflare Workers AI. Cloudflare's current Workers AI data terms say it processes standard, stateless inference content only as long as needed to provide the service, does not use it to train AI models, and retains operational metadata that excludes prompt and response content. Legal and security exceptions apply. Do not enable Cloudflare logging, caching, storage, or stateful features for document contents. Use synthetic summaries only.

This shape keeps the complete document workflow while avoiding separate services and persistent storage. It cannot make model output clinically reliable by itself; exact-source checks, safe fallback behavior, and synthetic-document checks reduce risk but do not prove every answer is correct.

## The Core Journey Through the System

1. The user pastes synthetic discharge text or selects the sample. The sample fills the field only.
2. The page rejects blank/whitespace text and, provisionally, text longer than 20,000 characters. Finalize the limit only after checking the actual request and model behavior with the largest synthetic summary. On **Explain my instructions**, it sends an `explain` request to the app server.
3. The Route Handler validates the request and uses server-side `fetch` to send the document and task prompt to the native Cloudflare Workers AI REST endpoint, `POST /accounts/{account_id}/ai/run/@cf/google/gemma-4-26b-a4b-it`. The Cloudflare account ID and API token stay on the server.
4. The model is asked for a JSON string. The server parses Cloudflare's outer response, requires `success: true`, and extracts the text from either `result.response` or the Gemma chat-completion path `result.choices[0].message.content`. It then parses and validates that JSON against the expected explanation/checklist or question shape. It verifies each checklist `sourceText` and Q&A `evidence` as an exact substring of the original document (`documentText.includes(sourceText)`). Items without a matching excerpt and explicit source instruction are rejected; unsupported or uncertain answers fail closed to the insufficient-information response. Treat model JSON as untrusted input; schema-constrained output for this model is not established in current Cloudflare docs.
5. For a question, the browser sends the current document and only the new question. Earlier Q&A exchanges stay visible in browser memory but are not sent as conversation history.
6. If the answer's evidence excerpt is missing or is not found exactly in the current document, the server returns the insufficient-information result.
7. If the user edits the document, the page immediately clears results/history and increments a document version. A response is displayed only if it belongs to the latest version; a late response for older text is discarded.
8. Reloading or closing the page clears the page-memory state.

PRD ref: `prd.md > The Core Journey`, `Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, `Features and Behavior > Document questions and answers`, and `States and Boundaries`.

## Stack

- **Next.js 16.4.2 App Router, React 19.3.0, TypeScript 5, Tailwind CSS 4** - already installed in the starter; keep the existing stack. React state holds the current page interactions; a Next.js Route Handler supplies the server boundary.
- **Cloudflare Workers AI, model `@cf/google/gemma-4-26b-a4b-it` (Google Gemma 4 26B A4B instruction-tuned)** - selected for the approved proof of concept. Cloudflare documentation lists its context and model capabilities. Mocked tests cover both parser response paths. One approved live synthetic Q&A request returned a validated result with evidence. This does not verify account billing status, remaining free quota, large-document behavior, or live explanation output.
- **Native server-side `fetch` rather than an SDK** - avoids an added dependency and makes the HTTP request visible. Trade-off: the app handles response parsing and provider errors itself.
- **No database, persistent browser storage, or stateful Cloudflare feature** - source and Q&A state live only in the active page. Use only the native stateless Workers AI REST model endpoint. Do not enable AI Gateway logging/caching, Cloudflare storage, batch processing, or other stateful features for document content. Do not upgrade, enable paid billing or credits, or use a paid fallback.

Framework references: [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) and the version installed here at [Next.js 16.4.2 Route Handler guide](../node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md); [React](https://react.dev/learn); [TypeScript](https://www.typescriptlang.org/docs/); [Tailwind CSS](https://tailwindcss.com/docs).

### Input limit

Keep **20,000 characters provisional** as the proposed app-level maximum. Gemma 4's model page lists a 256k-token context, but that does not prove a 20,000-character text plus CareBridge prompts and response will fit or behave well. Characters do not map exactly to tokens, and the native REST request format and model behavior still need verification. The proposed native request uses `messages` and a bounded `max_tokens` output setting; finalize the setting and app limit only after a large synthetic summary succeeds through the actual CareBridge JSON parsing and evidence validation. If it does not, stop and return a recoverable error, then bring any limit change back for review.

### Trade-offs in plain language

- **Server endpoint instead of browser-to-Cloudflare calls:** keeps the API token private and gives one place to check inputs and outputs. It adds a small server file.
- **Send the document with each question instead of a stored provider conversation:** avoids provider-side chat state. Each question resends the document and uses the account's Workers AI allowance.
- **Gemma 4 26B A4B through Cloudflare:** offers a large listed context window. Free allowance and model access depend on account conditions that have not been verified here. Model JSON must be validated by the app rather than assumed schema-compliant, and the model can still make mistakes.

## Where It Runs and How Someone Tries It

- Run locally with `npm run dev` from the project root and open `http://localhost:3000`.
- The local environment uses `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.env.local`; both were present for the temporary connection test. Never commit `.env.local`; add a placeholder-only `.env.example` and an explicit Git ignore exception for that example file.
- **Temporary connection test (completed and removed):** One tiny synthetic prompt was sent to `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/google/gemma-4-26b-a4b-it` from a temporary local-only route. The route returned only success status plus the fixed model ID; it did not expose model text. This confirmed the test request succeeded at that time, not the account's billing status or remaining free quota. A separate approved synthetic Q&A request later verified the CareBridge parser and evidence validation for one live response. No paid fallback or automatic retry was used. The temporary route was removed after that verification.
- For the demo, use only the clearly labeled synthetic example. Local recording is sufficient; deployment is optional. Shipping still requires a short demo video and a public GitHub repository checked for secrets and private data.

## Look and Feel

Carry forward `prd.md > Look and Feel`: calm healthcare colors, accessible contrast, readable typography, spacious layout, and reassuring plain-language copy. Keep the input and three results sections on one page. Use a clear reading order and single-column layout on narrow screens; avoid decoration and extra screens.

## Components

### One-page UI (`app/page.tsx`)

Owns document text, a document version counter, results, question input, Q&A history, and loading/error state in React memory. Shows the sample action, input count/limit, safety copy, results, source excerpts, and retry controls. Editing text clears old results/history immediately. Apply a response only if its captured document version matches the current version.

PRD ref: `prd.md > Screens and Layout`, `Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, `Features and Behavior > Document questions and answers`, and `States and Boundaries`.

### CareBridge Route Handler (`app/api/carebridge/route.ts`)

Accepts same-origin `POST` requests for `explain` and `question`. Validates the operation, document text, provisional 20,000-character maximum, and non-empty question. Calls Cloudflare Workers AI with the token on the server only. Parses and validates JSON output, verifies evidence excerpts, filters untraceable checklist items, and returns safe responses. Never logs request bodies, document text, generated explanations, questions, or answers.

PRD ref: `prd.md > Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, `Features and Behavior > Document questions and answers`, and `States and Boundaries`.

### Model call and evidence checks (`lib/carebridge.ts`)

Contains request/output types, instructions, input validation, request construction, response parsing, and source-excerpt checks. The server posts model-specific `messages` input to the native `/ai/run/{model}` endpoint. It requires a successful Cloudflare envelope and a non-empty string at `result.response` or `result.choices[0].message.content`, parses that string as JSON, and validates the operation's required fields. For each checklist item, require a `sourceText` excerpt that exactly occurs in the supplied document and explicitly states the task; reject the item if the excerpt is missing, mismatched, or does not support the task. For Q&A, show an answer only when it is marked answerable and has an exact matching `evidence` excerpt that supports the answer; otherwise fail closed with the insufficient-information response. Exact matching proves the excerpt occurs in the document, not that the task or every answer claim is correct or entailed. The model's source interpretation remains fallible, so use conservative prompting, synthetic checks, and clear language that CareBridge is not a medical decision-maker.

PRD ref: `prd.md > Features and Behavior > Input validation`, `Features and Behavior > Document input and explanation`, `Features and Behavior > Document questions and answers`, and `Verification Plan`.

## Data Model

| Data | Where it lives | Update and exit behavior |
| --- | --- | --- |
| `documentText: string` | Browser page memory; sent in a POST body to the app server and then Cloudflare Workers AI for processing | User edits it; edits clear old outputs. Lost on reload/close. |
| `documentVersion: number` | Browser page memory only | Incremented on text edits; stale responses with an earlier version are discarded. |
| Explanation/checklist with source excerpts | Browser memory after server validation | Replaced after successful analysis, cleared on document edit, lost on reload/close. |
| Current question and Q&A exchanges | Browser memory; each request sends only the current document and question | New exchanges append; failed questions remain retryable. History clears on document edit or page exit. |
| Provider prompt and output | Sent to Cloudflare Workers AI's stateless native `/ai/run/{model}` endpoint; not stored by the app | Cloudflare says content is processed only as long as needed to provide standard inference and is not used to train; limited legal/security exceptions apply. Operational metadata excluding content may be retained. |
| Cloudflare account ID and API token | Server environment as `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; never sent to browser | Locally provided in ignored `.env.local`; never committed or logged. |

### Cloudflare Workers AI data handling

- Cloudflare's current Workers AI documentation says standard stateless inference content is processed only as long as needed to provide the service, and is not used to train AI models. Limited legal/security exceptions apply; describe this as the provider's stated handling, not a promise that data never leaves the app.
- Operational metadata such as model/account identifiers, timestamps, request sizes, token/neuron counts, latency, and status codes may be retained; the documentation says this metadata excludes customer content.
- Do not use AI Gateway logging/caching, Cloudflare storage, batch, or other stateful features for document content, and do not log content in CareBridge. Use synthetic summaries only.
- Cloudflare serves the inference and processes the submitted text. The applicable Cloudflare agreement and the selected model's license also govern use.

## Minimal Verification Plan

Use synthetic discharge summaries and questions only. The connection check confirmed a successful provider response, but not billing status or remaining quota. Mocked tests cover response parsing and source checks, and one approved live synthetic Q&A request returned a validated answer with evidence. Large-document behavior and some UI recovery cases remain to be verified. Do not issue further AI requests unless explicitly approved; never enable paid billing or use a paid fallback.

| Case | Check | Expected result |
| --- | --- | --- |
| Empty input | Submit whitespace-only document text. | Reject locally and preserve the entered text; do not call Cloudflare. |
| Large synthetic document / provisional limit | Submit a synthetic summary at the proposed 20,000-character cap with the complete CareBridge prompt and bounded output settings. | Confirm the native endpoint accepts the request and the app parses and validates the complete structured response. Keep the 20,000-character limit provisional until this passes; if it fails, stop and request review of a changed cap. |
| Structured CareBridge response | Use a synthetic document with explicit follow-up tasks and missing/uncertain details. | Parse the Cloudflare envelope and extract text from `result.response` or `result.choices[0].message.content`; validate the explanation, uncertainty notes, checklist shape, and excerpts. Show only validated fields. |
| Supported question | Ask for an appointment date stated in the synthetic summary. | Answer includes the date and a verbatim evidence excerpt from that summary. |
| Unsupported question | Ask for a medication dose or instruction absent from the summary. | Clearly say the document does not provide enough information; do not guess. |
| Checklist traceability | Include one explicit follow-up instruction and nearby non-instructional text; also simulate a task with missing, mismatched, or non-supporting source text. | Keep only the explicit instruction with an exact matching source excerpt; reject unsupported or untraceable items. |
| Missing or mismatched Q&A excerpt | Simulate an answer with no evidence excerpt or an excerpt that is not an exact document substring. | Fail closed and show that the document does not provide enough information; do not show the unsupported answer. |
| Malformed model output | Simulate invalid JSON, an invalid Cloudflare response envelope, non-string/empty/missing model text in both supported paths, or missing required fields. | Show no fabricated or partial result; preserve document/question and offer manual retry. |
| Provider error | Simulate authentication, network, timeout, capacity, or other provider failure. | Keep document/question; show a generic recoverable error without raw provider text, identifiers, or secrets. |
| Rate limit and quota exhaustion | Simulate Cloudflare `429` responses, including daily allowance code `3036`. | Keep document/question; show a recoverable message and manual retry. Do not automatically retry, upgrade, use paid credits, or call a paid fallback. |
| Edit during request | Change the synthetic document while an explanation or question request is in flight. | Clear prior results/history as specified by the PRD and discard the stale response; retain the edited text. |

## File Structure

```text
carebridge/
|-- app/
|   |-- api/carebridge/route.ts # Server validation and Cloudflare proxy
|   |-- globals.css             # Responsive accessible styles
|   |-- layout.tsx              # Existing root layout and metadata
|   `-- page.tsx                # One-page UI and temporary state
|-- devpost/
|   |-- learner-profile.md      # Ignored personal learning profile
|   |-- scope.md                # Approved scope
|   |-- prd.md                  # Approved requirements
|   `-- spec.md                 # This blueprint
|-- lib/carebridge.ts           # Types, validation, prompt/schema, API call, evidence checks
|-- .env.example                # Placeholder key name only
|-- .gitignore                  # Ignore .env.local; allow .env.example
|-- package.json                # Existing scripts/dependencies; no SDK proposed
`-- README.md                   # Existing run/setup guide to update during build
```

## External Services and Dependencies

### Cloudflare Workers AI

- **Model:** Google Gemma 4 26B A4B hosted by Cloudflare, model ID `@cf/google/gemma-4-26b-a4b-it`. Cloudflare documentation lists its model capabilities and Free-plan availability; account billing status and remaining free quota are unverified. A tiny temporary connection test succeeded, and one live synthetic Q&A response was accepted by the CareBridge parser with evidence. The large-document case and live explanation case remain untested.
- **Call:** use Cloudflare's native Workers AI endpoint `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/google/gemma-4-26b-a4b-it`, with `Authorization: Bearer <server-side token>` and `Content-Type: application/json`. The request body uses the model-specific `messages` form: a system message specifying document-only output and JSON fields, a user message containing the current document and operation, and bounded output settings. Do not enable streaming, automatic retry, alternate models, or paid fallback. The output is a Cloudflare envelope (`success`, `result`, `errors`, and `messages`); require `success === true`, then accept a non-empty string from `result.response` or `result.choices[0].message.content`. Parse it as JSON and validate its exact shape and source excerpts. Never pass raw provider error details to the browser or log secrets or document content. Cloudflare does not establish schema-constrained output for this model, so malformed JSON must fail safely.
- **Explanation/checklist response shape:** `{ explanation: string, missingOrUncertain: string[], checklist: [{ task: string, sourceText: string }] }`.
- **Question response shape:** `{ answerable: boolean, answer: string, evidence: string | null }`.
- **Provider response:** read model text from `result.response` or `result.choices[0].message.content`, parse it as JSON, validate all required fields and types, then apply exact source checks. Reject unsuccessful envelopes, malformed JSON, missing result text, and invalid output. Return only safe, validated CareBridge fields or generic error status; never expose raw provider errors, secrets, or source request bodies.
- **Published Free-tier terms (not account verification):** Cloudflare documents 10,000 Neurons per day on Workers Free, resetting at 00:00 UTC, after which Free-plan requests fail. Text Generation is also limited to 300 requests per minute, and Gemma 4 is listed as available on Workers Free. These published limits do not confirm this account's plan, remaining quota, or billing status. Never upgrade or enable paid credits; do not retry beyond an exhausted daily allowance or make a request if it could incur charges.
- **Data handling:** standard stateless inference content is processed only as long as needed to provide the service, and Cloudflare says it does not use Customer Content to train AI models. Limited legal/security exceptions apply; operational metadata excluding prompt/response content may be retained. No content logging, caching, storage, or stateful features.
- **Credentials:** `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are read only in server code from environment variables. They were present for the temporary connection test; values must never be printed, logged, returned, or sent to browser code.
- **Docs:** [Gemma 4 model page](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/), [Free plan pricing and daily allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Free-plan model availability](https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/), [rate limits](https://developers.cloudflare.com/workers-ai/platform/limits/), [native REST API setup and token permissions](https://developers.cloudflare.com/workers-ai/get-started/rest-api/), [Run a Workers AI model API](https://developers.cloudflare.com/api/go/resources/ai/methods/run/), [data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/), [JSON mode limitations](https://developers.cloudflare.com/workers-ai/features/json-mode/).

### App server

The existing Next.js app hosts the page and server Route Handler. The browser posts the active document and operation to that same-origin route. The route validates them, uses server-side `fetch` to call Cloudflare's native Workers AI `/ai/run/{model}` endpoint, and keeps the account ID and API token in server environment variables. It sends model-specific messages with document-only instructions and bounded output settings. It accepts only a successful provider envelope with a non-empty string at `result.response` or `result.choices[0].message.content`, parses and validates the CareBridge JSON before returning safe fields to the page, and converts all provider failures into generic recoverable errors. No database, OCR service, or other external service is proposed. The installed Next.js guide is `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`; it documents Web `Request`/`Response` handlers under `app/`, and that `POST` Route Handlers are not cached by default.

## Important Failure Modes

- **Blank or over-limit text** -> reject before contacting the provider; show an input prompt and preserve entered text.
- **Daily free allocation exhausted (Cloudflare `429`, code `3036`)** -> preserve the document/question, show a generic recoverable message and manual Retry action. Do not automatically retry, upgrade, enable paid billing/credits, or use paid fallback. The application must not claim the account's billing or quota state is verified.
- **Rate limit (`429`)** -> preserve the document/question, show a brief wait-and-retry message, and provide manual Retry. Do not automatically retry or incur paid usage.
- **Malformed model JSON, missing fields, or invalid source excerpts** -> show no partial or fabricated result; preserve the document/question and provide a manual Retry action. For Q&A, an absent or non-matching evidence excerpt becomes the PRD's clear insufficient-information response.
- **Token, network, timeout, capacity, or other provider error** -> preserve the document/question, return a beginner-friendly generic failure and manual Retry without raw provider details, identifiers, or secrets. Do not send raw provider error bodies to the browser.
- **Document edited in flight** -> document version no longer matches, so discard the late result. Keep edited text and do not restore old outputs.
- **No Free access or no quota** -> fail closed with a recoverable error. Never upgrade the account, enable paid billing/credits, make a paid request, or silently switch to another paid provider/model.

## What Was Simplified and Why

- Pasted synthetic text instead of PDF/OCR - avoids extraction and file retention complexity.
- Stateless native Workers AI REST requests with source text in each question request instead of provider conversation state or a vector database - avoids provider-side conversation/document state and extra infrastructure. Trade-off: each Q&A request resends the document and consumes the account's Workers AI allowance.
- Browser page memory instead of database or persistent browser storage - matches the one-page temporary workflow; refresh clears the session.
- Native `fetch` instead of an SDK - avoids another package; app code handles the request and response validation.
- A provisional 20,000-character cap instead of arbitrary-length input - bounds a one-document request, but must pass the large synthetic request and actual structured-response validation before the cap is finalized.

## Decisions and Open Issues

### Learner decisions

- Use Cloudflare Workers AI with Gemma 4 26B A4B, model ID `@cf/google/gemma-4-26b-a4b-it`, for the approved MVP design.
- Use Cloudflare's native `POST /accounts/{account_id}/ai/run/{model}` REST endpoint for CareBridge, matching the endpoint used by the successful temporary connection test.
- Keep the 20,000-character input limit provisional until the large synthetic-document request and actual CareBridge response validation pass.
- Use synthetic summaries only. Do not upgrade, enable paid billing or credits, or use a paid fallback.
- Preserve the approved one-page, no-storage CareBridge product. The spec was approved before implementation.

### Remaining review decisions and checks

- One approved live synthetic Q&A request verified that the native provider result was parsed and its answer accepted with exact source evidence. This does not verify the account's plan, paid billing state, remaining free quota, the explanation operation, or large-document behavior. Do not make further live requests without explicit approval; never upgrade, enable paid billing/credits, or use a paid fallback.
- Keep the 20,000-character limit provisional until the large synthetic-document case in the verification plan passes with the actual request, response parsing, and excerpt checks. If it fails, bring a revised limit back for approval.
- The source-excerpt check proves that text is present in the document, not that the model interpreted it correctly or that every answer claim follows from it. The model must reject unsupported checklist items and fail closed for unsupported Q&A, but this is not a guarantee of clinical correctness. CareBridge explains the document and is not a medical decision-maker.
- **Privacy:** use only stateless inference. Cloudflare states it processes customer content only as needed for inference and does not use it to train models; limited legal/security exceptions and non-content operational metadata apply. This still sends the document outside CareBridge.
- **SDK:** use native `fetch`; no new dependency. This is an implementation simplification, not a learner preference.
- **Run location:** local development and local demo recording; deployment is optional.

### Learning moment

The temporary test exercised account access to the selected model with one tiny request. A later approved synthetic Q&A request traced the CareBridge route through native response parsing and source validation. Neither request verified plan/billing/quota status. Before any additional live model use, check whether it can be made without paid usage; never enable paid billing or a paid fallback.

### Setup and implementation checks

- Cloudflare model invocation succeeded through the temporary route, and one approved live Q&A request returned a validated result. The account plan, billing status, and remaining free quota have not been checked. Confirm in the dashboard before any further AI use; do not add paid billing or credits.
- The API token and account ID are already supplied in `.env.local` for local server-side use. Never display, log, return, or commit their values.
- Keep the 20,000-character limit provisional until the largest synthetic summary has passed through the native request, actual structured response parsing, and exact excerpt validation. If it does not fit or behaves unreliably, stop and bring any cap change back for review.
- Review Cloudflare's current Workers AI data handling and the Gemma model license before setup; do not enable logging, caching, persistent storage, or paid usage.
- Deployment is not required for the local proof of concept.
