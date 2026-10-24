# CareBridge

CareBridge is a one-page proof of concept for helping patients and caregivers understand a synthetic hospital discharge summary. It provides a plain-language explanation, a checklist based on explicit instructions, and question answering with supporting text from the supplied document.

**Demo safety:** Use synthetic medical text only. CareBridge does not diagnose, prescribe, make medical decisions, or replace a healthcare professional. It is not for emergencies.

## Current status

- The approved scope, PRD, and technical spec are in `devpost/`.
- The app has a pasted-text flow, synthetic sample, explanation, source-backed checklist, and document Q&A.
- Cloudflare Workers AI is called from a server-side Next.js Route Handler using `@cf/google/gemma-4-26b-a4b-it`.
- One approved live synthetic Q&A request succeeded after correcting response parsing. This does not verify the account's billing status or remaining free quota.
- The 20,000-character input maximum is provisional until a large synthetic-document request passes end-to-end validation.
- `app/api/cloudflare-check/route.ts` is a temporary connection-test route. The normal app uses `app/api/carebridge/route.ts`.
- Deployment is not configured. The Devpost demo video, public repository review, final skill-pack review, and app map remain future work.

## Run locally

Requirements: Node.js compatible with the installed Next.js version and npm.

1. From the project root, install the lockfile dependencies if needed:

   ```bash
   npm install
   ```

2. Add the server-only variables to the ignored project-root `.env.local` file:

   ```text
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   ```

   Do not paste real values into source files, browser code, documentation, or chat. Do not commit `.env.local`. `.env.example` contains placeholder names only.

3. Start the local app:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:3000> and use the synthetic sample. Selecting the sample only fills the text area; press **Explain my instructions** to submit it.

Live explanation and Q&A requests send the submitted synthetic text to Cloudflare Workers AI and use the account's allowance. The account's billing status and remaining free quota are not verified. Do not enable paid billing or use a paid fallback.

## How the app works

1. `app/page.tsx` keeps the document, results, and question history in page memory.
2. The browser sends an `explain` or `ask` request to `app/api/carebridge/route.ts`.
3. The server validates the request and sends it to Cloudflare using `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. The token is not sent to the browser.
4. `lib/carebridge.ts` validates the provider response, parses the model JSON, and checks checklist and answer excerpts against the submitted document.
5. The page displays only accepted fields. Editing the document clears old results and history; stale responses are discarded.

For the design, privacy assumptions, verification limits, and known issues, see [architecture.md](architecture.md), [devpost/spec.md](devpost/spec.md), [todos.md](todos.md), and [errors.md](errors.md).

## Checks

```bash
npm test
npm run lint
npm run build
```

The tests use mocked provider responses. They do not prove medical correctness. One live synthetic Q&A request was separately verified; the 20,000-character case and some browser recovery cases remain to be checked.

## Scope boundaries

The MVP uses one page and pasted synthetic text. It has no authentication, database, persistent document storage, PDF upload, or saved conversation history. See [the approved scope](devpost/scope.md) and [approved PRD](devpost/prd.md) for product requirements.
