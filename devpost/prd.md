---
doc: prd
status: approved
---

# CareBridge — Product Requirements

CareBridge helps recently discharged patients and their caregivers understand one supplied discharge summary through a plain-language explanation, a source-traceable checklist, and document-grounded answers. Source: `scope.md > Who It's For`, `The Unique Kernel`, and `The POC Boundary`.

## The Core Journey

1. The user opens one responsive page with CareBridge's name, a reassuring introduction, a brief explanation of its limits, and a large labeled document text area.
2. The user pastes a synthetic discharge summary or selects the sample option. Selecting the sample fills the text area only; the user can review or edit it and must click **Explain my instructions** to start.
3. CareBridge processes the supplied text. While it works, it shows a loading state and prevents duplicate submissions.
4. On success, the page displays a plain-language explanation and a follow-up checklist. Each checklist item is accompanied by its explicit supporting wording from the supplied document.
5. The user asks a question about the same document. CareBridge adds the question, answer, and supporting source text when available to the Q&A section. When the document does not answer, it says that clearly instead of guessing.
6. The user can ask more questions during the current page session; earlier exchanges remain visible. No document or Q&A history is saved after the page session.
7. If the user edits the document after results exist, CareBridge immediately clears the explanation, checklist, and Q&A history, keeps the edited text, and explains that new results are needed. The user must click **Explain my instructions** again; the page does not reprocess automatically.

