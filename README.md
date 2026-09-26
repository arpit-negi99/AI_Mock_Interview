# InterviewAI

A full-stack AI mock interview app for practicing technical, behavioral, resume, and project interviews. Candidates can speak or type their answers, explore follow-up questions, and review feedback after a session.

The app uses React and Express, Gemini for AI generation, and MongoDB for persistent storage. A built-in practice engine keeps interviews usable when configured AI services are unavailable.

## Features

- **Five interview tracks:** computer science fundamentals, data structures and algorithms, behavioral, resume, and project interviews.
- **Configurable sessions:** experience level, starting difficulty, duration, main question count, and follow-up depth.
- **Context-aware questions:** prompts include the syllabus, relevant resume information, recent answers, and interview memory.
- **Follow-up controls:** clarification questions, answer-based probes, repetition checks, and server-enforced limits.
- **Voice and text input:** browser speech recognition where supported, editable transcripts, and typed answers throughout the interview.
- **Question playback:** browser speech synthesis without requiring a separate paid speech API in the interview room.
- **Session workspace:** responsive layouts, light/dark themes, timer, progress, and conversation history.
- **Feedback:** answer-by-answer review, strengths, gaps, practice suggestions, analytics, and PDF/CSV/JSON report exports.
- **Authentication:** email verification and password-reset OTPs, hashed passwords, JWT access tokens, and refresh cookies.
- **Failure handling:** bounded AI requests, retries, configured model fallback, quota cooldowns, and labeled practice-mode output.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Tailwind CSS |
| UI and forms | Lucide icons, Framer Motion, React Hook Form |
| API | Node.js, Express 5, Zod |
| Database | MongoDB, Mongoose |
| AI | Gemini REST API, structured JSON output validation |
| Authentication | JSON Web Tokens, bcrypt, HTTP-only refresh cookies |
| Email | Nodemailer with SMTP |
| Voice | Browser speech recognition and speech synthesis; server audio endpoints also exist |
| Other infrastructure | Socket.IO, optional Redis/BullMQ, Winston logging |
| Verification | Node.js test runner, ESLint, Vite production build |

## Prerequisites

- **Node.js 22.12 or later within the 22.x release line**, with npm. This satisfies the installed dependency engine requirements.
- **MongoDB**, either local or an Atlas deployment, for durable accounts and interview history.
- **A Gemini API key** for AI-generated interviews. Local question generation is available without one.
- **SMTP credentials** for account verification and password-reset emails outside automated tests.
- A browser with microphone permission for voice input. Speech recognition support varies; typing remains available.

Redis is optional for local development. Run one backend process for the current session-locking implementation.

## Quick start

Run the following from the project root. The environment-file commands below use PowerShell and preserve existing `.env` files.

### 1. Install dependencies

```powershell
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### 2. Create environment files

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

Edit `backend/.env` with your MongoDB URI, Gemini key, SMTP settings, and a strong `JWT_SECRET`. Set a separate `REFRESH_TOKEN_SECRET` as well; if omitted, the backend falls back to `JWT_SECRET`.

For a local MongoDB instance, a URI can look like:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/interviewai
```

For Atlas, use your cluster's current driver connection string and database credentials. Keep secrets in `backend/.env`; never put API keys, database credentials, or SMTP passwords in `VITE_` variables, which are exposed to the browser.

### 3. Start the API

In one terminal:

```powershell
cd backend
npm run dev
```

The default API base URL is `http://localhost:5000/api/v1`. Confirm that the startup log says `MongoDB connected` before relying on persistent accounts.

### 4. Start the frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`.

## Configuration

### Backend

See [backend/.env.example](backend/.env.example) for the complete sample configuration.

