import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { POST } from "../app/api/carebridge/route.ts";
import {
  MAX_DOCUMENT_CHARACTERS,
  parseExplanationModelResponse,
  parseQuestionAnswerModelResponse,
  validateDocumentText,
  validateQuestionAnswerResult,
} from "../lib/carebridge.ts";

const SAMPLE = "Follow up with Dr. Rivera on November 12.";
const SAFE_RESULT = {
  explanation: "The document says to see Dr. Rivera on November 12.",
  missingOrUncertain: [],
  checklist: [{ task: "Follow up with Dr. Rivera on November 12.", sourceText: SAMPLE }],
};

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const originalApiToken = process.env.CLOUDFLARE_API_TOKEN;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
  if (originalAccountId === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID = originalAccountId;
  if (originalApiToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = originalApiToken;
});

test("document input rejects blank and over-limit text", () => {
  assert.match(validateDocumentText(" \n  ") ?? "", /Paste your discharge instructions/);
  assert.match(
    validateDocumentText("x".repeat(MAX_DOCUMENT_CHARACTERS + 1)) ?? "",
    /Shorten the text/,
  );
  assert.equal(validateDocumentText("A synthetic discharge summary."), null);
});

test("parser accepts a valid native Cloudflare envelope with expected JSON", () => {
  const validEnvelope = {
    errors: [],
    messages: [],
    result: {
      response: JSON.stringify(SAFE_RESULT),
      usage: { prompt_tokens: 12, completion_tokens: 24, total_tokens: 36 },
    },
    success: true,
  };
  assert.deepEqual(parseExplanationModelResponse(validEnvelope, SAMPLE), {
    ok: true,
    data: SAFE_RESULT,
  });
});

test("parser accepts Gemma chat-completion content inside the native result envelope", () => {
  const payload = {
    success: true,
    result: {
      id: "synthetic-id",
      object: "chat.completion",
      created: 0,
      model: "@cf/google/gemma-4-26b-a4b-it",
      choices: [{
        index: 0,
        message: { role: "assistant", content: JSON.stringify(SAFE_RESULT) },
        finish_reason: "stop",
      }],
      usage: {},
    },
  };

  assert.deepEqual(parseExplanationModelResponse(payload, SAMPLE), {
    ok: true,
    data: SAFE_RESULT,
  });
});

test("parser accepts one complete outer JSON code fence", () => {
  const fencedJson = `\`\`\`json\n${JSON.stringify(SAFE_RESULT)}\n\`\`\``;
  const parsed = parseExplanationModelResponse(
    { success: true, result: { response: fencedJson } },
    SAMPLE,
  );

  assert.deepEqual(parsed, { ok: true, data: SAFE_RESULT });
});

test("parser distinguishes malformed JSON from invalid required fields", () => {
  const malformedJson = parseExplanationModelResponse(
    { success: true, result: { response: "not json" } },
    SAMPLE,
  );
  const missingField = parseExplanationModelResponse(
    {
      success: true,
      result: { response: JSON.stringify({ explanation: "A summary.", checklist: [] }) },
    },
    SAMPLE,
  );
  const invalidField = parseExplanationModelResponse(
    {
      success: true,
      result: {
        response: JSON.stringify({ ...SAFE_RESULT, missingOrUncertain: "not a list" }),
      },
    },
    SAMPLE,
  );

  assert.deepEqual(malformedJson, { ok: false, code: "invalid_model_json" });
  assert.deepEqual(missingField, { ok: false, code: "invalid_model_fields" });
  assert.deepEqual(invalidField, { ok: false, code: "invalid_model_fields" });
});

test("parser classifies a missing or non-true success flag", () => {
  for (const envelope of [
    { result: { response: JSON.stringify(SAFE_RESULT) } },
    { success: false, result: { response: JSON.stringify(SAFE_RESULT) } },
    { success: "true", result: { response: JSON.stringify(SAFE_RESULT) } },
  ]) {
    assert.deepEqual(parseExplanationModelResponse(envelope, SAMPLE), {
      ok: false,
      code: "invalid_cloudflare_success",
    });
  }
});

