# CareBridge

CareBridge helps recently discharged patients and caregivers make sense of hospital discharge instructions. It turns a pasted summary into a plain-language explanation, a follow-up checklist tied to the source text, and answers to questions about that document. The goal is to make complex instructions easier to review while making clear when details are missing.

Use synthetic text only. CareBridge is an educational document explainer, not a medical professional. It does not diagnose, prescribe, make medical decisions, or replace a care team. It is not for emergencies.

## Key features

- **Discharge summary explanation:** Get a plain-language explanation and notes about information that is missing or uncertain.
- **Source-grounded follow-up checklist:** Checklist items are retained only when their supporting excerpt appears exactly in the supplied document. Each item is shown with that source wording.
- **Document-grounded Q&A:** Ask about the current document. Answers include supporting text when available; if the document does not provide enough information, CareBridge says so instead of guessing.
- **Temporary page session:** The document, results, and question history are held in page memory. Editing the document clears prior results and question history.

## How it works

1. The user pastes text (or fills the box with the built-in synthetic sample) and chooses **Explain my instructions**. Questions can be asked after a successful explanation.
2. The browser sends an `explain` or `ask` request to the same-origin Next.js Route Handler at `/api/carebridge`. Each question request includes the current document and that question; earlier questions are not sent as conversation history.
3. The route checks the request and document, then uses server-side `fetch` to call Cloudflare Workers AI's native REST API with the configured model `@cf/google/gemma-4-26b-a4b-it`. The Cloudflare account ID and API token are read from server environment variables and are not sent to the browser.
4. The app parses the provider response as JSON and validates the required fields. Checklist items and supported answers must include exact excerpts found in the submitted document. Invalid or unsupported output is rejected or shown as insufficient information.
5. The page displays the validated results for the current document. The exact excerpt check confirms that text occurs in the source; it cannot guarantee that every model claim is clinically correct or fully entailed by that excerpt.

## Architecture

CareBridge is a single Next.js App Router application. The browser page in `app/page.tsx` holds the current document, results, and Q&A history in React memory. It posts each operation to `app/api/carebridge/route.ts`, which validates requests and calls Cloudflare Workers AI from the server with `fetch`. Shared parsing and validation in `lib/carebridge.ts` checks the model response and source excerpts before safe result fields are returned to the page.

The app has no database, authentication, or persistent document storage. Each Q&A request sends the current document and one question; prior Q&A exchanges stay in page memory and are not sent as provider conversation history. See [architecture.md](architecture.md) for the detailed flow and data-handling boundaries.

## Tech stack

- Next.js 16 App Router and Route Handlers
- React 19 and TypeScript
- Tailwind CSS 4
- Cloudflare Workers AI, called through its native REST API (no provider SDK)
- Node.js and npm

## Live demo

[Open the deployed CareBridge demo](https://care-bridge-git-master-ss-3ad5.vercel.app/).

This is the deployed URL. Public access has not been verified; Vercel deployment protection may require configuration.

## Getting started locally

Prerequisites: Node.js compatible with the installed Next.js version and npm.

```bash
git clone <repository-url>
cd carebridge
npm install
```

Create a private `.env.local` file in the project root using the names in `.env.example` (see [Environment variables](#environment-variables)). Then start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>. Choose **Try a synthetic sample**, review the text, then click **Explain my instructions**. A working Cloudflare account and token are needed for live AI requests.

## Environment variables

`.env.example` lists the exact variable names:

| Variable | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier used by the server route. |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token used by the server route to call Workers AI. |

Create a Cloudflare account, find the account ID in its dashboard, and create an API token with the permissions required for Workers AI requests. Put the actual values in the ignored project-root `.env.local` file. Keep them private; do not commit them, put them in client-side code, or share them in screenshots. `.env.example` contains placeholders only. Check your account's current plan and usage before sending requests; the app does not verify whether a request could incur charges.

## Testing and quality checks

The project checklist records these local checks as successful: 23 mocked tests (`npm test`), lint (`npm run lint`), and a production build (`npm run build`). A headless browser check with mocked API responses also covered retries and discarding stale results after document edits. These are local checks, not verification of the live deployment or of medical correctness. They are reported from the project's recorded verification; they were not rerun for this README update.

One live synthetic Q&A request and a 20,000-character synthetic explanation were recorded as successful through the CareBridge route. This verifies those specific requests at that time only; it does not verify current deployment access, account quota, billing status, or future provider availability. Do not use real patient records for testing.

## Privacy and safety

The app has no database or persistent browser storage for documents or results. Document text and question history remain in active page memory and are lost when the page is refreshed or closed. Submitted text is sent to Cloudflare Workers AI for inference: it leaves the browser app and is processed by the provider. Cloudflare's data-handling terms apply; CareBridge does not make a blanket claim that third-party providers never process or retain data. Avoid entering real health information and use synthetic documents only.

CareBridge is an educational document explainer. It does not diagnose, prescribe, or replace advice from a qualified healthcare professional. Exact source matching helps show where an excerpt came from, but does not prove medical accuracy. Contact a qualified professional for medical decisions; use emergency services in an emergency.

## Current limitations

- Input is pasted text only; there is no PDF upload or text extraction.
- There are no user accounts, database, or saved documents or conversations. Refreshing or closing the page clears the session.
- Output quality depends on the selected model, and source matching does not establish clinical correctness.
- Cloudflare access, account quota, and billing status are not verified by the app. Provider limits or availability can affect live requests.
- The 20,000-character input boundary has passed a recorded synthetic request, but this does not establish behavior for every document or provider response.

## Future improvements

Possible later work includes PDF text extraction and optional saved sessions. These are planned ideas only; neither is implemented in this proof of concept.

## Project structure

```text
app/
  api/carebridge/route.ts   # Request validation and server-side provider call
  page.tsx                  # Single-page document, results, and Q&A interface
  globals.css               # App styles
  layout.tsx                # Root layout and metadata
lib/carebridge.ts           # Input, response, and source excerpt validation
tests/carebridge.test.mjs   # Mocked route and parser tests
devpost/
  scope.md                  # Approved product scope
  prd.md                    # Product requirements
  spec.md                   # Technical blueprint and verification notes
package.json                # Dependencies and npm scripts
.env.example                # Placeholder environment variable names
architecture.md             # Current architecture and data-flow notes
todos.md                    # Development and hackathon checklist
```
