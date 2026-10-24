# Troubleshooting Log

This file is the index of observed project issues. The full CareBridge model-response diagnosis is in [error.md](error.md). No credentials, document text, model answer text, or raw provider body is recorded here.

## 2026-10-22: Git initially resolved to the home directory

- **Observed:** Early repository inspection from the project directory reported the home directory as the Git root.
- **Current status:** Resolved. On 2026-10-24, `git rev-parse --show-toplevel` from the project returned `C:/Users/hp/carebridge`, and `.git` exists in the project root.
- **Note:** The earlier repository arrangement is kept here as history; it is not a current blocker.

## 2026-10-24: CareBridge 502 from Gemma response-shape mismatch

- **Observed:** The API returned `invalid_cloudflare_result_response_missing` for a Q&A request.
- **Cause:** The parser required `result.response`, while the observed result used the chat-completion shape with `choices`. Cloudflare's Gemma docs show generated text at `choices[0].message.content` for that shape.
- **Fix:** The parser now accepts either `result.response` or `result.choices[0].message.content`, then applies the same strict JSON and source-excerpt checks.
- **Verification:** Mocked tests and a mocked browser flow passed; one explicitly approved live synthetic Q&A request returned HTTP 200 with validated evidence. No retry or fallback was used.
- **Remaining limits:** That single live request does not verify account billing status, remaining quota, large-document behavior, or the explanation operation. See [the detailed issue record](error.md).