test("parser classifies a missing or non-object result", () => {
  for (const envelope of [
    { success: true },
    { success: true, result: null },
    { success: true, result: [] },
  ]) {
    assert.deepEqual(parseExplanationModelResponse(envelope, SAMPLE), {
      ok: false,
      code: "invalid_cloudflare_result",
    });
  }
});

test("parser safely distinguishes missing, empty, and non-string result.response", () => {
  for (const response of [undefined, "", "  ", 42, null, { text: "not a string" }]) {
    const result = { success: true, result: {} };
    if (response !== undefined) result.result.response = response;

    const expectedCode = response === undefined
      ? "invalid_cloudflare_result_response_missing"
      : typeof response === "string"
        ? "invalid_cloudflare_result_response_empty"
        : "invalid_cloudflare_result_response_type";
    assert.deepEqual(parseExplanationModelResponse(result, SAMPLE), {
      ok: false,
      code: expectedCode,
    });
  }
});

test("parser rejects malformed chat-completion content without weakening validation", () => {
  const cases = [
    { choices: [] },
    { choices: [{ message: {} }] },
    { choices: [{ message: { content: "  " } }] },
    { choices: [{ message: { content: { text: "not text" } } }] },
  ];

  for (const result of cases) {
    const parsed = parseExplanationModelResponse({ success: true, result }, SAMPLE);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.code, /^invalid_cloudflare_result_response_/);
  }
});

test("parser does not accept prose surrounding a fenced JSON object", () => {
  const response = `Here is the result:\n\`\`\`json\n${JSON.stringify(SAFE_RESULT)}\n\`\`\``;
  assert.deepEqual(
    parseExplanationModelResponse(
      { success: true, result: { response } },
      SAMPLE,
    ),
    { ok: false, code: "invalid_model_json" },
  );
});

test("parser omits checklist items with absent, mismatched, or unsupported wording", () => {
  const modelOutput = {
    ...SAFE_RESULT,
    checklist: [
      ...SAFE_RESULT.checklist,
      { task: "Stop taking your medicine.", sourceText: SAMPLE },
      { task: "Call the hospital.", sourceText: "Call the hospital tomorrow." },
      { task: "", sourceText: SAMPLE },
    ],
  };
  const parsed = parseExplanationModelResponse(
    { success: true, result: { response: JSON.stringify(modelOutput) } },
    SAMPLE,
  );

  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.data.checklist, SAFE_RESULT.checklist);
});

test("question parser returns answers only with exact document evidence", () => {
  const supported = parseQuestionAnswerModelResponse({
    success: true,
    result: {
      response: JSON.stringify({
        answerable: true,
        answer: "The appointment is on November 12.",
        evidence: SAMPLE,
      }),
    },
  }, SAMPLE);
  const unsupported = parseQuestionAnswerModelResponse({
    success: true,
    result: {
      response: JSON.stringify({
        answerable: false,
        answer: "An unsafe guessed dose.",
        evidence: null,
      }),
    },
  }, SAMPLE);

  assert.deepEqual(supported, {
    ok: true,
    data: { answerable: true, answer: "The appointment is on November 12.", evidence: SAMPLE },
  });
  assert.deepEqual(unsupported, {
    ok: true,
    data: {
      answerable: false,
      answer: "The document does not provide enough information to answer this question.",
      evidence: null,
    },
  });
});

test("question parser fails closed for missing or mismatched evidence", () => {
  for (const evidence of [null, "", "Call the clinic tomorrow."]) {
    const result = validateQuestionAnswerResult({
      answerable: true,
      answer: "A model answer without a matching source.",
      evidence,
    }, SAMPLE);
    assert.deepEqual(result, {
      answerable: false,
      answer: "The document does not provide enough information to answer this question.",
      evidence: null,
    });
  }
});

