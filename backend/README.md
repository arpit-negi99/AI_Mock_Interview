# Voice-Based AI Mock Interview Backend

Express, MongoDB/Mongoose, JWT, Socket.IO, BullMQ-ready backend for a voice-first mock interview flow.

## Run

```bash
npm install
npm run dev
```

The API starts on `http://localhost:5000`. MongoDB and Redis are optional in development. Without them, the app uses in-memory stores and inline queue execution so the interview flow still works.

## Main Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/interviews/start`
- `POST /api/v1/voice/session/:sessionId/answer`
- `GET /api/v1/voice/session/:sessionId/next-question`
- `POST /api/v1/voice/session/:sessionId/transcribe`
- `POST /api/v1/voice/session/:sessionId/speak`

## Socket Events

Client emits: `interview:start`, `candidate:audio-answer`, `candidate:text-answer`, `interview:next-question`, `interview:end`.

Server emits: `ai:speaking`, `ai:question`, `ai:follow-up`, `ai:clarification`, `transcription:completed`, `interview:processing`, `interview:error`, `interview:ended`.
