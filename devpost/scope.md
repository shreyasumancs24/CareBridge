---
doc: scope
status: approved
---

# CareBridge

CareBridge helps recently discharged patients and the people supporting them understand hospital discharge instructions and act on what the document says.

## The Unique Kernel

One supplied discharge summary is the source for all three outputs: a plain-language explanation, a checklist containing only stated follow-up instructions, and answers with supporting text from that document. CareBridge distinguishes what the document explicitly supports from what is missing or uncertain. It never infers medication doses, schedules, or medical instructions, and clearly says when the document does not answer a question.

## Who It's For

Patients recently discharged from a hospital, and family members or caregivers helping them. They need to understand medical terminology and remember follow-up instructions after leaving the hospital.

## The Core Loop

The user pastes a synthetic discharge summary, reads a clear explanation, checks the document-based follow-up list, and asks questions about that same summary. CareBridge shows supporting source text, distinguishes supported details from missing or uncertain details, and states when the supplied document does not contain the answer.

## Inspiration & Identity

A clean, accessible interface that makes complicated instructions easier to read and act on. No specific visual reference was named.

## Why This Matters to the Learner

The learner wants patients and family members to understand complicated discharge instructions after leaving the hospital, so they can act on follow-up guidance without being overwhelmed by medical terminology or forgetting important instructions.

## What "Working" Looks Like

In a short demo, someone pastes a synthetic discharge summary and gets a plain-language explanation that preserves its meaning, a checklist limited to instructions stated in the summary, and a document-grounded answer with supporting source text. CareBridge marks information that is missing or uncertain, never fills gaps with inferred medication doses, schedules, or medical instructions, and clearly says when the summary does not answer a question. The complete pasted-text workflow fits within 2–4 hours of active work.

## The POC Boundary

- Pasted text from a synthetic discharge summary as the input.
- Plain-language explanation that preserves the document's meaning.
- Checklist in which every follow-up task is traceable to an explicit instruction in the source.
- Questions answered from the supplied document, with supporting source text, a distinction between explicit support and missing or uncertain information, or a clear indication that the source does not answer.
- No inferred medication doses, schedules, or medical instructions.
- Clear, accessible interface; no diagnosis, treatment prescription, or invented medication instructions.
- Temporary document handling without storage or content logging; clear limits that the tool does not replace professional medical advice.
- One simple page for the complete pasted-text workflow.
- Treat 2â€“4 hours as a target; prioritize the smallest complete working demonstration.
- The complete pasted-text workflow using a synthetic discharge summary, sized to fit 2–4 hours of active work and a brief screen-based demo.

## Later

- PDF upload and extraction.
- Authentication, a database, and persistent document storage.
- Other features beyond the complete pasted-text core loop.

## Explicitly Cut

- Authentication, a database, and persistent document storage: not needed to demonstrate the single-document workflow, and contents should remain temporary.
- PDF uploads and extraction: pasted synthetic text is enough to demonstrate the core idea within the timebox.
- Features beyond the complete pasted-text core loop: they would dilute the 2–4 hour proof of concept.
- Diagnosing, prescribing treatment, inventing medication instructions, or replacing professional medical advice: outside the product's role and unsafe for this proof of concept.
- Real patient documents in the demo: synthetic documents keep the demonstration focused and avoid exposing health information.