test("question parser safely classifies malformed or incomplete model output", () => {
  assert.deepEqual(
    parseQuestionAnswerModelResponse(
      { success: true, result: { response: "not JSON" } },
      SAMPLE,
    ),
    { ok: false, code: "invalid_model_json" },
  );
  assert.deepEqual(
    parseQuestionAnswerModelResponse(
      { success: true, result: { response: JSON.stringify({ answer: "Missing flag" }) } },
      SAMPLE,
    ),
    { ok: false, code: "invalid_model_fields" },
  );
});

test("route uses the fixed native model and returns only validated application fields", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  let requestedUrl = "";
  let requestedBody;
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    assert.equal(init?.method, "POST");
    requestedBody = JSON.parse(init.body);
    const envelope = { success: true, result: { response: JSON.stringify(SAFE_RESULT) } };
    return new Response(JSON.stringify(envelope), { status: 200 });
  };

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
  }));
  const responseText = await response.text();

  assert.equal(response.status, 200);
  assert.match(requestedUrl, /\/ai\/run\/@cf\/google\/gemma-4-26b-a4b-it$/);
  assert.deepEqual(requestedBody.chat_template_kwargs, { enable_thinking: false });
  assert.equal(requestedBody.max_tokens, 4000);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(JSON.parse(responseText), { status: "success", data: SAFE_RESULT });
  assert.doesNotMatch(responseText, /test-api-token|test-account-id/);
});

test("route answers a document question with a validated answer and exact evidence", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  let providerRequest;
  globalThis.fetch = async (_input, init) => {
    providerRequest = JSON.parse(init.body);
    return new Response(JSON.stringify({
      success: true,
      result: {
        response: JSON.stringify({
          answerable: true,
          answer: "The appointment is on November 12.",
          evidence: SAMPLE,
        }),
      },
    }), { status: 200 });
  };

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operation: "ask",
      documentText: SAMPLE,
      question: "When is the appointment?",
    }),
  }));
  const responseText = await response.text();
  const responseBody = JSON.parse(responseText);

  assert.equal(response.status, 200);
  assert.deepEqual(providerRequest.chat_template_kwargs, { enable_thinking: false });
  assert.match(providerRequest.messages[0].content, /only the supplied synthetic discharge summary/i);
  assert.match(providerRequest.messages[1].content, /When is the appointment\?/);
  assert.deepEqual(responseBody, {
    status: "success",
    data: { answerable: true, answer: "The appointment is on November 12.", evidence: SAMPLE },
  });
  assert.doesNotMatch(responseText, /test-api-token|test-account-id/);
});

test("route accepts Gemma's chat-completion result shape for a question", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    result: {
      id: "synthetic-id",
      object: "chat.completion",
      created: 0,
      model: "@cf/google/gemma-4-26b-a4b-it",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            answerable: true,
            answer: "The appointment is on November 12.",
            evidence: SAMPLE,
          }),
        },
        finish_reason: "stop",
      }],
      usage: {},
    },
  }), { status: 200 });

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operation: "ask",
      documentText: SAMPLE,
      question: "When is the appointment?",
    }),
  }));
  const responseBody = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(responseBody, {
    status: "success",
    data: {
      answerable: true,
      answer: "The appointment is on November 12.",
      evidence: SAMPLE,
    },
  });
});

test("route rejects invalid input without making a provider request", async () => {
  let providerCalled = false;
  globalThis.fetch = async () => {
    providerCalled = true;
    return new Response("{}", { status: 200 });
  };

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "explain", documentText: "  " }),
  }));

  assert.equal(response.status, 400);
  assert.equal(providerCalled, false);
});

test("route safely classifies provider HTTP status families and hides error bodies", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";

  for (const [httpStatus, expectedCode] of [
    [401, "provider_auth_error"],
    [403, "provider_auth_error"],
    [429, "provider_rate_limited"],
    [500, "provider_http_error"],
  ]) {
    globalThis.fetch = async () =>
      new Response("private provider failure detail", { status: httpStatus });

    const response = await POST(new Request("http://localhost/api/carebridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
    }));
    const responseText = await response.text();
    const responseBody = JSON.parse(responseText);

    assert.equal(response.status, 502);
    assert.equal(responseBody.code, expectedCode);
    assert.match(responseText, /try again later/i);
    assert.doesNotMatch(responseText, /private provider|test-api-token|test-account-id/);
  }
});

