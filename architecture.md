# CareBridge Architecture

## Current implementation

CareBridge is a single Next.js 16 App Router application using React, TypeScript, and Tailwind CSS. The implementation follows the approved one-page pasted-text scope. It has no database, authentication, persistent browser storage, PDF extraction, or provider-side conversation history.

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | One-page UI; keeps document text, results, Q&A history, loading, and error state in React memory. Clears results/history on document edits and ignores stale responses. |
| `app/api/carebridge/route.ts` | Same-origin server endpoint for explanation and question requests. Validates inputs, calls Cloudflare from the server, and returns validated data or generic safe errors. |
| `app/api/cloudflare-check/route.ts` | Temporary local-only connection test route. It is not used by the normal CareBridge flow and remains to be removed after final verification. |
| `lib/carebridge.ts` | Shared input/schema validation, Cloudflare response parsing, exact excerpt checks, and safe result types. |
| `tests/carebridge.test.mjs` | Mocked route/parser tests; no live provider calls. |
| `devpost/` | Approved scope, PRD, technical spec, and build checklist. |

## Request and response flow

```text
Browser page
   | POST { operation, documentText, question? }
   v
Next.js Route Handler (server)
   | validate request; read secrets from server environment
   | POST native Cloudflare Workers AI /ai/run/{model}
   v
Cloudflare Workers AI (Gemma 4)
   | provider envelope containing model result
   v
Route Handler -> parse model JSON -> validate exact source excerpts
   | safe result or generic error
   v
Browser page (current page memory only)
```

The browser never receives the Cloudflare API token. The server sends the current document on explanation requests and sends the current document plus one question for each Q&A request. Earlier questions remain in page memory but are not sent as provider conversation history.

## Provider response handling

The configured model is `@cf/google/gemma-4-26b-a4b-it`, called using the native Cloudflare REST endpoint through server-side `fetch`. The parser accepts the returned text from either `result.response` or the documented Gemma chat-completion path `result.choices[0].message.content`.

After extracting a non-empty string, the server parses the model's JSON and validates the required fields. Checklist tasks are kept only when their exact `sourceText` occurs in the document and contains the displayed task. A supported Q&A answer is shown only with an exact matching evidence excerpt; otherwise the app fails closed to its insufficient-information response. Exact matching confirms that the excerpt is present, but does not prove that every model claim follows from it. CareBridge is not a medical decision-maker.

The route does not return raw provider bodies, model output that failed validation, document text, or secrets in errors. It uses generic recoverable messages and safe internal error codes. Avoid adding application logs of documents, questions, answers, or complete provider responses.

## Data and privacy boundaries

- Document, explanation, and question history stay in active page memory and disappear when the page is refreshed or closed.
- The app has no database, local storage, session storage, or server-side document persistence.
- Submitted text leaves the app and is sent to Cloudflare Workers AI for inference. Do not say it never leaves the app.
- The approved spec records Cloudflare's stated stateless inference and training terms, including legal/security exceptions and operational metadata. See `devpost/spec.md` for the documented assumptions and links.
- Use synthetic discharge summaries only. Do not enable provider logging, caching, paid fallback, or extra persistence.
- Account billing state and remaining free quota have not been verified. A single live synthetic Q&A verification succeeded, but it does not establish future no-charge access.

## Known verification limits

- The 20,000-character application cap is provisional until a large synthetic document passes through the actual request, response parser, and excerpt validation.
- Mocked tests, lint, production build, and a headless browser flow with mocked responses passed. One live synthetic Q&A request returned an accepted answer with source evidence.
- The browser flow for recovery/retry and document edits during in-flight explanation and question requests still needs direct verification.
- The temporary `app/api/cloudflare-check/route.ts` route remains in the repository.
- The final Skill Pack review, code tour/app map, demo video, and public repository checks remain outstanding.

## Local operation

Run `npm run dev` from the project root. The app reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` only on the server. Keep actual values in the ignored `.env.local`; `.env.example` contains placeholders. Run mocked tests with `npm test`, plus `npm run lint` and `npm run build`. These software checks do not establish medical correctness.

Product requirements remain in the approved [scope](devpost/scope.md) and [PRD](devpost/prd.md). This file describes the implementation and current verification status; it does not expand the MVP.
