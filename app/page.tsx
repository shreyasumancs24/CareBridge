"use client";

import { FormEvent, useRef, useState } from "react";
import {
  MAX_DOCUMENT_CHARACTERS,
  SAMPLE_DISCHARGE_SUMMARY,
  validateDocumentText,
  validateExplanationResult,
  validateQuestionAnswerResult,
  type ExplanationResult,
  type QuestionAnswerResult,
} from "@/lib/carebridge";

const REQUEST_ERROR =
  "We couldn't explain these instructions right now. Your text is still here. Please try again.";

type ExplainResponse = {
  status?: string;
  data?: unknown;
};

type QuestionExchange = {
  id: number;
  question: string;
  status: "loading" | "success" | "error";
  result?: QuestionAnswerResult;
};

export default function Home() {
  const [documentText, setDocumentText] = useState("");
  const [analysis, setAnalysis] = useState<ExplanationResult | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [inputError, setInputError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [documentChanged, setDocumentChanged] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [questionHistory, setQuestionHistory] = useState<QuestionExchange[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const documentVersion = useRef(0);
  const requestNumber = useRef(0);
  const questionRequestNumber = useRef(0);
  const questionId = useRef(0);
  const questionInProgress = useRef(false);
  const hasSubmitted = useRef(false);

  function updateDocument(value: string) {
    const hadResultsOrRequest = hasSubmitted.current || isExplaining;
    documentVersion.current += 1;
    setDocumentText(value);
    setInputError("");

    if (hadResultsOrRequest) {
      setAnalysis(null);
      setRequestError("");
      setQuestionHistory([]);
      setQuestionError("");
      setQuestionText("");
      questionRequestNumber.current += 1;
      questionInProgress.current = false;
      setIsAnswering(false);
      setDocumentChanged(true);
    }
  }

  async function explainInstructions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateDocumentText(documentText);
    if (validationMessage) {
      setInputError(validationMessage);
      setRequestError("");
      return;
    }

    if (isExplaining) return;

    setInputError("");
    setRequestError("");
    setDocumentChanged(false);
    setAnalysis(null);
    hasSubmitted.current = true;

    const submittedText = documentText;
    const submittedVersion = documentVersion.current;
    const thisRequest = ++requestNumber.current;
    setIsExplaining(true);

    try {
      const response = await fetch("/api/carebridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "explain", documentText: submittedText }),
      });

      const payload = (await response.json()) as ExplainResponse;
      if (
        thisRequest !== requestNumber.current ||
        submittedVersion !== documentVersion.current
      ) {
        return;
      }

      const validResult =
        response.ok && payload.status === "success"
          ? validateExplanationResult(payload.data, submittedText)
          : null;

      if (!validResult) {
        setRequestError(REQUEST_ERROR);
        return;
      }

      setAnalysis(validResult);
    } catch {
      if (
        thisRequest === requestNumber.current &&
        submittedVersion === documentVersion.current
      ) {
        setRequestError(REQUEST_ERROR);
      }
    } finally {
      if (thisRequest === requestNumber.current) {
        setIsExplaining(false);
      }
    }
  }

  async function submitQuestion(question: string, existingId?: number) {
    if (questionInProgress.current || isAnswering || !analysis) return;

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setQuestionError("Enter a question about this document.");
      return;
    }

    setQuestionError("");
    const id = existingId ?? ++questionId.current;
    if (existingId === undefined) {
      setQuestionText("");
      setQuestionHistory((history) => [
        ...history,
        { id, question: cleanQuestion, status: "loading" },
      ]);
    } else {
      setQuestionHistory((history) => history.map((exchange) =>
        exchange.id === id ? { ...exchange, status: "loading", result: undefined } : exchange,
      ));
    }

    const submittedDocument = documentText;
    const submittedVersion = documentVersion.current;
    const thisRequest = ++questionRequestNumber.current;
    questionInProgress.current = true;
    setIsAnswering(true);

    const markFailed = () => {
      setQuestionHistory((history) => history.map((exchange) =>
        exchange.id === id ? { ...exchange, status: "error", result: undefined } : exchange,
      ));
    };

    try {
      const response = await fetch("/api/carebridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "ask",
          documentText: submittedDocument,
          question: cleanQuestion,
        }),
      });
      const payload = (await response.json()) as ExplainResponse;

      if (
        thisRequest !== questionRequestNumber.current ||
        submittedVersion !== documentVersion.current
      ) {
        return;
      }

      const result = response.ok && payload.status === "success"
        ? validateQuestionAnswerResult(payload.data, submittedDocument)
        : null;
      if (!result) {
        markFailed();
        return;
      }

      setQuestionHistory((history) => history.map((exchange) =>
        exchange.id === id ? { ...exchange, status: "success", result } : exchange,
      ));
    } catch {
      if (
        thisRequest === questionRequestNumber.current &&
        submittedVersion === documentVersion.current
      ) {
        markFailed();
      }
    } finally {
      if (thisRequest === questionRequestNumber.current) {
        questionInProgress.current = false;
        setIsAnswering(false);
      }
    }
  }

  function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(questionText);
  }

  const liveInputError =
    documentText.length > MAX_DOCUMENT_CHARACTERS
      ? `Shorten the text to ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters or fewer.`
      : inputError;

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="CareBridge home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>CareBridge</span>
        </a>
        <p className="header-tagline">Understand your discharge instructions with confidence.</p>
      </header>

      <section className="welcome" id="top" aria-labelledby="welcome-title">
        <p className="eyebrow">A clearer next step</p>
        <h1 id="welcome-title">Make your discharge instructions easier to follow.</h1>
        <p className="welcome-copy">
          Paste a discharge summary to get a plain-language explanation and a checklist
          of instructions found in the text.
        </p>
        <p className="safety-note">
          CareBridge can help explain a document, but it is not a medical professional
          and does not replace your care team. It does not diagnose or prescribe. For
          medical decisions, contact a qualified professional. If this is an emergency,
          contact emergency services.
        </p>
      </section>

      <section className="workspace" aria-labelledby="document-title">
        <form onSubmit={explainInstructions} noValidate>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your document</p>
              <h2 id="document-title">Paste your discharge instructions</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => updateDocument(SAMPLE_DISCHARGE_SUMMARY)}
            >
              Try a synthetic sample
            </button>
          </div>

          <label className="sr-only" htmlFor="discharge-summary">
            Discharge summary text
          </label>
          <textarea
            id="discharge-summary"
            className="document-input"
            value={documentText}
            onChange={(event) => updateDocument(event.target.value)}
            placeholder="Paste the text from your discharge summary here…"
            aria-describedby="character-count input-error"
            aria-invalid={Boolean(liveInputError)}
            spellCheck="true"
          />
          <div className="input-meta">
            <p id="character-count" className="character-count" aria-live="polite">
              {documentText.length.toLocaleString()} / {MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters
            </p>
          </div>
          <p id="input-error" className="inline-error" role="alert">
            {liveInputError}
          </p>

          {documentChanged && (
            <p className="notice" role="status">
              Your document has changed. Generate new results to ensure they match the updated text.
            </p>
          )}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={isExplaining}>
              {isExplaining ? "Explaining your instructions…" : "Explain my instructions"}
            </button>
            {isExplaining && <span className="loading-copy" role="status">This may take a moment.</span>}
          </div>
        </form>
      </section>

      <section className="results" aria-labelledby="results-title" aria-live="polite">
        <div className="results-heading">
          <p className="eyebrow">Your results</p>
          <h2 id="results-title">A clearer view of your next steps</h2>
        </div>

        {!analysis && !isExplaining && !requestError && (
          <p className="empty-state">Paste your discharge instructions above, then choose “Explain my instructions.”</p>
        )}

        {requestError && (
          <div className="error-card" role="alert">
            <p>{requestError}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={(event) => {
                const form = event.currentTarget.form ?? event.currentTarget.closest("main")?.querySelector("form");
                form?.requestSubmit();
              }}
              disabled={isExplaining || Boolean(liveInputError)}
            >
              Retry explanation
            </button>
          </div>
        )}

        {analysis && (
          <div className="result-grid">
            <article className="result-card explanation-card" aria-labelledby="explanation-title">
              <div className="card-icon" aria-hidden="true">✦</div>
              <h3 id="explanation-title">Plain-language explanation</h3>
              <p className="result-copy">{analysis.explanation}</p>
              {analysis.missingOrUncertain.length > 0 && (
                <div className="uncertainty-note">
                  <h4>Not clear in the document</h4>
                  <ul>
                    {analysis.missingOrUncertain.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                  </ul>
                </div>
              )}
            </article>

            <article className="result-card checklist-card" aria-labelledby="checklist-title">
              <div className="card-icon checklist-icon" aria-hidden="true">✓</div>
              <h3 id="checklist-title">Follow-up checklist</h3>
              {analysis.checklist.length === 0 ? (
                <p className="muted-copy">No explicit follow-up tasks were found in this document.</p>
              ) : (
                <ul className="checklist">
                  {analysis.checklist.map((item, index) => (
                    <li className="checklist-item" key={`${item.sourceText}-${index}`}>
                      <span className="checkmark" aria-hidden="true">✓</span>
                      <div>
                        <p>{item.task}</p>
                        <blockquote>
                          <span className="source-label">From your document</span>
                          “{item.sourceText}”
                        </blockquote>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="source-reminder">Each listed task includes its source wording. If something is missing or unclear, check with your care team.</p>
            </article>

            <article className="result-card question-card" aria-labelledby="question-title">
              <div className="card-icon question-icon" aria-hidden="true">?</div>
              <h3 id="question-title">Ask a question</h3>
              <p className="muted-copy">You can ask questions about this document. Answers will use only information supported by its text.</p>
              <form className="question-form" onSubmit={askQuestion}>
                <label htmlFor="document-question">Your question</label>
                <textarea
                  id="document-question"
                  className="question-input"
                  value={questionText}
                  onChange={(event) => {
                    setQuestionText(event.target.value);
                    setQuestionError("");
                  }}
                  placeholder="For example: When is my follow-up appointment?"
                  aria-describedby="question-error"
                  aria-invalid={Boolean(questionError)}
                  disabled={isAnswering}
                />
                <p id="question-error" className="inline-error" role="alert">{questionError}</p>
                <button className="secondary-button" type="submit" disabled={isAnswering}>
                  {isAnswering ? "Finding an answer…" : "Ask about this document"}
                </button>
                {isAnswering && <span className="loading-copy" role="status">Checking the document for an answer.</span>}
              </form>

              {questionHistory.length > 0 && (
                <ol className="question-history" aria-label="Question history">
                  {questionHistory.map((exchange) => (
                    <li className="question-exchange" key={exchange.id}>
                      <h4>Your question</h4>
                      <p className="question-copy">{exchange.question}</p>
                      {exchange.status === "loading" && <p className="loading-copy" role="status">Finding an answer…</p>}
                      {exchange.status === "error" && (
                        <div className="question-failure" role="alert">
                          <p>We couldn&apos;t answer that question right now. Your question is still here. Please try again.</p>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void submitQuestion(exchange.question, exchange.id)}
                            disabled={isAnswering}
                          >
                            Retry question
                          </button>
                        </div>
                      )}
                      {exchange.status === "success" && exchange.result && (
                        <div className="question-answer">
                          <h4>Answer</h4>
                          <p className="result-copy">{exchange.result.answer}</p>
                          {exchange.result.evidence && (
                            <blockquote>
                              <span className="source-label">From your document</span>
                              “{exchange.result.evidence}”
                            </blockquote>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <p>CareBridge explains the supplied text; it does not make medical decisions.</p>
        <p>Use synthetic documents only for this proof of concept.</p>
      </footer>
    </main>
  );
}