Sources: `scope.md > The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

## Screens and Layout

CareBridge has one page and no separate screens. At the top is the CareBridge name and tagline, followed by a short welcome and safety statement. A clearly labeled, large text area and sample-text option form the input area, with **Explain my instructions** as the primary action. Results appear on that same page beneath the input in three distinct sections: plain-language explanation, follow-up checklist, and Q&A. Before results exist, the results area is hidden or shows a brief instruction to paste text. The layout adapts to narrow screens and uses readable type, spacing, and accessible colors.

Sources: `scope.md > Inspiration & Identity` and `The POC Boundary`.

## Look and Feel

Use a clean, modern, healthcare-focused style that feels calm and reassuring. Prioritize clarity, readable typography, good spacing, and accessible colors over decoration. The interface should be simple for patients and caregivers to understand and responsive on small and large screens.

Source: learner's PRD interview; consistent with `scope.md > Inspiration & Identity`.

## Features and Behavior

### Input validation

- The document field rejects empty or whitespace-only text and shows a clear inline message without sending a request.
- Enforce a maximum character length before sending the text to the AI provider. If the text exceeds the limit, explain how to shorten it and preserve the entered text.
- The numeric maximum is provider- and model-dependent. Select it in `4-spec` after choosing the AI provider/model, allowing room for the system instructions, question, and generated response within that model's context limits. The UI and server must enforce the same chosen limit.
- The selected provider's data-handling assumptions must be documented before implementation. The document and generated medical responses may leave the app for provider processing; CareBridge must not claim otherwise.

Acceptance criteria:

- [ ] Empty or whitespace-only input is rejected with a clear prompt and no request is sent.
- [ ] Over-limit input is rejected with a clear message, remains in the field, and is not sent. The approved limit is consistent in the UI and request handling.
- [x] The selected provider/model, the reason for the provisional limit, and provider data-handling assumptions are documented in `spec.md` before implementation.

Source: `scope.md > The POC Boundary`; learner's latest PRD refinements.

### Document input and explanation

- The user can paste or edit discharge-summary text in a clearly labeled text area.
- The sample option fills the text area with a synthetic example only. It does not start processing.
- Clicking **Explain my instructions** starts processing the current text and produces both a plain-language explanation and follow-up checklist.
- The explanation preserves the source meaning and distinguishes information explicitly supported by the document from information that is missing or uncertain.
- CareBridge does not infer medication doses, schedules, or other medical instructions. It does not diagnose or prescribe treatment.
- Every checklist item comes only from a follow-up task or instruction explicitly stated in the source. Each item visibly includes its supporting source wording so the user can trace it back to the document.

Acceptance criteria:

- [ ] Selecting the sample populates the text area; no results are generated until the user clicks **Explain my instructions**.
- [ ] After successful processing, the explanation and checklist appear on the same page.
- [ ] Every checklist item has supporting source wording from the supplied text; no item adds an unstated action or instruction.
- [ ] Missing or uncertain information is identified as such rather than filled with an inferred dose, schedule, or instruction.

Sources: `scope.md > The Unique Kernel`, `The Core Loop`, and `The POC Boundary`.

### Document questions and answers

- After the document has been processed successfully, the user can enter a question about that document.
- Each submitted question appears with its corresponding answer. When the document supports the answer, the answer includes relevant supporting source text.
- Answers must be supported by evidence from the supplied document. If the document does not provide enough information to support an answer, CareBridge says so plainly and does not guess or add unsupported medical guidance.
- Additional exchanges are appended below prior exchanges for the current page session.
- A failed question remains visible with its retry action. Earlier successful exchanges remain visible.
- Editing the document clears all prior Q&A exchanges immediately because they refer to the previous text.

Acceptance criteria:

- [ ] A supported question produces an answer with supporting text from the supplied document.
- [ ] A question without sufficient supporting evidence produces a clear message that the document does not provide enough information, without a guessed answer.
- [ ] Submitting a second question leaves the earlier question and answer visible above it.
- [ ] A failed question can be retried without re-entry and does not remove earlier successful exchanges.

Sources: `scope.md > The Unique Kernel`, `The Core Loop`, and `What "Working" Looks Like`.

## States and Boundaries

- **Initial/empty:** The input area is ready for pasted text. Before processing, the results area is hidden or gives a short instruction to paste a summary. Empty or whitespace-only input is rejected with a clear prompt and no request. Over-limit text is rejected with a clear length message, while preserving the user's text.
- **Sample selected:** A synthetic example fills the text area and can be reviewed or edited; no processing starts automatically.
- **Loading:** CareBridge indicates whether it is explaining the document or answering a question. It prevents duplicate submissions while that operation is in progress.
- **Success:** The explanation and source-traceable checklist appear after processing. Each successful Q&A exchange is appended with its answer and supporting source text when available.
- **Document changed:** Editing the text after results exist immediately removes the explanation, checklist, and Q&A history, preserves the edited text, and displays a message such as “Your document has changed. Generate new results to ensure they match the updated text.” The user must start processing again.
- **Document changed during processing:** Results generated from an earlier version of the document are discarded and never shown as if they match the edited text.
- **Recoverable error:** For an explanation or question-answering failure, CareBridge preserves the document and question, shows a clear non-technical error, and offers a retry for the failed operation. It shows loading and prevents duplicate submissions during retry. It never displays fabricated output. A failed question does not remove earlier successful exchanges.
- **Safety:** The page explains that CareBridge helps interpret the supplied text, is not a medical professional or substitute for professional advice, does not diagnose or prescribe, and is not for emergencies. It directs users to a qualified professional for medical decisions and emergency services for emergencies.
- **Temporary session:** Keep document text, generated explanations/checklist, questions, and answers only in active page memory. Do not use a database, persistent browser storage (including local or session storage), or application logs for document contents or generated medical responses. The selected AI provider receives the document/question as needed to process the request; disclose the provider's applicable data handling and retention assumptions. Do not claim the information never leaves CareBridge.

Sources: `scope.md > The POC Boundary` and the learner's PRD interview.

## Product Decisions

- Keep the complete MVP on one responsive page, with three results sections, to demonstrate the full core loop simply.
- Use pasted text from a synthetic discharge summary; no real patient data is needed for the demo.
- Selecting the synthetic sample fills the input but does not process it; users review or edit it before starting.
- Pair every checklist item with its explicit supporting source wording so its origin is visible.
- Append Q&A exchanges in the current page session and do not persist chat history.
- If the document changes, clear outputs and Q&A history immediately, preserve the edited text, and require an explicit new run.
- On failures, preserve inputs, show non-technical errors, and allow retry of the failed operation without fabricated output.
- Reject empty and over-limit document text before making a request. Set and document the numeric limit in `4-spec` based on the selected provider/model.
- Keep document contents and generated medical responses out of application logs and persistent browser storage; disclose provider processing and retention assumptions.
- Treat 2–4 hours as a target and prioritize the smallest complete working demonstration.

## What We're Building

- One responsive page with a CareBridge heading/tagline, brief purpose and safety copy, document text area, synthetic sample option, and primary explain action.
- A plain-language explanation that preserves meaning and flags missing or uncertain details.
- A checklist made only from explicit source instructions, with supporting source wording for every item.
- Document-grounded Q&A with supporting text, clear no-answer behavior, and visible current-session question history.
- Empty, loading, success, document-changed, and recoverable error states as described above.
- Input validation with an empty-input rule and provider-based maximum length.
- Temporary document and Q&A handling, with no database, persistent browser storage, or application logging of health text and generated responses; disclose provider processing and retention assumptions.

## Deferred From the POC

- PDF uploads and extraction: pasted synthetic text is enough to demonstrate the full core loop within the target timebox.
- Authentication, accounts, database, and persistent document or conversation history: the single-page demo does not need them, and document content should remain temporary.
- Features beyond the complete pasted-text workflow: they would make the proof of concept larger without being needed to demonstrate its kernel.

## Possible Later Enhancements

PDF support or broader document types can be considered after the pasted-text workflow is proven. Any later feature must preserve source grounding and the product's safety boundaries.

## Non-Goals

- Diagnosing conditions, recommending or prescribing treatment, or replacing a clinician: CareBridge explains the supplied text and is not a medical professional.
- Inventing missing medication doses, schedules, or care instructions: outputs must remain grounded in explicit source content.
- Emergency guidance or triage: the product is not for emergencies.
- Real patient data in the demo, persistent storage, accounts, or authentication: these are outside the small synthetic-text proof of concept.

## Verification Plan

Before implementation is considered complete, verify these behaviors manually or with focused checks:

- Empty or whitespace-only document input is rejected and no API request is sent.
- A supported question produces an evidence-grounded answer and supporting source text.
- An unsupported or insufficiently supported question clearly says the document does not provide enough information.
- An API failure preserves the document/question, shows a safe error, and allows retry; no fabricated output appears.
- Edit the document while an explanation or question request is in flight; its stale result is discarded, the edited text remains, and no old explanation, checklist, or Q&A history appears as if it matches the edited text.

These remain acceptance checks. At PRD approval time, no application checks had run. Current status is tracked in `todos.md`: mocked browser checks cover retry preservation and document edits during in-flight explanation and question requests; the large-document boundary and final learner walkthrough remain outstanding.

## Open Questions

- Provider/model and provider data-handling assumptions are resolved in the approved `4-spec`. The 20,000-character app limit remains provisional until the large synthetic-document case passes with the actual request and response validation; see `devpost/spec.md` and `todos.md` for current verification status.
