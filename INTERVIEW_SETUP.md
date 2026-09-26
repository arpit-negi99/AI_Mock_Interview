# Running the interview app

Start the API with `cd backend` then `npm run dev`; start the web app in a second terminal with `cd frontend` then `npm run dev`.

## Gemini and cost

Keep your existing key in `backend/.env`, never in the frontend. This upgrade adds no paid service or dependency. Voice input uses browser speech recognition where supported; playback uses browser speech synthesis. Typed answers work without either browser capability. Recognition support and network requirements vary by browser.

Use a Google AI Studio project on the **Free tier** to avoid generation charges. The app cannot discover or enforce your Google billing tier: if your key belongs to a billed project, Gemini can charge for its API calls, including retries. Do not enable billing to get around quota errors. For completely offline question generation, set `MOCK_AI=true`; this uses the built-in practice engine and labels its feedback as provisional.

The existing configured models are preserved. Check their availability without generating content:

```powershell
cd backend
npm run ai:check
```

This reads model metadata only. It cannot prove available quota or successful generation. Check your limits in Google AI Studio. See [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

Recommended reliability settings (these are also the defaults):

```dotenv
ALLOW_LOCAL_AI_FALLBACK=true
AI_REQUEST_TIMEOUT_MS=12000
AI_TOTAL_TIMEOUT_MS=25000
AI_MAX_ATTEMPTS=2
```

Temporary network/server failures are retried with backoff. Quota errors enter a model cooldown for at least 60 seconds, honoring longer provider retry hints up to one hour. Credential/model configuration failures cool down for five minutes. Restart the API after changing credentials or models. The total budget covers model fallback attempts for a generation; completing an interview may require a second generation for its final summary. The UI allows 60 seconds for the whole answer request.

Responses are validated before they reach the session. Malformed responses, outages, and quota failures can use the built-in question engine. The room displays the current question's AI/practice mode; each answer records its evaluation source, and the report labels provisional estimates. External provider uptime and free quota cannot be guaranteed.

## Interview behavior

- Choose experience, initial difficulty, question count, duration, and follow-up depth.
- Questions use the syllabus, resume where applicable, recent answers, and interview memory. Follow-ups should probe a specific claim, decision, or missing explanation.
- The server enforces question and follow-up limits, even when the LLM proposes something else. The final main answer closes the interview.
- Voice input is reviewed before submission. You can edit or type an answer, then submit with the button or Ctrl/Cmd+Enter. No microphone is opened automatically.
- Reopening the interview URL reloads its saved state. An unsubmitted draft remains in the current page after a failed request, but is not saved across a refresh.
- Concurrent answer/end operations are blocked within a single API process. The browser submits the observed question count to reject stale retries and reloads state after uncertain failures.

## Persistent storage and deployment limits

The earlier Atlas DNS failure is an independent configuration issue. A functioning MongoDB URI is still required for durable accounts, sessions, and reports. In-memory mode loses data on an API restart, and the interview room now says so. Check the Atlas cluster status and current connection string before relying on persistence.

This version targets a single API process. Before deploying multiple API instances, replace the process-local turn lock/cooldowns with shared coordination and use atomic database transactions or compare-and-set writes for session/message/report commits. Cross-document writes are not crash-atomic. Do not describe this development fallback as production storage.

## Verification

Run `npm test` in `backend` and `npm run lint` plus `npm run build` in `frontend`. Tests use mocked provider responses, including timeouts, 429 cooldowns, malformed JSON, model fallback, lifecycle limits, concurrent submissions, stale submissions, and the HTTP interview flow. They do not spend Gemini quota.
