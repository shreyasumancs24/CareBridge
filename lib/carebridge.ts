export const MAX_DOCUMENT_CHARACTERS = 20_000;

export const SAMPLE_DISCHARGE_SUMMARY =
  "You are going home today after treatment at the hospital. Drink fluids as tolerated. Follow up with Dr. Rivera on November 12, 2026, at 10 a.m. Call the clinic if you cannot attend. The medication list was reviewed and is attached to your discharge papers. This summary does not state medication doses or schedules.";

export type ChecklistItem = {
  task: string;
  sourceText: string;
};

export type ExplanationResult = {
  explanation: string;
  missingOrUncertain: string[];
  checklist: ChecklistItem[];
};

export type QuestionAnswerResult =
  | { answerable: true; answer: string; evidence: string }
  | { answerable: false; answer: string; evidence: null };

export const INSUFFICIENT_INFORMATION_ANSWER =
  "The document does not provide enough information to answer this question.";

export type ExplanationResponseParseResult =
  | { ok: true; data: ExplanationResult }
  | {
      ok: false;
      code:
        | "invalid_cloudflare_success"
        | "invalid_cloudflare_result"
        | "invalid_cloudflare_result_response_missing"
        | "invalid_cloudflare_result_response_empty"
        | "invalid_cloudflare_result_response_type"
        | "invalid_model_json"
        | "invalid_model_fields";
    };

export function validateDocumentText(value: string): string | null {
  if (!value.trim()) return "Paste your discharge instructions to continue.";
  if (value.length > MAX_DOCUMENT_CHARACTERS) {
    return `Shorten the text to ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters or fewer.`;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type CloudflareResponseExtraction =
  | { ok: true; response: string }
  | {
      ok: false;
      code:
        | "invalid_cloudflare_success"
        | "invalid_cloudflare_result"
        | "invalid_cloudflare_result_response_missing"
        | "invalid_cloudflare_result_response_empty"
        | "invalid_cloudflare_result_response_type";
    };

export function extractCloudflareResponse(payload: unknown): CloudflareResponseExtraction {
  if (!isRecord(payload) || payload.success !== true) {
    return { ok: false, code: "invalid_cloudflare_success" };
  }

  if (!isRecord(payload.result)) {
    return { ok: false, code: "invalid_cloudflare_result" };
  }

  // Cloudflare's native /ai/run response may contain the model result directly
  // in `response`, while chat-style model results use the documented
  // `choices[0].message.content` shape. Accept only these exact text fields.
  let response: unknown;
  if (Object.hasOwn(payload.result, "response")) {
    response = payload.result.response;
  } else {
    const choices = payload.result.choices;
    const firstChoice = Array.isArray(choices) ? choices[0] : undefined;
    const message = isRecord(firstChoice) ? firstChoice.message : undefined;
    if (isRecord(message) && Object.hasOwn(message, "content")) {
      response = message.content;
    } else {
      return { ok: false, code: "invalid_cloudflare_result_response_missing" };
    }
  }

  if (typeof response !== "string") {
    return { ok: false, code: "invalid_cloudflare_result_response_type" };
  }
  if (!response.trim()) {
    return { ok: false, code: "invalid_cloudflare_result_response_empty" };
  }

  return { ok: true, response };
}

export function validateExplanationResult(
  value: unknown,
  documentText: string,
): ExplanationResult | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.explanation !== "string" ||
    !value.explanation.trim() ||
    value.explanation.length > 12_000 ||
    !Array.isArray(value.missingOrUncertain) ||
    !value.missingOrUncertain.every(
      (item) => typeof item === "string" && item.trim().length > 0,
    ) ||
    !Array.isArray(value.checklist)
  ) {
    return null;
  }

  const checklist: ChecklistItem[] = [];
  for (const candidate of value.checklist) {
    if (!isRecord(candidate)) continue;
    if (typeof candidate.task !== "string" || typeof candidate.sourceText !== "string") {
      continue;
    }

    const task = candidate.task.trim();
    const sourceText = candidate.sourceText.trim();
    if (!task || !sourceText) continue;

    // The source excerpt must be present verbatim, and the displayed task must
    // itself be copied from that excerpt. This errs toward omitting uncertain items.
    if (!documentText.includes(sourceText) || !sourceText.includes(task)) continue;

    checklist.push({ task, sourceText });
  }

  return {
    explanation: value.explanation.trim(),
    missingOrUncertain: value.missingOrUncertain.map((item) => item.trim()),
    checklist,
  };
}

export function parseExplanationModelResponse(
  payload: unknown,
  documentText: string,
): ExplanationResponseParseResult {
  const envelope = extractCloudflareResponse(payload);
  if (!envelope.ok) return envelope;

  const trimmedText = envelope.response.trim();
  const completeJsonFence = trimmedText.match(
    /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i,
  );
  const jsonText = completeJsonFence ? completeJsonFence[1].trim() : trimmedText;

  try {
    const parsed: unknown = JSON.parse(jsonText);
    const data = validateExplanationResult(parsed, documentText);
    return data
      ? { ok: true, data }
      : { ok: false, code: "invalid_model_fields" };
  } catch {
    return { ok: false, code: "invalid_model_json" };
  }
}

export function parseQuestionAnswerModelResponse(
  payload: unknown,
  documentText: string,
):
  | { ok: true; data: QuestionAnswerResult }
  | {
      ok: false;
      code:
        | "invalid_cloudflare_success"
        | "invalid_cloudflare_result"
        | "invalid_cloudflare_result_response_missing"
        | "invalid_cloudflare_result_response_empty"
        | "invalid_cloudflare_result_response_type"
        | "invalid_model_json"
        | "invalid_model_fields";
    } {
  const envelope = extractCloudflareResponse(payload);
  if (!envelope.ok) return envelope;

  const trimmedText = envelope.response.trim();
  const completeJsonFence = trimmedText.match(
    /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i,
  );
  const jsonText = completeJsonFence ? completeJsonFence[1].trim() : trimmedText;

  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (
      !isRecord(parsed) ||
      typeof parsed.answerable !== "boolean" ||
      typeof parsed.answer !== "string"
    ) {
      return { ok: false, code: "invalid_model_fields" };
    }
    const data = validateQuestionAnswerResult(parsed, documentText);
    return data
      ? { ok: true, data }
      : { ok: false, code: "invalid_model_fields" };
  } catch {
    return { ok: false, code: "invalid_model_json" };
  }
}

export function validateQuestionAnswerResult(
  value: unknown,
  documentText: string,
): QuestionAnswerResult | null {
  if (
    !isRecord(value) ||
    typeof value.answerable !== "boolean" ||
    typeof value.answer !== "string"
  ) {
    return null;
  }

  if (!value.answerable) {
    return {
      answerable: false,
      answer: INSUFFICIENT_INFORMATION_ANSWER,
      evidence: null,
    };
  }

  const answer = value.answer.trim();
  const evidence = value.evidence;
  if (
    !answer ||
    answer.length > 12_000 ||
    typeof evidence !== "string" ||
    !evidence.trim() ||
    !documentText.includes(evidence)
  ) {
    // An answer without an exact source excerpt is treated as unsupported.
    // Exact presence proves the excerpt occurs in the document, not that every
    // answer claim is entailed by it; the model is instructed to answer narrowly.
    return {
      answerable: false,
      answer: INSUFFICIENT_INFORMATION_ANSWER,
      evidence: null,
    };
  }

  return { answerable: true, answer, evidence };
}
