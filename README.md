# CareBridge

CareBridge is a planned AI-powered healthcare document simplifier. It is intended to help patients and caregivers understand discharge summaries and other healthcare instructions in plain language. **The repository is currently the unmodified Next.js starter; the CareBridge features described below are goals, not implemented functionality.**

## Problem and proposed solution

Medical documents can be difficult to understand after a visit. The proposed proof of concept will explain a supplied document in plain language, surface tasks stated in that document, and answer questions using relevant source passages. It must say when the source does not provide an answer and must not invent medical instructions.

## Planned features and current limitations

- Planned: paste document text and receive a structured plain-language explanation.
- Planned: a checklist of follow-up actions explicitly present in the document.
- Planned: question answering grounded in relevant passages from the current document.
- Under consideration: PDF upload and text extraction, subject to the approved timebox and technical plan.
- Not implemented: all CareBridge product features, AI integration, PDF processing, tests, and deployment.

CareBridge is an educational document-understanding concept, not a diagnostic system or a clinically validated product. It is not for emergencies and does not replace advice from a healthcare professional. Users should ask their care team about unclear or conflicting instructions.

## Technology and architecture

The existing starter uses Next.js 16.4.2 App Router, React 19.3.0, TypeScript, Tailwind CSS 4, and npm. The planned architecture keeps the UI in `app/` and reusable components in `components/`; any backend endpoints would be Next.js Route Handlers under `app/api/`. No separate frontend/backend applications, database, or vector database are part of the current repository. See [architecture.md](architecture.md) for observed and proposed structure.

No AI provider or SDK has been selected, and no API credentials have been configured. A provider choice and any new dependencies are pending the approved technical spec. Never put an API key in client-side code or commit real credentials.

## Requirements

- Node.js compatible with the installed Next.js version.
- npm (the repository includes `package-lock.json`).

## Install and run

From the project root (`C:\Users\hp\carebridge`), install the dependencies already recorded in the lockfile and start the development server:

```bash
npm install
npm run dev
```

`npm install` prepares the existing dependencies; `npm run dev` starts Next.js locally. Open [http://localhost:3000](http://localhost:3000). At present, this shows the default Next.js starter screen, not a working CareBridge application.

The available scripts are `npm run dev`, `npm run build`, `npm run start`, and `npm run lint`. No separate type-check or test script is configured. These commands have not been run as part of this documentation update.

## Example use

There is no working CareBridge input flow yet. Once implemented, demonstration content must be synthetic and contain no real patient information. Do not treat generated explanations as medical advice.

## Privacy and safety

The intended design processes documents temporarily, without storing their contents. This is a design goal and has not yet been implemented or verified. Do not upload real patient documents to this starter. The future application must avoid logging document text or secrets, preserve source warnings and uncertainty, and direct users to a healthcare professional when instructions are unclear.

## Planning and status

The Devpost Learn Skill Pack is installed in `agent/skills/`. Its required onboarding and planning workflow is not complete: no `devpost/learner-profile.md`, `devpost/scope.md`, `devpost/prd.md`, or `devpost/spec.md` exists. Complete `1-start`, then `2-scope`, `3-prd`, and `4-spec` before substantial feature development. The installed workflow targets a small proof of concept of about 2–4 hours of active work.

Project progress is tracked in [todos.md](todos.md). The troubleshooting record is [errors.md](errors.md).

## Testing

No CareBridge-specific tests exist yet. After the implementation plan is approved, add focused tests for document validation, source-grounded behavior, and medical-safety requirements. Do not claim the app is safe or clinically validated based on software tests.

## Deployment and hackathon submission

Deployment is optional in the installed Skill Pack. Submission requires a short demo video and a public GitHub repository; the learner completes their own Devpost submission fields and exit survey. No deployment, demo, public repository, or submission link is available yet. Before publishing, check the repository contents and history for secrets and private information.

## Future work

Potential future work—only if it fits the agreed scope—includes PDF extraction, stronger source references, and deployment. No features or services beyond the approved proof of concept should be assumed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