| Variable | Purpose |
| --- | --- |
| `PORT` / `API_PREFIX` | Default API port `5000` and route prefix `/api/v1` |
| `CLIENT_ORIGIN` | Allowed frontend origin; comma-separated origins are supported |
| `MONGODB_URI` | Persistent database connection |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | Access-token and refresh-token signing secrets |
| `MOCK_AI` | Set `false` for Gemini interview generation; `true` for local practice questions |
| `GEMINI_API_KEY` | Server-side Gemini credential |
| `GEMINI_MODEL` | Primary model; the sample config uses `gemini-3.5-flash` |
| `AI_MODEL_FALLBACKS` | Comma-separated model candidates; sample: `gemini:gemini-3.1-flash-lite` |
| `ALLOW_LOCAL_AI_FALLBACK` | Allows local question fallback for general provider failures; enabled by default |
| `AI_REQUEST_TIMEOUT_MS` | Per-attempt timeout, default `12000` ms |
| `AI_TOTAL_TIMEOUT_MS` | Shared generation budget, default and maximum `25000` ms |
| `AI_MAX_ATTEMPTS` | Attempts per model for retryable failures, default `2`, maximum `3` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email transport for verification and password reset |
| `ENABLE_REDIS` / `REDIS_URL` | Optional Redis integration; disabled by default |
| `UPLOAD_DIR` | Local upload directory, default `uploads` |

Quota failures and final-summary failures can still use local fallback even when `ALLOW_LOCAL_AI_FALLBACK=false`. The current backend does not read `REQUIRE_LLM_QUESTIONS`, although it appears in the sample environment file; it does not enforce an AI-only mode.

Restart the backend after changing environment settings.

### Frontend

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=InterviewAI
VITE_ENABLE_MOCKS=false
```

Keep `VITE_ENABLE_MOCKS=false` when using real accounts. Frontend mock authentication and backend local practice generation are separate settings.

## Using the app

1. Register an account and verify the email OTP.
2. Sign in and open **Configure**.
3. Choose a track, experience level, difficulty, duration, question count, and follow-up depth.
4. For resume or project interviews, upload a resume. Use PDF or plain text; dedicated Word-document parsing is not implemented. Project interviews require detected projects.
5. Start the interview. Type an answer or use the microphone, stop recording, and review the transcript.
6. Submit with the button or **Ctrl/Cmd + Enter**. Follow-ups explore the discussion before the interview moves on.
7. Finish the interview to review feedback and export the report.

The last main answer closes the session. Reopening an active interview URL restores server-saved progress; unsubmitted drafts are not saved across refreshes.

## AI availability and cost

No additional paid speech service is needed for the browser-based interview room. Gemini availability, quotas, and charges depend on the API key's project and billing configuration. The app does not enforce a spending cap or verify that a key belongs to a free-tier project.

To avoid interview-generation API requests, set `MOCK_AI=true`. This applies to question generation and final interview evaluation; resume parsing and server-side audio transcription have separate provider paths and can still call external services. Do not treat this flag as a global offline switch.

Check whether the configured models are available to your key:

```powershell
cd backend
npm run ai:check
```

This command reads model metadata without generating content. It does not verify remaining quota, billing tier, or the quality of a generated interview.

The backend retries temporary failures, validates structured responses, and cools down models after quota or configuration errors. Practice-mode questions and heuristic feedback are labeled in the UI. Those estimates are not a verified assessment of technical correctness. External provider uptime cannot be guaranteed.

## Project structure

```text
AI-Interview/
|-- backend/
|   |-- scripts/             # Model-access diagnostics
|   |-- src/
|   |   |-- config/          # Environment, MongoDB, Redis, logging, sockets
|   |   |-- middlewares/     # Authentication, validation, rate limiting
|   |   |-- modules/         # Auth, interviews, resumes, syllabus, users
|   |   |-- services/        # AI, prompts, interview context, reports, voice
|   |   |-- app.js           # Express application
|   |   `-- server.js        # API startup
|   `-- tests/               # Unit and integration tests
|-- frontend/
|   `-- src/
|       |-- components/     # Shared UI, layouts, and voice components
|       |-- context/        # Authentication and theme state
|       |-- hooks/          # Interview and other client behavior
|       |-- pages/          # Public, auth, candidate, interview, report pages
|       |-- services/       # API clients
|       `-- styles/         # Theme tokens and styling
|-- INTERVIEW_SETUP.md      # Additional interview configuration notes
`-- README.md
```

