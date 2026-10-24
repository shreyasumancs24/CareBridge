# CareBridge 502: Gemma response format mismatch

## What happened

CareBridge returned HTTP 502 with the safe internal code `invalid_cloudflare_result_response_missing` when handling a question. The application successfully received and parsed Cloudflare's outer response envelope, but the result did not contain the `result.response` field that the parser required.

One live synthetic request provided safe shape diagnostics: the result exposed chat-completion fields such as `choices`, `created`, `id`, `model`, `object`, and `usage`. Cloudflare's Gemma documentation shows generated text in `choices[0].message.content` for this chat-completion response shape. The app had assumed the text would always be in `result.response`, so it rejected the response before validating the model's JSON.

## Resolution

Updated `lib/carebridge.ts` to read model text from either supported location:

- `result.response`
- `result.choices[0].message.content`

The parser still requires a successful Cloudflare envelope and non-empty string content. Existing JSON-shape checks, exact source-excerpt validation, and fail-closed behavior remain in place. No provider response text, document content, credentials, or answer text was logged or added to this note.

## Verification

- Mocked parser and route tests passed, including Gemma's chat-completion shape and malformed output cases.
- Headless browser flow passed with mocked responses: sample input, explanation, source-backed checklist, and Q&A answer with evidence all rendered.
- Lint and production build passed.
- One explicitly approved live synthetic Q&A request returned HTTP 200 with a validated answer and source evidence. No retry or model fallback was used.

The live test confirms the response-shape fix for that request. The account's billing status and remaining free quota were not checked. The 20,000-character app limit remains provisional pending a large synthetic-document test.