test("route distinguishes network failure and unreadable provider response safely", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  const cases = [
    {
      fetch: async () => { throw new Error("private transport detail"); },
      code: "provider_network_error",
    },
    {
      fetch: async () => new Response("private invalid provider payload", { status: 200 }),
      code: "invalid_provider_response",
    },
  ];

  for (const testCase of cases) {
    globalThis.fetch = testCase.fetch;
    const response = await POST(new Request("http://localhost/api/carebridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
    }));
    const responseText = await response.text();
    const responseBody = JSON.parse(responseText);

    assert.equal(response.status, 502);
    assert.equal(responseBody.code, testCase.code);
    assert.match(responseBody.message, /try again later/i);
    assert.doesNotMatch(
      responseText,
      /private transport detail|private invalid provider payload|test-api-token|test-account-id/,
    );
  }
});

test("route returns a safe timeout code when its request deadline aborts", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  globalThis.setTimeout = (callback) => {
    queueMicrotask(callback);
    return 1;
  };
  globalThis.fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      if (init.signal.aborted) {
        reject(new Error("private abort detail"));
        return;
      }
      init.signal.addEventListener(
        "abort",
        () => reject(new Error("private abort detail")),
        { once: true },
      );
    });

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
  }));
  const responseText = await response.text();
  const responseBody = JSON.parse(responseText);

  assert.equal(response.status, 502);
  assert.equal(responseBody.code, "provider_timeout");
  assert.match(responseBody.message, /try again later/i);
  assert.doesNotMatch(responseText, /private abort detail|test-api-token|test-account-id/);
});

test("route returns a safe parsing code while keeping its generic message", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  const privateModelText = "malformed synthetic model output";
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ success: true, result: { response: privateModelText } }), {
      status: 200,
    });

  const response = await POST(new Request("http://localhost/api/carebridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
  }));
  const responseText = await response.text();
  const responseBody = JSON.parse(responseText);

  assert.equal(response.status, 502);
  assert.equal(responseBody.code, "invalid_model_json");
  assert.match(responseBody.message, /try again later/i);
  assert.doesNotMatch(
    responseText,
    /malformed synthetic model output|test-api-token|test-account-id/,
  );
});

test("route propagates safe envelope codes with the same generic message and status", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account-id";
  process.env.CLOUDFLARE_API_TOKEN = "test-api-token";
  const invalidResponses = [
    {
      payload: { result: { response: JSON.stringify(SAFE_RESULT) } },
      code: "invalid_cloudflare_success",
    },
    {
      payload: { success: true },
      code: "invalid_cloudflare_result",
    },
    {
      payload: {
        success: true,
        result: { reasoning: "private model response" },
      },
      code: "invalid_cloudflare_result_response_missing",
    },
    {
      payload: {
        success: true,
        result: { response: "  " },
      },
      code: "invalid_cloudflare_result_response_empty",
    },
    {
      payload: {
        success: true,
        result: { response: { text: "private model response" } },
      },
      code: "invalid_cloudflare_result_response_type",
    },
  ];

  for (const invalid of invalidResponses) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(invalid.payload), { status: 200 });

    const response = await POST(new Request("http://localhost/api/carebridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "explain", documentText: SAMPLE }),
    }));
    const responseText = await response.text();
    const responseBody = JSON.parse(responseText);

    assert.equal(response.status, 502);
    assert.equal(responseBody.code, invalid.code);
    assert.equal(
      responseBody.message,
      "We couldn't process these instructions right now. Your text is still here. Please try again later.",
    );
    assert.doesNotMatch(
      responseText,
      /private model response|test-api-token|test-account-id/,
    );
    if (invalid.code === "invalid_cloudflare_result_response_missing") {
      assert.deepEqual(responseBody.diagnostic, { resultFieldNames: ["reasoning"] });
    } else {
      assert.equal(responseBody.diagnostic, undefined);
    }
  }
});