## Main API endpoints

Paths below are relative to `/api/v1`. Interview and resume routes require an authenticated account.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API process health; does not prove database or AI readiness |
| POST | `/auth/register` | Register and request a verification OTP |
| POST | `/auth/verify-registration` | Verify the account and create a session |
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Current user |
| POST | `/auth/refresh-token` | Refresh credentials |
| POST | `/auth/forgot-password` | Request a password-reset OTP |
| POST | `/auth/reset-password` | Set a password using a valid OTP |
| POST | `/auth/logout` | Revoke the refresh session |
| POST | `/interviews/start` | Create an interview |
| GET | `/interviews/:sessionId` | Restore session state and messages |
| POST | `/voice/session/:sessionId/answer` | Submit a typed answer or uploaded audio |
| POST | `/interviews/:sessionId/end` | Complete the interview |
| GET | `/interviews/:sessionId/report` | Retrieve feedback |
| GET | `/interviews/:sessionId/report/export?format=pdf` | Export PDF; also supports `csv` and `json` |
| GET | `/interviews/analytics` | Candidate analytics |
| POST | `/resume/upload` | Upload a resume |

Access tokens use the `Authorization: Bearer <token>` header. Refresh and logout use cookies and CSRF validation; the frontend API client handles these details.

## Tests and builds

Backend:

```powershell
cd backend
npm test
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

The backend suite covers AI failure handling, question limits, context extraction, HTTP interview flows, authentication, password resets, and transitions from temporary storage to MongoDB. Provider calls in reliability tests are mocked; OTP emails are skipped in test mode.

`npm start` in `backend` starts the API without nodemon. The frontend build is written to `frontend/dist`; `npm run preview` serves that build for local inspection.

## Troubleshooting

### MongoDB SRV lookup fails

For `querySrv ENOTFOUND`, check that the Atlas cluster exists and is running, then compare `MONGODB_URI` with its current driver connection string. DNS must resolve the cluster before authentication can occur.

If MongoDB is unavailable, the backend can start with temporary in-memory stores. Accounts and interviews in those stores disappear on restart and are not migrated automatically when MongoDB becomes available.

### Correct credentials are rejected after MongoDB starts working

An account created during temporary-storage mode may not exist in MongoDB. Reload the app to clear a stale login, then sign in with an account in the current database or register and verify a new one. Temporary `user_...` IDs are rejected cleanly rather than sent to MongoDB as ObjectIds.

### Password reset returns 200 but no email arrives

The endpoint intentionally returns the same conditional response for existing and missing accounts. HTTP 200 alone does not confirm an email was sent. Confirm that the account exists and is active, check the spam folder, and verify SMTP configuration and server logs. Reset codes expire after 10 minutes and can be used once.

### Gemini stops responding or reaches quota

Run `npm run ai:check`, inspect server logs, and check the provider project's model access and quota. Restart after changing keys or model names. When fallback is available, continue in the labeled local practice mode.

### Microphone or speech recognition is unavailable

Check browser support and microphone permission. Use localhost or HTTPS for browser microphone access. You can complete the session by typing; the app does not open the microphone automatically.

### Frontend cannot reach the API

Confirm the backend is listening, `VITE_API_BASE_URL` points to the correct API prefix, and `CLIENT_ORIGIN` includes the frontend origin. Restart Vite after changing frontend environment variables.

## Deployment considerations

Use persistent MongoDB storage, HTTPS, strong secrets, working email delivery, and explicit production origins before deploying. Uploaded files currently use local disk storage, so deployment storage must be planned accordingly.

Session mutation locks and provider cooldowns are process-local. Multiple API instances need shared coordination and atomic database updates or transactions. Cross-document session/message/report writes are not crash-atomic. The current implementation should not be presented as a complete production-hardening solution.

For additional details, see [INTERVIEW_SETUP.md](INTERVIEW_SETUP.md), [backend/README.md](backend/README.md), and [frontend/README.md](frontend/README.md).
